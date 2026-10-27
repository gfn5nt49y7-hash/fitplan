import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import type {
  AuthSession,
  CreateCustomPlanRequest,
  CreateWorkoutSessionRequest,
  ExerciseSummary,
  LoginRequest,
  PlannedExercise,
  PlanSummary,
  Profile,
  RegisterRequest,
  UpdateProfileRequest,
  WeeklyStats,
  WorkoutSession
} from "@fitplan/contracts";

const exercises: ExerciseSummary[] = [
  {
    id: "exercise-squat",
    name: "徒手深蹲",
    slug: "bodyweight-squat",
    muscleGroup: "腿部与臀部",
    equipment: "无器械",
    instructions: "双脚与肩同宽，脚尖略微向外。向后坐髋并屈膝下蹲，保持膝盖与脚尖方向一致，再平稳站起。",
    safetyNotes: "保持背部中立，不要为了追求深度而失去平衡。出现膝部疼痛时立即停止。"
  },
  {
    id: "exercise-pushup",
    name: "跪姿俯卧撑",
    slug: "kneeling-pushup",
    muscleGroup: "胸部与手臂",
    equipment: "无器械",
    instructions: "双膝着地，手掌略宽于肩，身体从头到膝保持一条直线。屈肘下降后推回起始位置。",
    safetyNotes: "避免塌腰和耸肩。如手腕不适，可使用俯卧撑支架或改为墙面俯卧撑。"
  },
  {
    id: "exercise-bridge",
    name: "臀桥",
    slug: "glute-bridge",
    muscleGroup: "臀部与后侧链",
    equipment: "无器械",
    instructions: "仰卧屈膝，双脚踩地。收紧臀部抬高髋部，在顶端短暂停留，再缓慢下降。",
    safetyNotes: "不要过度挺腰。主要发力应来自臀部，而不是下背部。"
  },
  {
    id: "exercise-bench",
    name: "哑铃卧推",
    slug: "dumbbell-bench-press",
    muscleGroup: "胸部与手臂",
    equipment: "哑铃与训练凳",
    instructions: "肩胛骨向后下方收紧，将哑铃稳定下放至胸部两侧，再沿可控轨迹推起。",
    safetyNotes: "建议有人保护或使用安全架。不要盲目增加重量。"
  },
  {
    id: "exercise-row",
    name: "坐姿划船",
    slug: "seated-row",
    muscleGroup: "背部与手臂",
    equipment: "弹力带或器械",
    instructions: "保持躯干稳定，将手柄拉向腹部，肩胛骨向后收拢，再缓慢伸直手臂。",
    safetyNotes: "避免耸肩和用身体后仰借力，保持动作可控。"
  },
  {
    id: "exercise-overhead-press",
    name: "哑铃肩上推举",
    slug: "dumbbell-overhead-press",
    muscleGroup: "肩部与手臂",
    equipment: "哑铃",
    instructions: "坐姿或站姿保持核心收紧，将哑铃从肩部两侧向上推至手臂接近伸直，再缓慢下降。",
    safetyNotes: "避免腰部过度后仰。肩部疼痛时停止动作并降低重量。"
  },
  {
    id: "exercise-lat-pulldown",
    name: "高位下拉",
    slug: "lat-pulldown",
    muscleGroup: "背部与手臂",
    equipment: "器械",
    instructions: "坐稳并保持胸部抬起，将横杆拉向上胸部，肩胛骨向下收拢，再缓慢伸直手臂。",
    safetyNotes: "不要把横杆拉到颈后，也不要用身体大幅后仰借力。"
  },
  {
    id: "exercise-romanian-deadlift",
    name: "哑铃罗马尼亚硬拉",
    slug: "dumbbell-romanian-deadlift",
    muscleGroup: "臀部与后侧链",
    equipment: "哑铃",
    instructions: "双手持哑铃，膝盖微屈，向后推髋下放重量，感受大腿后侧拉伸后收紧臀部站起。",
    safetyNotes: "保持背部中立，重量贴近身体。腰部不适时立即停止。"
  },
  {
    id: "exercise-reverse-lunge",
    name: "反向箭步蹲",
    slug: "reverse-lunge",
    muscleGroup: "腿部与臀部",
    equipment: "无器械",
    instructions: "一腿向后跨步并屈膝下沉，前脚掌稳定发力返回，左右腿交替完成。",
    safetyNotes: "保持膝盖与脚尖方向一致，可扶墙保持平衡。"
  },
  {
    id: "exercise-calf-raise",
    name: "站姿提踵",
    slug: "standing-calf-raise",
    muscleGroup: "小腿",
    equipment: "无器械",
    instructions: "站稳后缓慢踮起脚尖，在最高点停留，再控制脚跟下降。",
    safetyNotes: "可以扶墙保持平衡，避免快速弹跳。"
  },
  {
    id: "exercise-biceps-curl",
    name: "哑铃弯举",
    slug: "dumbbell-biceps-curl",
    muscleGroup: "手臂",
    equipment: "哑铃",
    instructions: "保持上臂贴近身体，屈肘举起哑铃并在顶端收紧，再缓慢下放。",
    safetyNotes: "避免摆动身体借力，手腕保持中立。"
  },
  {
    id: "exercise-triceps-pushdown",
    name: "绳索下压",
    slug: "triceps-pushdown",
    muscleGroup: "手臂",
    equipment: "器械",
    instructions: "固定上臂位置，将绳索向下压至手臂伸直，再控制返回。",
    safetyNotes: "肘部保持贴近身体，不要用肩部推动重量。"
  },
  {
    id: "exercise-plank",
    name: "平板支撑",
    slug: "plank",
    muscleGroup: "核心",
    equipment: "无器械",
    instructions: "前臂撑地，身体从头到脚保持直线，收紧腹部和臀部并保持自然呼吸。",
    safetyNotes: "不要塌腰或憋气，腰部不适时结束动作。"
  },
  {
    id: "exercise-chest-fly",
    name: "哑铃飞鸟",
    slug: "dumbbell-chest-fly",
    muscleGroup: "胸部与手臂",
    equipment: "哑铃与训练凳",
    instructions: "仰卧持哑铃，手肘微屈，将双臂沿弧线向两侧下放，再用胸部发力合拢。",
    safetyNotes: "使用可控重量，肩部不适时缩小活动范围或停止动作。"
  },
  {
    id: "exercise-lateral-raise",
    name: "哑铃侧平举",
    slug: "dumbbell-lateral-raise",
    muscleGroup: "肩部与手臂",
    equipment: "哑铃",
    instructions: "身体站稳，手肘微屈，将哑铃向身体两侧抬至接近肩高，再缓慢下放。",
    safetyNotes: "避免耸肩和摆动借力，不需要刻意抬过肩部。"
  },
  {
    id: "exercise-face-pull",
    name: "绳索面拉",
    slug: "cable-face-pull",
    muscleGroup: "肩部与背部",
    equipment: "器械",
    instructions: "将绳索拉向面部，手肘向外展开并收拢肩胛骨，再控制返回。",
    safetyNotes: "保持躯干稳定，使用轻到中等重量完成。"
  },
  {
    id: "exercise-one-arm-row",
    name: "哑铃单臂划船",
    slug: "dumbbell-one-arm-row",
    muscleGroup: "背部与手臂",
    equipment: "哑铃",
    instructions: "一手支撑训练凳，保持背部平直，将哑铃拉向髋部，再缓慢下放。",
    safetyNotes: "避免躯干旋转和耸肩，左右两侧分别完成。"
  },
  {
    id: "exercise-dead-bug",
    name: "死虫式",
    slug: "dead-bug",
    muscleGroup: "核心",
    equipment: "无器械",
    instructions: "仰卧抬起双臂和双腿，保持腰部贴近地面，交替伸展对侧手臂与腿后返回。",
    safetyNotes: "动作过程中持续收紧腹部，不要憋气或过度挺腰。"
  }
];

