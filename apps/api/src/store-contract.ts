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

export interface PlanDetail {
  plan: PlanSummary;
  exercises: PlannedExercise[];
}

export interface AppStore {
  registerUser(input: RegisterRequest): Promise<AuthSession | undefined>;
  loginUser(input: LoginRequest): Promise<AuthSession | undefined>;
  getUserByToken(token: string): Promise<Profile | undefined>;
  deleteSession(token: string): Promise<void>;
  getProfile(userId: string): Promise<Profile | undefined>;
  updateProfile(userId: string, input: UpdateProfileRequest): Promise<Profile | undefined>;
  deleteUser(userId: string): Promise<boolean>;
  listPlans(userId?: string): Promise<PlanSummary[]>;
  getPlan(planId: string, userId?: string): Promise<PlanDetail | undefined>;
  createCustomPlan(userId: string, input: CreateCustomPlanRequest): Promise<PlanDetail>;
  deleteCustomPlan(userId: string, planId: string): Promise<boolean>;
  getExercises(): Promise<ExerciseSummary[]>;
  listWorkouts(userId: string): Promise<WorkoutSession[]>;
  createWorkout(userId: string, input: CreateWorkoutSessionRequest): Promise<WorkoutSession>;
  updateWorkout(
    userId: string,
    workoutId: string,
    input: CreateWorkoutSessionRequest
  ): Promise<WorkoutSession | undefined>;
  deleteWorkout(userId: string, workoutId: string): Promise<boolean>;
  getWeeklyStats(userId: string): Promise<WeeklyStats>;
  close(): Promise<void>;
}
