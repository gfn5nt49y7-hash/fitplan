import Fastify, { type FastifyServerOptions } from "fastify";
import cors from "@fastify/cors";
import { z } from "zod";
import type { ApiError, ApiSuccess } from "@fitplan/contracts";
import { mockStore } from "./store.js";

const workoutSetSchema = z
  .object({
    setNumber: z.number().int().min(1).max(30),
    setType: z.enum(["weight_reps", "bodyweight", "time"]),
    weightKg: z.number().min(0).max(1000).optional(),
    reps: z.number().int().min(1).max(1000).optional(),
    durationSeconds: z.number().int().min(1).max(36000).optional(),
    rpe: z.number().min(1).max(10).optional()
  })
  .superRefine((value, context) => {
    if (value.setType === "time" && value.durationSeconds === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["durationSeconds"],
        message: "计时动作必须填写持续时间"
      });
    }
    if (value.setType !== "time" && value.reps === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reps"],
        message: "力量动作必须填写次数"
      });
    }
  });

const workoutSessionExerciseSchema = z.object({
  exerciseId: z.string().min(1).optional(),
  exerciseName: z.string().min(1).max(80),
  position: z.number().int().min(1).max(100),
  targetSets: z.number().int().min(1).max(30).optional(),
  targetReps: z.number().int().min(1).max(1000).optional(),
  targetSeconds: z.number().int().min(1).max(36000).optional(),
  notes: z.string().max(500).optional(),
  sets: z.array(workoutSetSchema).min(1).max(30)
});

const createWorkoutSchema = z.object({
  planId: z.string().min(1).optional(),
  performedAt: z.string().datetime({ offset: true }),
  durationMinutes: z.number().int().min(1).max(1440).optional(),
  notes: z.string().max(500).optional(),
  exercises: z.array(workoutSessionExerciseSchema).min(1).max(50)
});

function success<T>(requestId: string, data: T): ApiSuccess<T> {
  return { data, requestId };
}

function failure(code: string, message: string, requestId: string): ApiError {
  return { error: { code, message }, requestId };
}

export function buildApp(options: FastifyServerOptions = {}) {
  const app = Fastify(options);

  app.register(cors, {
    origin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
    credentials: true
  });

  app.addHook("onSend", async (_request, reply, payload) => {
    reply.header("x-fitplan-data-source", "memory");
    return payload;
  });

  app.get("/api/v1/health", async () => ({
    status: "ok",
    service: "fitplan-api",
    mode: "mock"
  }));

  app.get("/api/v1/me", async (request) => success(request.id, mockStore.getProfile()));

  app.get("/api/v1/plans", async (request) => success(request.id, mockStore.listPlans()));

  app.get<{ Params: { planId: string } }>("/api/v1/plans/:planId", async (request, reply) => {
    const plan = mockStore.getPlan(request.params.planId);
    if (!plan) {
      return reply.status(404).send(failure("PLAN_NOT_FOUND", "训练计划不存在", request.id));
    }
    return success(request.id, plan);
  });

  app.get("/api/v1/exercises", async (request) => success(request.id, mockStore.getExercises()));

  app.get("/api/v1/workouts", async (request) => success(request.id, mockStore.listWorkouts()));

  app.post("/api/v1/workouts", async (request, reply) => {
    const parsed = createWorkoutSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "训练记录格式不正确",
          details: { issues: parsed.error.issues }
        },
        requestId: request.id
      } satisfies ApiError);
    }

    if (parsed.data.planId && !mockStore.getPlan(parsed.data.planId)) {
      return reply.status(400).send(failure("PLAN_NOT_FOUND", "训练计划不存在", request.id));
    }

    const workout = mockStore.createWorkout(parsed.data);
    return reply.status(201).send(success(request.id, workout));
  });

  app.delete<{ Params: { workoutId: string } }>("/api/v1/workouts/:workoutId", async (request, reply) => {
    const deleted = mockStore.deleteWorkout(request.params.workoutId);
    if (!deleted) {
      return reply.status(404).send(failure("WORKOUT_NOT_FOUND", "训练记录不存在", request.id));
    }
    return reply.status(204).send();
  });

  app.get("/api/v1/stats/weekly", async (request) => success(request.id, mockStore.getWeeklyStats()));

  return app;
}
