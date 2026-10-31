import type {
  AuthSession,
  CreateCustomPlanRequest,
  CreateWorkoutSessionRequest,
  ExerciseSummary,
  KinesiologyModule,
  LoginRequest,
  PlannedExercise,
  PlanSummary,
  Profile,
  RegisterRequest,
  UpdateProfileRequest,
  WeeklyStats,
  WorkoutSession
} from "@fitplan/contracts";

/**
 * 存储层统一接口。
 *
 * 各方法的返回值允许是「同步值」或 Promise：
 * - JSON 实现是同步的（内存 Map + 写文件），直接返回值；
 * - PostgreSQL 实现是异步的（要走网络 IO），返回 Promise。
 *
 * 调用方统一 `await`，两种实现就能无缝互换。
 */
export type MaybePromise<T> = T | Promise<T>;

export type PlanDetail = {
  plan: PlanSummary;
  exercises: PlannedExercise[];
};

export interface FitPlanStore {
  /** 当前使用的存储实现，用于健康检查与响应头 */
  readonly kind: "json" | "postgres";

  close(): Promise<void>;

  registerUser(input: RegisterRequest): MaybePromise<AuthSession | undefined>;
  loginUser(input: LoginRequest): MaybePromise<AuthSession | undefined>;
  getUserByToken(token: string): MaybePromise<Profile | undefined>;
  deleteSession(token: string): MaybePromise<void>;
  getProfile(userId: string): MaybePromise<Profile | undefined>;
  updateProfile(userId: string, input: UpdateProfileRequest): MaybePromise<Profile | undefined>;
  deleteUser(userId: string): MaybePromise<boolean>;

  listPlans(userId?: string): MaybePromise<PlanSummary[]>;
  getPlan(planId: string, userId?: string): MaybePromise<PlanDetail | undefined>;
  createCustomPlan(userId: string, input: CreateCustomPlanRequest): MaybePromise<PlanDetail>;
  deleteCustomPlan(userId: string, planId: string): MaybePromise<boolean>;
  getExercises(): MaybePromise<ExerciseSummary[]>;
  getKinesiologyModules(): MaybePromise<KinesiologyModule[]>;

  listWorkouts(userId: string): MaybePromise<WorkoutSession[]>;
  createWorkout(
    userId: string,
    input: CreateWorkoutSessionRequest
  ): MaybePromise<WorkoutSession>;
  updateWorkout(
    userId: string,
    workoutId: string,
    input: CreateWorkoutSessionRequest
  ): MaybePromise<WorkoutSession | undefined>;
  deleteWorkout(userId: string, workoutId: string): MaybePromise<boolean>;
  getWeeklyStats(userId: string): MaybePromise<WeeklyStats>;
}