const exerciseMap = new Map(exercises.map((exercise) => [exercise.id, exercise]));

const plans: PlanSummary[] = [
  {
    id: "plan-full-body-2",
    name: "全身两练",
    slug: "full-body-2",
    description: "每周两次全身训练，时间少也能覆盖主要肌群。",
    difficulty: "beginner",
    focus: "full_body",
    estimatedMinutes: 30,
    daysPerWeek: 2
  },
  {
    id: "plan-three-days",
    name: "全身三练",
    slug: "full-body-3",
    description: "每周三次全身基础训练，适合建立稳定训练习惯。",
    difficulty: "beginner",
    focus: "full_body",
    estimatedMinutes: 35,
    daysPerWeek: 3
  },
  {
    id: "plan-upper-lower",
    name: "上下肢分化",
    slug: "upper-lower",
    description: "上肢和下肢交替训练，每周四练，适合有一定基础的训练者。",
    difficulty: "intermediate",
    focus: "split",
    estimatedMinutes: 45,
    daysPerWeek: 4
  },
  {
    id: "plan-ppl",
    name: "推拉腿分化",
    slug: "push-pull-legs",
    description: "按推、拉、腿分组，每周三练，训练目标更集中。",
    difficulty: "intermediate",
    focus: "split",
    estimatedMinutes: 45,
    daysPerWeek: 3
  },
  {
    id: "plan-five-by-five",
    name: "5×5 基础力量",
    slug: "five-by-five",
    description: "围绕复合动作完成五组五次，优先建立基础力量。",
    difficulty: "intermediate",
    focus: "strength",
    estimatedMinutes: 40,
    daysPerWeek: 3
  },
  {
    id: "plan-home",
    name: "居家训练",
    slug: "home-workout",
    description: "无需器械，用自重动作完成低门槛全身训练。",
    difficulty: "beginner",
    focus: "full_body",
    estimatedMinutes: 25,
    daysPerWeek: 3
  },
  {
    id: "plan-chest",
    name: "胸部训练",
    slug: "chest-workout",
    description: "围绕水平推和胸部内收，适合单独安排胸部训练日。",
    difficulty: "intermediate",
    focus: "chest",
    estimatedMinutes: 40,
    daysPerWeek: 2
  },
  {
    id: "plan-shoulders",
    name: "肩部训练",
    slug: "shoulder-workout",
    description: "覆盖肩上推举、侧平举和肩后束，兼顾力量与稳定性。",
    difficulty: "intermediate",
    focus: "shoulders",
    estimatedMinutes: 35,
    daysPerWeek: 2
  },
  {
    id: "plan-back",
    name: "背部训练",
    slug: "back-workout",
    description: "结合垂直拉与水平拉，训练背阔肌、上背和手臂协同。",
    difficulty: "intermediate",
    focus: "back",
    estimatedMinutes: 40,
    daysPerWeek: 2
  },
  {
    id: "plan-legs",
    name: "腿部训练",
    slug: "leg-workout",
    description: "覆盖大腿前侧、后侧、臀部和提踵动作，建立下肢力量。",
    difficulty: "intermediate",
    focus: "legs",
    estimatedMinutes: 45,
    daysPerWeek: 2
  },
  {
    id: "plan-arms",
    name: "手臂训练",
    slug: "arm-workout",
    description: "集中训练肱二头肌和肱三头肌，可作为上肢训练的补充。",
    difficulty: "beginner",
    focus: "arms",
    estimatedMinutes: 30,
    daysPerWeek: 2
  },
  {
    id: "plan-core",
    name: "核心训练",
    slug: "core-workout",
    description: "用静态支撑和抗伸展动作训练腹部与躯干稳定性。",
    difficulty: "beginner",
    focus: "core",
    estimatedMinutes: 25,
    daysPerWeek: 3
  }
];

