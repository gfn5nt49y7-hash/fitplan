import { randomUUID } from "node:crypto";
import type {
  CreateWorkoutSessionRequest,
  ExerciseSummary,
  PlannedExercise,
  PlanSummary,
  Profile,
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
  }
];

const exerciseMap = new Map(exercises.map((exercise) => [exercise.id, exercise]));

const plans: PlanSummary[] = [
  {
    id: "plan-three-days",
    name: "每周三练",
    slug: "three-days",
    description: "每周三次全身基础训练，适合刚开始建立习惯的人。",
    difficulty: "beginner",
    estimatedMinutes: 35,
    daysPerWeek: 3
  },
  {
    id: "plan-beginner",
    name: "新手全身",
    slug: "beginner-full-body",
    description: "无器械动作优先，重点学习动作姿势和训练节奏。",
    difficulty: "beginner",
    estimatedMinutes: 30,
    daysPerWeek: 2
  },
  {
    id: "plan-home",
    name: "居家训练",
    slug: "home-workout",
    description: "使用自重完成高效训练，适合在家坚持。",
    difficulty: "beginner",
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

const planExercises = new Map<string, PlannedExercise[]>([
  [
    "plan-three-days",
    [
      planned("pe-three-squat", "exercise-squat", 1, 3, 10),
      planned("pe-three-pushup", "exercise-pushup", 2, 3, 8),
      planned("pe-three-row", "exercise-row", 3, 3, 10)
    ]
  ],
  [
    "plan-beginner",
    [
      planned("pe-beginner-squat", "exercise-squat", 1, 2, 10),
      planned("pe-beginner-pushup", "exercise-pushup", 2, 2, 8),
      planned("pe-beginner-bridge", "exercise-bridge", 3, 3, 12)
    ]
  ],
  [
    "plan-home",
    [
      planned("pe-home-squat", "exercise-squat", 1, 3, 12),
      planned("pe-home-pushup", "exercise-pushup", 2, 3, 8),
      planned("pe-home-bridge", "exercise-bridge", 3, 3, 15)
    ]
  ]
]);

const profile: Profile = {
  id: "demo-user",
  displayName: "FitPlan 体验用户",
  status: "active"
};

let workouts: WorkoutSession[] = [];

function clone<T>(value: T): T {
  return structuredClone(value);
}

function listPlans(): PlanSummary[] {
  return clone(plans);
}

function getPlan(planId: string) {
  const plan = plans.find((item) => item.id === planId);
  if (!plan) return undefined;
  return {
    plan: clone(plan),
    exercises: clone(planExercises.get(planId) ?? [])
  };
}

function getExercises(): ExerciseSummary[] {
  return clone(exercises);
}

function listWorkouts(): WorkoutSession[] {
  return clone(workouts);
}

function createWorkout(input: CreateWorkoutSessionRequest): WorkoutSession {
  const plan = plans.find((item) => item.id === input.planId);
  const workout: WorkoutSession = {
    ...clone(input),
    id: randomUUID(),
    createdVia: "web",
    ...(plan ? { planName: plan.name } : {})
  };
  workouts.unshift(workout);
  return clone(workout);
}

function deleteWorkout(workoutId: string): boolean {
  const index = workouts.findIndex((workout) => workout.id === workoutId);
  if (index < 0) return false;
  workouts.splice(index, 1);
  return true;
}

function getWeeklyStats(): WeeklyStats {
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
  getProfile: () => clone(profile),
  listPlans,
  getPlan,
  getExercises,
  listWorkouts,
  createWorkout,
  deleteWorkout,
  getWeeklyStats
};
