import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ApiSuccess, PlanSummary, WorkoutSession } from "@fitplan/contracts";
import { buildApp } from "./app.js";

type TestApp = ReturnType<typeof buildApp>;

let app: TestApp;

beforeEach(function () {
  app = buildApp();
});

afterEach(async function () {
  await app.close();
});

describe("FitPlan API", function () {
  it("returns the published training plans", async function () {
    const response = await app.inject({ method: "GET", url: "/api/v1/plans" });
    expect(response.statusCode).toBe(200);

    const body = response.json<ApiSuccess<PlanSummary[]>>();
    expect(body.data).toHaveLength(3);
    expect(body.data[0]?.name).toBe("每周三练");
  });

  it("creates and deletes a workout record", async function () {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/workouts",
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
    expect(body.data.planName).toBe("每周三练");
    expect(body.data.createdVia).toBe("web");

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: "/api/v1/workouts/" + body.data.id
    });
    expect(deleteResponse.statusCode).toBe(204);
  });

  it("rejects a workout without exercise data", async function () {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/workouts",
      payload: {
        performedAt: new Date().toISOString(),
        exercises: []
      }
    });

    expect(response.statusCode).toBe(400);
  });
});