function planned(
  id: string,
  exerciseId: string,
  position: number,
  targetSets: number,
  targetReps?: number,
  targetSeconds?: number
): PlannedExercise {
  const exercise = exerciseMap.get(exerciseId);
  if (!exercise) throw new Error("Unknown exercise: " + exerciseId);
  return {
    id,
    exercise,
    dayNumber: 1,
    position,
    targetSets,
    ...(targetReps === undefined ? {} : { targetReps }),
    ...(targetSeconds === undefined ? {} : { targetSeconds })
  };
}

function plannedOnDay(
  id: string,
  exerciseId: string,
  dayNumber: number,
  position: number,
  targetSets: number,
  targetReps?: number,
  targetSeconds?: number
): PlannedExercise {
  const item = planned(id, exerciseId, position, targetSets, targetReps, targetSeconds);
  item.dayNumber = dayNumber;
  return item;
}

const planExercises = new Map<string, PlannedExercise[]>([
  [
    "plan-full-body-2",
    [
      planned("pe-fb2-squat", "exercise-squat", 1, 3, 10),
      planned("pe-fb2-pushup", "exercise-pushup", 2, 3, 8),
      planned("pe-fb2-row", "exercise-row", 3, 3, 10),
      planned("pe-fb2-bridge", "exercise-bridge", 4, 3, 12),
      planned("pe-fb2-plank", "exercise-plank", 5, 3, undefined, 30)
    ]
  ],
  [
    "plan-three-days",
    [
      planned("pe-fb3-squat", "exercise-squat", 1, 3, 10),
      planned("pe-fb3-bench", "exercise-bench", 2, 3, 8),
      planned("pe-fb3-row", "exercise-row", 3, 3, 10),
      planned("pe-fb3-rdl", "exercise-romanian-deadlift", 4, 3, 8),
      planned("pe-fb3-press", "exercise-overhead-press", 5, 3, 8),
      planned("pe-fb3-plank", "exercise-plank", 6, 3, undefined, 30)
    ]
  ],
  [
    "plan-upper-lower",
    [
      plannedOnDay("pe-ul-u1-bench", "exercise-bench", 1, 1, 4, 8),
      plannedOnDay("pe-ul-u1-row", "exercise-row", 1, 2, 4, 10),
      plannedOnDay("pe-ul-u1-press", "exercise-overhead-press", 1, 3, 3, 10),
      plannedOnDay("pe-ul-u1-curl", "exercise-biceps-curl", 1, 4, 3, 12),
      plannedOnDay("pe-ul-l1-squat", "exercise-squat", 2, 1, 4, 10),
      plannedOnDay("pe-ul-l1-rdl", "exercise-romanian-deadlift", 2, 2, 4, 8),
      plannedOnDay("pe-ul-l1-lunge", "exercise-reverse-lunge", 2, 3, 3, 10),
      plannedOnDay("pe-ul-l1-calf", "exercise-calf-raise", 2, 4, 4, 15),
      plannedOnDay("pe-ul-u2-pull", "exercise-lat-pulldown", 3, 1, 4, 10),
      plannedOnDay("pe-ul-u2-pushup", "exercise-pushup", 3, 2, 3, 10),
      plannedOnDay("pe-ul-u2-row", "exercise-row", 3, 3, 3, 12),
      plannedOnDay("pe-ul-u2-triceps", "exercise-triceps-pushdown", 3, 4, 3, 12),
      plannedOnDay("pe-ul-l2-rdl", "exercise-romanian-deadlift", 4, 1, 4, 8),
      plannedOnDay("pe-ul-l2-lunge", "exercise-reverse-lunge", 4, 2, 3, 12),
      plannedOnDay("pe-ul-l2-bridge", "exercise-bridge", 4, 3, 3, 15),
      plannedOnDay("pe-ul-l2-plank", "exercise-plank", 4, 4, 3, undefined, 45)
    ]
  ],
  [
    "plan-ppl",
    [
      plannedOnDay("pe-ppl-push-bench", "exercise-bench", 1, 1, 4, 8),
      plannedOnDay("pe-ppl-push-press", "exercise-overhead-press", 1, 2, 3, 10),
      plannedOnDay("pe-ppl-push-pushup", "exercise-pushup", 1, 3, 3, 12),
      plannedOnDay("pe-ppl-push-triceps", "exercise-triceps-pushdown", 1, 4, 3, 12),
      plannedOnDay("pe-ppl-pull-row", "exercise-row", 2, 1, 4, 10),
      plannedOnDay("pe-ppl-pull-lat", "exercise-lat-pulldown", 2, 2, 4, 10),
      plannedOnDay("pe-ppl-pull-curl", "exercise-biceps-curl", 2, 3, 3, 12),
      plannedOnDay("pe-ppl-legs-squat", "exercise-squat", 3, 1, 4, 10),
      plannedOnDay("pe-ppl-legs-rdl", "exercise-romanian-deadlift", 3, 2, 3, 8),
      plannedOnDay("pe-ppl-legs-lunge", "exercise-reverse-lunge", 3, 3, 3, 10),
      plannedOnDay("pe-ppl-legs-calf", "exercise-calf-raise", 3, 4, 4, 15)
    ]
  ],
  [
    "plan-five-by-five",
    [
      plannedOnDay("pe-55-a-squat", "exercise-squat", 1, 1, 5, 5),
      plannedOnDay("pe-55-a-bench", "exercise-bench", 1, 2, 5, 5),
      plannedOnDay("pe-55-a-row", "exercise-row", 1, 3, 5, 5),
      plannedOnDay("pe-55-b-squat", "exercise-squat", 2, 1, 5, 5),
      plannedOnDay("pe-55-b-press", "exercise-overhead-press", 2, 2, 5, 5),
      plannedOnDay("pe-55-b-rdl", "exercise-romanian-deadlift", 2, 3, 3, 5)
    ]
  ],
  [
    "plan-home",
    [
      planned("pe-home-squat", "exercise-squat", 1, 3, 12),
      planned("pe-home-pushup", "exercise-pushup", 2, 3, 8),
      planned("pe-home-bridge", "exercise-bridge", 3, 3, 15),
      planned("pe-home-lunge", "exercise-reverse-lunge", 4, 3, 10),
      planned("pe-home-plank", "exercise-plank", 5, 3, undefined, 30)
    ]
  ],
  [
    "plan-chest",
    [
      planned("pe-chest-bench", "exercise-bench", 1, 4, 8),
      planned("pe-chest-pushup", "exercise-pushup", 2, 3, 10),
      planned("pe-chest-fly", "exercise-chest-fly", 3, 3, 12),
      planned("pe-chest-triceps", "exercise-triceps-pushdown", 4, 3, 12)
    ]
  ],
  [
    "plan-shoulders",
    [
      planned("pe-shoulders-press", "exercise-overhead-press", 1, 4, 8),
      planned("pe-shoulders-raise", "exercise-lateral-raise", 2, 3, 12),
      planned("pe-shoulders-face-pull", "exercise-face-pull", 3, 3, 15),
      planned("pe-shoulders-plank", "exercise-plank", 4, 3, undefined, 30)
    ]
  ],
  [
    "plan-back",
    [
      planned("pe-back-row", "exercise-row", 1, 4, 10),
      planned("pe-back-lat", "exercise-lat-pulldown", 2, 4, 10),
      planned("pe-back-one-arm-row", "exercise-one-arm-row", 3, 3, 12),
      planned("pe-back-face-pull", "exercise-face-pull", 4, 3, 15),
      planned("pe-back-curl", "exercise-biceps-curl", 5, 3, 12)
    ]
  ],
  [
    "plan-legs",
    [
      planned("pe-legs-squat", "exercise-squat", 1, 4, 10),
      planned("pe-legs-rdl", "exercise-romanian-deadlift", 2, 4, 8),
      planned("pe-legs-lunge", "exercise-reverse-lunge", 3, 3, 10),
      planned("pe-legs-bridge", "exercise-bridge", 4, 3, 15),
      planned("pe-legs-calf", "exercise-calf-raise", 5, 4, 15)
    ]
  ],
  [
    "plan-arms",
    [
      planned("pe-arms-curl", "exercise-biceps-curl", 1, 4, 12),
      planned("pe-arms-triceps", "exercise-triceps-pushdown", 2, 4, 12),
      planned("pe-arms-pushup", "exercise-pushup", 3, 3, 10)
    ]
  ],
  [
    "plan-core",
    [
      planned("pe-core-plank", "exercise-plank", 1, 3, undefined, 30),
      planned("pe-core-dead-bug", "exercise-dead-bug", 2, 3, 10),
      planned("pe-core-bridge", "exercise-bridge", 3, 3, 15)
    ]
  ]
]);

interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  passwordSalt: string;
  passwordHash: string;
  status: Profile["status"];
}

interface SessionRecord {
  userId: string;
  expiresAt: Date;
}

const usersByEmail = new Map<string, UserRecord>();
const usersById = new Map<string, UserRecord>();
const sessions = new Map<string, SessionRecord>();
const workoutsByUser = new Map<string, WorkoutSession[]>();
const customPlansByUser = new Map<string, PlanSummary[]>();
const customPlanExercisesByUser = new Map<string, PlannedExercise[]>();

function clone<T>(value: T): T {
  return structuredClone(value);
}

function listPlans(userId?: string): PlanSummary[] {
  return clone(plans.concat(userId ? customPlansByUser.get(userId) ?? [] : []));
}

function getPlan(planId: string, userId?: string) {
  const customPlans = userId ? customPlansByUser.get(userId) ?? [] : [];
  const plan = plans.concat(customPlans).find((item) => item.id === planId);
  if (!plan) return undefined;
  return {
    plan: clone(plan),
    exercises: clone(
      planExercises.get(planId) ??
        (userId ? customPlanExercisesByUser.get(planId) ?? [] : [])
    )
  };
}

function createCustomPlan(userId: string, input: CreateCustomPlanRequest) {
  const plannedExercises: PlannedExercise[] = input.exercises.map(function (item, index) {
    const exercise = exerciseMap.get(item.exerciseId);
    if (!exercise) throw new Error("Unknown exercise: " + item.exerciseId);
    return {
      id: randomUUID(),
      exercise: clone(exercise),
      dayNumber: 1,
      position: index + 1,
      targetSets: item.targetSets,
      targetReps: item.targetReps
    };
  });

  const id = randomUUID();
  const plan: PlanSummary = {
    id,
    name: input.name.trim(),
    slug: "custom-" + id,
    description: "由你自定义动作、组数和次数的训练计划。",
    difficulty: "beginner",
    focus: input.focus,
    estimatedMinutes: input.estimatedMinutes,
    daysPerWeek: 1,
    isCustom: true
  };
  const currentPlans = customPlansByUser.get(userId) ?? [];
  currentPlans.push(plan);
  customPlansByUser.set(userId, currentPlans);
  customPlanExercisesByUser.set(id, plannedExercises);
  return { plan: clone(plan), exercises: clone(plannedExercises) };
}

