export type Id = string;
export type IsoDateTime = string;

export type PlanDifficulty = "beginner" | "intermediate";
export type PlanFocus =
  | "full_body"
  | "split"
  | "strength"
  | "chest"
  | "shoulders"
  | "back"
  | "legs"
  | "arms"
  | "core";
export type WorkoutSetType = "weight_reps" | "bodyweight" | "time";
export type ClientSource = "web" | "miniapp" | "import";

export interface Profile {
  id: Id;
  displayName: string;
  email: string;
  phoneMasked?: string;
  status: "active" | "disabled" | "deletion_pending";
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  displayName: string;
}

export interface AuthSession {
  user: Profile;
  accessToken: string;
  expiresAt: IsoDateTime;
}

export interface PlanSummary {
  id: Id;
  name: string;
  slug: string;
  description: string;
  difficulty: PlanDifficulty;
  focus: PlanFocus;
  estimatedMinutes: number;
  daysPerWeek: number;
  isCustom?: boolean;
}

export interface ExerciseSummary {
  id: Id;
  name: string;
  slug: string;
  muscleGroup: string;
  equipment: string;
  movementTags: string[];
  instructions: string;
  safetyNotes: string;
  mediaUrl?: string;
}

export interface KinesiologyMovement {
  id: string;
  name: string;
  englishName: string;
  plane: string;
  description: string;
  exerciseExamples: string[];
}

export interface KinesiologyModule {
  id: "shoulder" | "elbow" | "hip" | "knee" | "ankle" | "trunk";
  title: string;
  subtitle: string;
  summary: string;
  keyFunction: string;
  movements: KinesiologyMovement[];
  selectionLogic: string[];
  safetyNotes: string;
}

export interface PlannedExercise {
  id: Id;
  exercise: ExerciseSummary;
  dayNumber: number;
  position: number;
  targetSets: number;
  targetReps?: number;
  targetSeconds?: number;
}

export interface WorkoutSet {
  id?: Id;
  setNumber: number;
  setType: WorkoutSetType;
  weightKg?: number;
  reps?: number;
  durationSeconds?: number;
  rpe?: number;
}

export interface WorkoutSessionExercise {
  id?: Id;
  exerciseId?: Id;
  exerciseName: string;
  position: number;
  targetSets?: number;
  targetReps?: number;
  targetSeconds?: number;
  notes?: string;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: Id;
  planId?: Id;
  planName?: string;
  planDay?: number;
  performedAt: IsoDateTime;
  durationMinutes?: number;
  notes?: string;
  createdVia: ClientSource;
  exercises: WorkoutSessionExercise[];
}

export interface CreateWorkoutSessionRequest {
  planId?: Id;
  planDay?: number;
  performedAt: IsoDateTime;
  durationMinutes?: number;
  notes?: string;
  exercises: WorkoutSessionExercise[];
}

export interface CustomPlanExerciseInput {
  exerciseId: Id;
  targetSets: number;
  targetReps: number;
}

export interface CreateCustomPlanRequest {
  name: string;
  focus: Exclude<PlanFocus, "split" | "strength" | "full_body"> | "full_body";
  estimatedMinutes: number;
  exercises: CustomPlanExerciseInput[];
}

export interface WeeklyStats {
  weekStart: IsoDateTime;
  workoutCount: number;
  totalSets: number;
  totalReps: number;
  totalDurationMinutes: number;
  streakDays: number;
}

export interface ApiSuccess<T> {
  data: T;
  requestId: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  requestId: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
