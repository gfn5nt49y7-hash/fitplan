import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import type {
  AuthSession,
  ClientSource,
  CreateCustomPlanRequest,
  CreateWorkoutSessionRequest,
  ExerciseSummary,
  KinesiologyModule,
  LoginRequest,
  PlanDifficulty,
  PlannedExercise,
  PlanFocus,
  PlanSummary,
  Profile,
  RegisterRequest,
  UpdateProfileRequest,
  WeeklyStats,
  WorkoutSession,
  WorkoutSetType
} from "@fitplan/contracts";
import { kinesiologyModules } from "../kinesiology.js";
import type { FitPlanStore, PlanDetail } from "./types.js";

const prisma = new PrismaClient();

const workoutInclude = {
  exercises: {
    orderBy: { position: "asc" },
    include: { sets: { orderBy: { setNumber: "asc" } } }
  }
} satisfies Prisma.WorkoutSessionInclude;

type WorkoutRow = Prisma.WorkoutSessionGetPayload<{ include: typeof workoutInclude }>;

type ExerciseRow = {
  id: string;
  name: string;
  slug: string;
  muscleGroup: string;
  equipment: string;
  movementTags: string[];
  instructions: string;
  safetyNotes: string;
  mediaUrl: string | null;
};

type PlanRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  difficulty: string;
  focus: string;
  estimatedMinutes: number;
  daysPerWeek: number;
  isCustom: boolean;
};

function toExercise(row: ExerciseRow): ExerciseSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    muscleGroup: row.muscleGroup,
    equipment: row.equipment,
    movementTags: row.movementTags,
    instructions: row.instructions,
    safetyNotes: row.safetyNotes,
    ...(row.mediaUrl ? { mediaUrl: row.mediaUrl } : {})
  };
}

function toPlanSummary(row: PlanRow): PlanSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    difficulty: row.difficulty as PlanDifficulty,
    focus: row.focus as PlanFocus,
    estimatedMinutes: row.estimatedMinutes,
    daysPerWeek: row.daysPerWeek,
    ...(row.isCustom ? { isCustom: true } : {})
  };
}