function deleteCustomPlan(userId: string, planId: string): boolean {
  const currentPlans = customPlansByUser.get(userId) ?? [];
  const index = currentPlans.findIndex((plan) => plan.id === planId);
  if (index < 0) return false;
  currentPlans.splice(index, 1);
  customPlanExercisesByUser.delete(planId);
  return true;
}

function getExercises(): ExerciseSummary[] {
  return clone(exercises);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

function sessionKey(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function getProfile(userId: string): Profile | undefined {
  const user = usersById.get(userId);
  if (!user) return undefined;
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    status: user.status
  };
}

function createSession(userId: string): AuthSession {
  const user = getProfile(userId);
  if (!user) throw new Error("User not found");

  const accessToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  sessions.set(sessionKey(accessToken), { userId, expiresAt });
  return {
    user: clone(user),
    accessToken,
    expiresAt: expiresAt.toISOString()
  };
}

function registerUser(input: RegisterRequest): AuthSession | undefined {
  const email = normalizeEmail(input.email);
  if (usersByEmail.has(email)) return undefined;

  const passwordSalt = randomBytes(16).toString("hex");
  const user: UserRecord = {
    id: randomUUID(),
    email,
    displayName: input.displayName.trim(),
    passwordSalt,
    passwordHash: hashPassword(input.password, passwordSalt),
    status: "active"
  };
  usersByEmail.set(email, user);
  usersById.set(user.id, user);
  workoutsByUser.set(user.id, []);
  return createSession(user.id);
}

function loginUser(input: LoginRequest): AuthSession | undefined {
  const user = usersByEmail.get(normalizeEmail(input.email));
  if (!user || user.status !== "active") return undefined;

  const actual = Buffer.from(hashPassword(input.password, user.passwordSalt), "hex");
  const expected = Buffer.from(user.passwordHash, "hex");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return undefined;
  }
  return createSession(user.id);
}

