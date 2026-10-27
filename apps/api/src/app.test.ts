import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type {
  ApiSuccess,
  AuthSession,
  PlannedExercise,
  PlanSummary,
  Profile,
  WorkoutSession
} from "@fitplan/contracts";
import { buildApp } from "./app.js";

type TestApp = ReturnType<typeof buildApp>;

let app: TestApp;
let accessToken: string;

async function registerUser(name = "测试用户") {
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload: {
      email: "user-" + randomUUID() + "@example.com",
      password: "FitPlan123!",
      displayName: name
    }
  });
  expect(response.statusCode).toBe(201);
  return response.json<ApiSuccess<AuthSession>>().data;
}

beforeEach(async function () {
  app = buildApp();
  accessToken = (await registerUser()).accessToken;
});

afterEach(async function () {
  await app.close();
});

describe("FitPlan API", function () {
  it("returns the published training plans", async function () {
    const response = await app.inject({ method: "GET", url: "/api/v1/plans" });
    expect(response.statusCode).toBe(200);

    const body = response.json<ApiSuccess<PlanSummary[]>>();
    expect(body.data).toHaveLength(12);
    expect(body.data[0]?.name).toBe("全身两练");
    expect(body.data.some((plan) => plan.focus === "chest")).toBe(true);
  });

  it("creates a private custom plan and removes it", async function () {
    const createResponse = await app.inject({
      method: "POST",
      url: "/api/v1/plans",
      headers: { authorization: "Bearer " + accessToken },
      payload: {
        name: "我的胸肩训练",
        focus: "chest",
        estimatedMinutes: 40,
        exercises: [
          { exerciseId: "exercise-bench", targetSets: 4, targetReps: 8 },
          { exerciseId: "exercise-lateral-raise", targetSets: 3, targetReps: 12 }
        ]
      }
    });
    expect(createResponse.statusCode).toBe(201);
    const created = createResponse.json<
      ApiSuccess<{ plan: PlanSummary; exercises: PlannedExercise[] }>
    >().data;
    expect(created.plan.isCustom).toBe(true);
    expect(created.plan.focus).toBe("chest");

    const listResponse = await app.inject({
      method: "GET",
      url: "/api/v1/plans",
      headers: { authorization: "Bearer " + accessToken }
    });
    expect(listResponse.json<ApiSuccess<PlanSummary[]>>().data).toHaveLength(13);

    const publicList = await app.inject({ method: "GET", url: "/api/v1/plans" });
    expect(publicList.json<ApiSuccess<PlanSummary[]>>().data).toHaveLength(12);

    const otherUser = await registerUser("另一个计划用户");
    const deleteByOther = await app.inject({
      method: "DELETE",
      url: "/api/v1/plans/" + created.plan.id,
      headers: { authorization: "Bearer " + otherUser.accessToken }
    });
    expect(deleteByOther.statusCode).toBe(404);

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: "/api/v1/plans/" + created.plan.id,
      headers: { authorization: "Bearer " + accessToken }
    });
    expect(deleteResponse.statusCode).toBe(204);
  });

  it("returns the four training days for the upper-lower plan", async function () {
    const response = await app.inject({ method: "GET", url: "/api/v1/plans/plan-upper-lower" });
    expect(response.statusCode).toBe(200);
    const detail = response.json<
      ApiSuccess<{ plan: PlanSummary; exercises: PlannedExercise[] }>
    >().data;
    expect(Array.from(new Set(detail.exercises.map((item) => item.dayNumber)))).toEqual([
      1,
      2,
      3,
      4
    ]);
  });

  it("creates and deletes a workout record", async function () {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/workouts",
      headers: { authorization: "Bearer " + accessToken },
      payload: {
        planId: "plan-three-days",
        performedAt: new Date().toISOString(),
        durationMinutes: 35,
        exercises: [
          {
            exerciseId: "exercise-squat",
            exerciseName: "徒手深蹲",
            position: 1,
            targetSets: 3,
            targetReps: 10,
            sets: [
              { setNumber: 1, setType: "bodyweight", reps: 10 },
              { setNumber: 2, setType: "bodyweight", reps: 10 },
              { setNumber: 3, setType: "bodyweight", reps: 10 }
            ]
          }
        ]
      }
    });

    expect(response.statusCode).toBe(201);
    const body = response.json<ApiSuccess<WorkoutSession>>();
    expect(body.data.planName).toBe("全身三练");
    expect(body.data.createdVia).toBe("web");

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: "/api/v1/workouts/" + body.data.id,
      headers: { authorization: "Bearer " + accessToken }
    });
    expect(deleteResponse.statusCode).toBe(204);
  });

  it("rejects a workout without exercise data", async function () {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/workouts",
      headers: { authorization: "Bearer " + accessToken },
      payload: {
        performedAt: new Date().toISOString(),
        exercises: []
      }
    });

    expect(response.statusCode).toBe(400);
  });

  it("rejects workout access without a session", async function () {
    const response = await app.inject({ method: "GET", url: "/api/v1/workouts" });
    expect(response.statusCode).toBe(401);
  });

  it("updates and deletes the current profile", async function () {
    const updateResponse = await app.inject({
      method: "PATCH",
      url: "/api/v1/auth/me",
      headers: { authorization: "Bearer " + accessToken },
      payload: { displayName: "新的昵称" }
    });
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json<ApiSuccess<Profile>>().data.displayName).toBe("新的昵称");

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: "/api/v1/auth/me",
      headers: { authorization: "Bearer " + accessToken }
    });
    expect(deleteResponse.statusCode).toBe(204);

    const meResponse = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { authorization: "Bearer " + accessToken }
    });
    expect(meResponse.statusCode).toBe(401);
  });

  it("keeps workout data isolated between users", async function () {
    const createResponse = await app.inject({
      method: "POST",
      url: "/api/v1/workouts",
      headers: { authorization: "Bearer " + accessToken },
      payload: {
        planId: "plan-three-days",
        performedAt: new Date().toISOString(),
        exercises: [
          {
            exerciseName: "徒手深蹲",
            position: 1,
            sets: [{ setNumber: 1, setType: "bodyweight", reps: 10 }]
          }
        ]
      }
    });
    expect(createResponse.statusCode).toBe(201);

    const otherUser = await registerUser("另一个用户");
    const otherList = await app.inject({
      method: "GET",
      url: "/api/v1/workouts",
      headers: { authorization: "Bearer " + otherUser.accessToken }
    });
    expect(otherList.statusCode).toBe(200);
    expect(otherList.json<ApiSuccess<WorkoutSession[]>>().data).toHaveLength(0);
  });

  it("updates an existing workout", async function () {
    const createResponse = await app.inject({
      method: "POST",
      url: "/api/v1/workouts",
      headers: { authorization: "Bearer " + accessToken },
      payload: {
        planId: "plan-three-days",
        performedAt: new Date().toISOString(),
        exercises: [
          {
            exerciseName: "徒手深蹲",
            position: 1,
            sets: [{ setNumber: 1, setType: "bodyweight", reps: 10 }]
          }
        ]
      }
    });
    const created = createResponse.json<ApiSuccess<WorkoutSession>>().data;

    const updateResponse = await app.inject({
      method: "PATCH",
      url: "/api/v1/workouts/" + created.id,
      headers: { authorization: "Bearer " + accessToken },
      payload: {
        planId: "plan-three-days",
        performedAt: created.performedAt,
        exercises: [
          {
            exerciseName: "徒手深蹲",
            position: 1,
            sets: [{ setNumber: 1, setType: "bodyweight", reps: 12 }]
          }
        ]
      }
    });
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json<ApiSuccess<WorkoutSession>>().data.exercises[0]?.sets[0]?.reps).toBe(12);
  });
});