function toWorkout(row: WorkoutRow): WorkoutSession {
  return {
    id: row.id,
    ...(row.planId ? { planId: row.planId } : {}),
    ...(row.planName ? { planName: row.planName } : {}),
    ...(row.planDay === null ? {} : { planDay: row.planDay }),
    performedAt: row.performedAt.toISOString(),
    ...(row.durationMinutes === null ? {} : { durationMinutes: row.durationMinutes }),
    ...(row.notes === null ? {} : { notes: row.notes }),
    createdVia: row.createdVia as ClientSource,
    exercises: row.exercises.map((exercise) => ({
      id: exercise.id,
      ...(exercise.exerciseId ? { exerciseId: exercise.exerciseId } : {}),
      exerciseName: exercise.exerciseNameSnapshot,
      position: exercise.position,
      ...(exercise.targetSetsSnapshot === null ? {} : { targetSets: exercise.targetSetsSnapshot }),
      ...(exercise.targetRepsSnapshot === null ? {} : { targetReps: exercise.targetRepsSnapshot }),
      ...(exercise.targetSecondsSnapshot === null
        ? {}
        : { targetSeconds: exercise.targetSecondsSnapshot }),
      ...(exercise.notes === null ? {} : { notes: exercise.notes }),
      sets: exercise.sets.map((set) => ({
        id: set.id,
        setNumber: set.setNumber,
        setType: set.setType as WorkoutSetType,
        ...(set.weightKg === null ? {} : { weightKg: set.weightKg.toNumber() }),
        ...(set.reps === null ? {} : { reps: set.reps }),
        ...(set.durationSeconds === null ? {} : { durationSeconds: set.durationSeconds }),
        ...(set.rpe === null ? {} : { rpe: set.rpe.toNumber() })
      }))
    }))
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** 按「本地日期」取 YYYY-MM-DD，避免 UTC 时区把晚上的训练记到前一天 */
function localDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

function sessionKey(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function toProfile(row: {
  id: string;
  displayName: string;
  email: string;
  status: string;
}): Profile {
  return {
    id: row.id,
    displayName: row.displayName,
    email: row.email,
    status: row.status as Profile["status"]
  };
}

async function issueSession(user: {
  id: string;
  displayName: string;
  email: string;
  status: string;
}): Promise<AuthSession> {
  const accessToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: { tokenHash: sessionKey(accessToken), userId: user.id, expiresAt }
  });

  return {
    user: toProfile(user),
    accessToken,
    expiresAt: expiresAt.toISOString()
  };
}

async function findPlanForUser(
  planId: string,
  userId: string | undefined,
  tx: Prisma.TransactionClient | PrismaClient = prisma
): Promise<PlanRow | null> {
  return tx.plan.findFirst({
    where: {
      id: planId,
      ...(userId ? { OR: [{ isPublished: true }, { ownerId: userId }] } : { isPublished: true })
    }
  });
}

async function resolvePlanName(
  planId: string | undefined,
  planDay: number | undefined,
  userId: string
): Promise<{ planId: string | null; planName: string | null }> {
  if (!planId) return { planId: null, planName: null };
  const plan = await findPlanForUser(planId, userId);
  if (!plan) return { planId: null, planName: null };
  return {
    planId: plan.id,
    planName: plan.name + (planDay ? " · 第" + planDay + "天" : "")
  };
}

/** 只保留数据库里真实存在的动作 ID，避免外键约束报错 */
async function filterKnownExerciseIds(ids: Array<string | undefined>): Promise<Set<string>> {
  const candidates = ids.filter((id): id is string => Boolean(id));
  if (candidates.length === 0) return new Set();
  const rows = await prisma.exercise.findMany({
    where: { id: { in: Array.from(new Set(candidates)) } },
    select: { id: true }
  });
  return new Set(rows.map((row) => row.id));
}

function workoutWriteData(
  input: CreateWorkoutSessionRequest,
  plan: { planId: string | null; planName: string | null },
  knownExerciseIds: Set<string>
): Omit<Prisma.WorkoutSessionCreateInput, "user"> {
  return {
    performedAt: new Date(input.performedAt),
    durationMinutes: input.durationMinutes ?? null,
    notes: input.notes ?? null,
    planDay: input.planDay ?? null,
    planName: plan.planName,
    createdVia: "web",
    ...(plan.planId ? { plan: { connect: { id: plan.planId } } } : {}),
    exercises: {
      create: input.exercises.map((exercise) => ({
        exerciseNameSnapshot: exercise.exerciseName,
        position: exercise.position,
        targetSetsSnapshot: exercise.targetSets ?? null,
        targetRepsSnapshot: exercise.targetReps ?? null,
        targetSecondsSnapshot: exercise.targetSeconds ?? null,
        notes: exercise.notes ?? null,
        ...(exercise.exerciseId && knownExerciseIds.has(exercise.exerciseId)
          ? { exercise: { connect: { id: exercise.exerciseId } } }
          : {}),
        sets: {
          create: exercise.sets.map((set) => ({
            setNumber: set.setNumber,
            setType: set.setType,
            weightKg: set.weightKg ?? null,
            reps: set.reps ?? null,
            durationSeconds: set.durationSeconds ?? null,
            rpe: set.rpe ?? null
          }))
        }
      }))
    }
  };
}

export const prismaStore: FitPlanStore = {
  kind: "postgres",

  async close() {
    await prisma.$disconnect();
  },

  // ---------- 认证 ----------

  async registerUser(input: RegisterRequest) {
    const email = normalizeEmail(input.email);
    const passwordSalt = randomBytes(16).toString("hex");
    try {
      const user = await prisma.user.create({
        data: {
          email,
          displayName: input.displayName.trim(),
          passwordSalt,
          passwordHash: hashPassword(input.password, passwordSalt),
          status: "active"
        }
      });
      return await issueSession(user);
    } catch (error) {
      // 唯一索引兜底：并发注册同一邮箱时只有一个能成功
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return undefined;
      }
      throw error;
    }
  },

  async loginUser(input: LoginRequest) {
    const user = await prisma.user.findUnique({ where: { email: normalizeEmail(input.email) } });
    if (!user || user.status !== "active") return undefined;

    const actual = Buffer.from(hashPassword(input.password, user.passwordSalt), "hex");
    const expected = Buffer.from(user.passwordHash, "hex");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      return undefined;
    }
    return issueSession(user);
  },

  async getUserByToken(token: string) {
    const record = await prisma.session.findUnique({
      where: { tokenHash: sessionKey(token) },
      include: { user: true }
    });
    if (!record) return undefined;

    if (record.expiresAt.getTime() <= Date.now()) {
      await prisma.session.deleteMany({ where: { id: record.id } });
      return undefined;
    }
    if (record.user.status !== "active") return undefined;
    return toProfile(record.user);
  },

  async deleteSession(token: string) {
    await prisma.session.deleteMany({ where: { tokenHash: sessionKey(token) } });
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return user ? toProfile(user) : undefined;
  },

  async updateProfile(userId: string, input: UpdateProfileRequest) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { displayName: input.displayName.trim() }
      });
      return toProfile(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return undefined;
      }
      throw error;
    }
  },

  async deleteUser(userId: string) {
    try {
      // 外键都是 onDelete: Cascade，删除用户会连带清掉会话、训练记录、自定义计划
      await prisma.user.delete({ where: { id: userId } });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return false;
      }
      throw error;
    }
  },

  // ---------- 计划与动作 ----------

  async listPlans(userId?: string) {
    const rows = await prisma.plan.findMany({
      where: userId
        ? { OR: [{ isPublished: true }, { ownerId: userId }] }
        : { isPublished: true },
      orderBy: [{ isCustom: "asc" }, { createdAt: "asc" }, { id: "asc" }]
    });
    return rows.map(toPlanSummary);
  },

  async getPlan(planId: string, userId?: string): Promise<PlanDetail | undefined> {
    const row = await prisma.plan.findFirst({
      where: {
        id: planId,
        ...(userId ? { OR: [{ isPublished: true }, { ownerId: userId }] } : { isPublished: true })
      },
      include: {
        exercises: {
          orderBy: [{ dayNumber: "asc" }, { position: "asc" }],
          include: { exercise: true }
        }
      }
    });
    if (!row) return undefined;

    const exercises: PlannedExercise[] = row.exercises.map((item) => ({
      id: item.id,
      exercise: toExercise(item.exercise),
      dayNumber: item.dayNumber,
      position: item.position,
      targetSets: item.targetSets,
      ...(item.targetReps === null ? {} : { targetReps: item.targetReps }),
      ...(item.targetSeconds === null ? {} : { targetSeconds: item.targetSeconds })
    }));

    return { plan: toPlanSummary(row), exercises };
  },

  async createCustomPlan(userId: string, input: CreateCustomPlanRequest) {
    const known = await filterKnownExerciseIds(input.exercises.map((item) => item.exerciseId));
    for (const item of input.exercises) {
      if (!known.has(item.exerciseId)) throw new Error("Unknown exercise: " + item.exerciseId);
    }

    const id = randomUUID();
    const row = await prisma.plan.create({
      data: {
        id,
        name: input.name.trim(),
        slug: "custom-" + id,
        description: "由你自定义动作、组数和次数的训练计划。",
        difficulty: "beginner",
        focus: input.focus,
        estimatedMinutes: input.estimatedMinutes,
        daysPerWeek: 1,
        isCustom: true,
        isPublished: false,
        ownerId: userId,
        exercises: {
          create: input.exercises.map((item, index) => ({
            exerciseId: item.exerciseId,
            dayNumber: 1,
            position: index + 1,
            targetSets: item.targetSets,
            targetReps: item.targetReps
          }))
        }
      }
    });

    const detail = await prismaStore.getPlan(row.id, userId);
    if (!detail) throw new Error("Custom plan was not created");
    return detail;
  },

  async deleteCustomPlan(userId: string, planId: string) {
    const result = await prisma.plan.deleteMany({
      where: { id: planId, ownerId: userId, isCustom: true }
    });
    return result.count > 0;
  },

  async getExercises() {
    const rows = await prisma.exercise.findMany({
      where: { isPublished: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }]
    });
    return rows.map(toExercise);
  },

  async getKinesiologyModules(): Promise<KinesiologyModule[]> {
    // 运动学内容属于静态知识库，不落库
    return structuredClone(kinesiologyModules);
  },

  // ---------- 训练记录 ----------

  async listWorkouts(userId: string) {
    const rows = await prisma.workoutSession.findMany({
      where: { userId },
      orderBy: [{ performedAt: "desc" }, { createdAt: "desc" }],
      include: workoutInclude
    });
    return rows.map(toWorkout);
  },

  async createWorkout(userId: string, input: CreateWorkoutSessionRequest) {
    const plan = await resolvePlanName(input.planId, input.planDay, userId);
    const known = await filterKnownExerciseIds(
      input.exercises.map((exercise) => exercise.exerciseId)
    );

    const row = await prisma.workoutSession.create({
      data: {
        ...workoutWriteData(input, plan, known),
        user: { connect: { id: userId } }
      },
      include: workoutInclude
    });
    return toWorkout(row);
  },

  async updateWorkout(userId: string, workoutId: string, input: CreateWorkoutSessionRequest) {
    const plan = await resolvePlanName(input.planId, input.planDay, userId);
    const known = await filterKnownExerciseIds(
      input.exercises.map((exercise) => exercise.exerciseId)
    );

    return prisma.$transaction(async (tx) => {
      const existing = await tx.workoutSession.findFirst({
        where: { id: workoutId, userId },
        select: { id: true }
      });
      if (!existing) return undefined;

      // 动作和组是整体替换：先删旧的，再按新数据重建（同一事务内，要么全成要么全滚）
      await tx.workoutSessionExercise.deleteMany({ where: { sessionId: workoutId } });

      const row = await tx.workoutSession.update({
        where: { id: workoutId },
        data: {
          performedAt: new Date(input.performedAt),
          durationMinutes: input.durationMinutes ?? null,
          notes: input.notes ?? null,
          planDay: input.planDay ?? null,
          planName: plan.planName,
          ...(plan.planId ? { plan: { connect: { id: plan.planId } } } : { plan: { disconnect: true } }),
          exercises: workoutWriteData(input, plan, known).exercises
        },
        include: workoutInclude
      });
      return toWorkout(row);
    });
  },

  async deleteWorkout(userId: string, workoutId: string) {
    const result = await prisma.workoutSession.deleteMany({ where: { id: workoutId, userId } });
    return result.count > 0;
  },

  async getWeeklyStats(userId: string): Promise<WeeklyStats> {
    const now = new Date();
    const weekStart = new Date(now);
    const mondayOffset = (weekStart.getDay() + 6) % 7;
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - mondayOffset);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekRange = { userId, performedAt: { gte: weekStart, lt: weekEnd } };
    const setScope = { sessionExercise: { session: weekRange } };

    // 本周四次聚合全部交给数据库算，不用把明细拉回内存
    const [workoutCount, totalSets, repsSum, durationSum] = await Promise.all([
      prisma.workoutSession.count({ where: weekRange }),
      prisma.workoutSet.count({ where: setScope }),
      prisma.workoutSet.aggregate({ _sum: { reps: true }, where: setScope }),
      prisma.workoutSession.aggregate({ _sum: { durationMinutes: true }, where: weekRange })
    ]);

    const trainedRows = await prisma.$queryRaw<Array<{ performed_at: Date }>>`
      SELECT DISTINCT performed_at
      FROM workout_sessions
      WHERE user_id = ${userId}
    `;
    const trainedDates = new Set(trainedRows.map((row) => localDayKey(new Date(row.performed_at))));

    let cursor = new Date(now);
    cursor.setHours(0, 0, 0, 0);
    if (!trainedDates.has(localDayKey(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    let streakDays = 0;
    while (trainedDates.has(localDayKey(cursor))) {
      streakDays += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return {
      weekStart: weekStart.toISOString(),
      workoutCount,
      totalSets,
      totalReps: repsSum._sum.reps ?? 0,
      totalDurationMinutes: durationSum._sum.durationMinutes ?? 0,
      streakDays
    };
  }
};