function getUserByToken(token: string): Profile | undefined {
  const record = sessions.get(sessionKey(token));
  if (!record) return undefined;
  if (record.expiresAt.getTime() <= Date.now()) {
    sessions.delete(sessionKey(token));
    return undefined;
  }
  return getProfile(record.userId);
}

function deleteSession(token: string): void {
  sessions.delete(sessionKey(token));
}

function updateProfile(userId: string, input: UpdateProfileRequest): Profile | undefined {
  const user = usersById.get(userId);
  if (!user) return undefined;
  user.displayName = input.displayName.trim();
  return getProfile(userId);
}

function deleteUser(userId: string): boolean {
  const user = usersById.get(userId);
  if (!user) return false;
  usersById.delete(userId);
  usersByEmail.delete(user.email);
  workoutsByUser.delete(userId);
  for (const plan of customPlansByUser.get(userId) ?? []) {
    customPlanExercisesByUser.delete(plan.id);
  }
  customPlansByUser.delete(userId);
  for (const [tokenHash, session] of sessions) {
    if (session.userId === userId) sessions.delete(tokenHash);
  }
  return true;
}

function listWorkouts(userId: string): WorkoutSession[] {
  return clone(workoutsByUser.get(userId) ?? []);
}

function createWorkout(userId: string, input: CreateWorkoutSessionRequest): WorkoutSession {
  const plan = getPlan(input.planId ?? "", userId)?.plan;
  const workout: WorkoutSession = {
    ...clone(input),
    id: randomUUID(),
    createdVia: "web",
    ...(plan
      ? { planName: plan.name + (input.planDay ? " · 第" + input.planDay + "天" : "") }
      : {})
  };
  const workouts = workoutsByUser.get(userId) ?? [];
  workouts.unshift(workout);
  workoutsByUser.set(userId, workouts);
  return clone(workout);
}

