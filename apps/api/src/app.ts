import Fastify, { type FastifyServerOptions } from "fastify";
import cors from "@fastify/cors";
import { z } from "zod";
import type { ApiError, ApiSuccess, Profile } from "@fitplan/contracts";
import { mockStore } from "./store.js";

const registerSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
  displayName: z.string().trim().min(2).max(40)
});

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(72)
});

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

function readBearerToken(authorization: string | undefined): string | undefined {
  if (!authorization?.startsWith("Bearer ")) return undefined;
  const token = authorization.slice("Bearer ".length).trim();
  return token || undefined;
}

function authenticate(authorization: string | undefined): { token: string; user: Profile } | undefined {
  const token = readBearerToken(authorization);
  if (!token) return undefined;
  const user = mockStore.getUserByToken(token);
  return user ? { token, user } : undefined;
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

  app.post("/api/v1/auth/register", async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(failure("VALIDATION_ERROR", "注册信息格式不正确", request.id));
    }

    const session = mockStore.registerUser(parsed.data);
    if (!session) {
      return reply.status(409).send(failure("EMAIL_EXISTS", "该邮箱已经注册", request.id));
    }
    return reply.status(201).send(success(request.id, session));
  });

  app.post("/api/v1/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(failure("VALIDATION_ERROR", "邮箱或密码格式不正确", request.id));
    }

    const session = mockStore.loginUser(parsed.data);
    if (!session) {
      return reply.status(401).send(failure("INVALID_CREDENTIALS", "邮箱或密码错误", request.id));
    }
    return success(request.id, session);
  });

  app.post("/api/v1/auth/logout", async (request, reply) => {
    const auth = authenticate(request.headers.authorization);
    if (!auth) {
      return reply.status(401).send(failure("UNAUTHORIZED", "请先登录", request.id));
    }
    mockStore.deleteSession(auth.token);
    return reply.status(204).send();
  });

  app.get("/api/v1/auth/me", async (request, reply) => {
    const auth = authenticate(request.headers.authorization);
    if (!auth) {
      return reply.status(401).send(failure("UNAUTHORIZED", "登录已失效，请重新登录", request.id));
    }
    return success(request.id, auth.user);
  });

  app.get("/api/v1/me", async (request, reply) => {
    const auth = authenticate(request.headers.authorization);
    if (!auth) {
      return reply.status(401).send(failure("UNAUTHORIZED", "登录已失效，请重新登录", request.id));
    }
    return success(request.id, auth.user);
  });

  app.get("/api/v1/plans", async (request) => success(request.id, mockStore.listPlans()));

  app.get<{ Params: { planId: string } }>("/api/v1/plans/:planId", async (request, reply) => {
    const plan = mockStore.getPlan(request.params.planId);
    if (!plan) {
      return reply.status(404).send(failure("PLAN_NOT_FOUND", "训练计划不存在", request.id));
    }
    return success(request.id, plan);
  });

  app.get("/api/v1/exercises", async (request) => success(request.id, mockStore.getExercises()));

  app.get("/api/v1/workouts", async (request, reply) => {
    const auth = authenticate(request.headers.authorization);
    if (!auth) {
      return reply.status(401).send(failure("UNAUTHORIZED", "请先登录", request.id));
    }
    return success(request.id, mockStore.listWorkouts(auth.user.id));
  });

  app.post("/api/v1/workouts", async (request, reply) => {
    const auth = authenticate(request.headers.authorization);
    if (!auth) {
      return reply.status(401).send(failure("UNAUTHORIZED", "请先登录", request.id));
    }

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

    const workout = mockStore.createWorkout(auth.user.id, parsed.data);
    return reply.status(201).send(success(request.id, workout));
  });

  app.delete<{ Params: { workoutId: string } }>("/api/v1/workouts/:workoutId", async (request, reply) => {
    const auth = authenticate(request.headers.authorization);
    if (!auth) {
      return reply.status(401).send(failure("UNAUTHORIZED", "请先登录", request.id));
    }

    const deleted = mockStore.deleteWorkout(auth.user.id, request.params.workoutId);
    if (!deleted) {
      return reply.status(404).send(failure("WORKOUT_NOT_FOUND", "训练记录不存在", request.id));
    }
    return reply.status(204).send();
  });

  app.get("/api/v1/stats/weekly", async (request, reply) => {
    const auth = authenticate(request.headers.authorization);
    if (!auth) {
      return reply.status(401).send(failure("UNAUTHORIZED", "请先登录", request.id));
    }
    return success(request.id, mockStore.getWeeklyStats(auth.user.id));
  });

  return app;
}