function deleteWorkout(userId: string, workoutId: string): boolean {
  const workouts = workoutsByUser.get(userId) ?? [];
  const index = workouts.findIndex((workout) => workout.id === workoutId);
  if (index < 0) return false;
  workouts.splice(index, 1);
  return true;
}

function updateWorkout(
  userId: string,
  workoutId: string,
  input: CreateWorkoutSessionRequest
): WorkoutSession | undefined {
  const workouts = workoutsByUser.get(userId) ?? [];
  const index = workouts.findIndex((workout) => workout.id === workoutId);
  if (index < 0) return undefined;

  const existing = workouts[index];
  if (!existing) return undefined;
  const plan = getPlan(input.planId ?? "", userId)?.plan;
  const updated: WorkoutSession = {
    ...clone(input),
    id: existing.id,
    createdVia: existing.createdVia,
    ...(plan
      ? { planName: plan.name + (input.planDay ? " · 第" + input.planDay + "天" : "") }
      : {})
  };
  workouts[index] = updated;
  return clone(updated);
}

function getWeeklyStats(userId: string): WeeklyStats {
  const workouts = workoutsByUser.get(userId) ?? [];
  const now = new Date();
  const weekStart = new Date(now);
  const mondayOffset = (weekStart.getDay() + 6) % 7;
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - mondayOffset);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const currentWeek = workouts.filter((workout) => {
    const date = new Date(workout.performedAt);
    return date >= weekStart && date < weekEnd;
  });

  const totalSets = currentWeek.reduce(
    (sum, workout) => sum + workout.exercises.reduce((inner, exercise) => inner + exercise.sets.length, 0),
    0
  );
  const totalReps = currentWeek.reduce(
    (sum, workout) =>
      sum + workout.exercises.reduce(
        (inner, exercise) => inner + exercise.sets.reduce((setSum, set) => setSum + (set.reps ?? 0), 0),
        0
      ),
    0
  );
  const totalDurationMinutes = currentWeek.reduce((sum, workout) => sum + (workout.durationMinutes ?? 0), 0);

  const trainedDates = new Set(workouts.map((workout) => new Date(workout.performedAt).toISOString().slice(0, 10)));
  let cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  if (!trainedDates.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streakDays = 0;
  while (trainedDates.has(cursor.toISOString().slice(0, 10))) {
    streakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    weekStart: weekStart.toISOString(),
    workoutCount: currentWeek.length,
    totalSets,
    totalReps,
    totalDurationMinutes,
    streakDays
  };
}

export const mockStore = {
  registerUser,
  loginUser,
  getUserByToken,
  deleteSession,
  getProfile: (userId: string) => clone(getProfile(userId)),
  updateProfile,
  deleteUser,
  listPlans,
  getPlan,
  createCustomPlan,
  deleteCustomPlan,
  getExercises,
  listWorkouts,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  getWeeklyStats
};
