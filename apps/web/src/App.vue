<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import type {
  AuthSession,
  CreateCustomPlanRequest,
  CreateWorkoutSessionRequest,
  ExerciseSummary,
  PlannedExercise,
  PlanFocus,
  PlanSummary,
  Profile,
  WeeklyStats,
  WorkoutSession
} from "@fitplan/contracts";
import AuthView from "./AuthView.vue";
import { apiRequest, clearAccessToken, downloadWorkoutExport, getAccessToken } from "./api";

interface PlanDetail {
  plan: PlanSummary;
  exercises: PlannedExercise[];
}

interface DraftEntry {
  weightKg: number;
  reps: number;
  sets: number;
  durationSeconds: number;
}

const plans = ref<PlanSummary[]>([]);
const exercises = ref<ExerciseSummary[]>([]);
const workouts = ref<WorkoutSession[]>([]);
const stats = ref<WeeklyStats | null>(null);
const currentUser = ref<Profile | null>(null);
const selectedPlan = ref<PlanDetail | null>(null);
const activeDay = ref(1);
const editingWorkout = ref<WorkoutSession | null>(null);
const loading = ref(true);
const authLoading = ref(true);
const saving = ref(false);
const profileSaving = ref(false);
const error = ref("");
const notice = ref("");
const profileName = ref("");
const exerciseQuery = ref("");
const selectedMuscle = ref("全部");
const selectedEquipment = ref("全部");
const selectedPlanCategory = ref<PlanFocus | "all">("all");
const customPlanOpen = ref(false);
const customPlanName = ref("");
const customPlanFocus = ref<CreateCustomPlanRequest["focus"]>("full_body");
const customPlanMinutes = ref(30);
const customRows = ref([
  { key: crypto.randomUUID(), exerciseId: "exercise-squat", sets: 3, reps: 10 }
]);
const draft = reactive<Record<string, DraftEntry>>({});
const editDraft = reactive<Record<string, DraftEntry>>({});

const muscleGroups = computed(function () {
  return ["全部"].concat(
    Array.from(new Set(exercises.value.map((exercise) => exercise.muscleGroup))).sort()
  );
});

const equipmentTypes = computed(function () {
  return ["全部"].concat(
    Array.from(new Set(exercises.value.map((exercise) => exercise.equipment))).sort()
  );
});

const planCategories = [
  { value: "all", label: "全部" },
  { value: "chest", label: "胸" },
  { value: "shoulders", label: "肩" },
  { value: "back", label: "背" },
  { value: "legs", label: "腿" },
  { value: "arms", label: "手臂" },
  { value: "core", label: "核心" }
] as const;

const planFocusOptions = [
  { value: "full_body", label: "综合训练" },
  { value: "chest", label: "胸部" },
  { value: "shoulders", label: "肩部" },
  { value: "back", label: "背部" },
  { value: "legs", label: "腿部" },
  { value: "arms", label: "手臂" },
  { value: "core", label: "核心" }
] as const;

const filteredPlans = computed(function () {
  if (selectedPlanCategory.value === "all") return plans.value;
  return plans.value.filter((plan) => plan.focus === selectedPlanCategory.value);
});

const filteredExercises = computed(function () {
  const query = exerciseQuery.value.trim().toLowerCase();
  return exercises.value.filter(function (exercise) {
    const matchesQuery =
      !query ||
      exercise.name.toLowerCase().includes(query) ||
      exercise.muscleGroup.toLowerCase().includes(query) ||
      exercise.instructions.toLowerCase().includes(query);
    const matchesMuscle =
      selectedMuscle.value === "全部" || exercise.muscleGroup === selectedMuscle.value;
    const matchesEquipment =
      selectedEquipment.value === "全部" || exercise.equipment === selectedEquipment.value;
    return matchesQuery && matchesMuscle && matchesEquipment;
  });
});

const planDays = computed(function () {
  if (!selectedPlan.value) return [];
  return Array.from(new Set(selectedPlan.value.exercises.map((item) => item.dayNumber))).sort(
    (left, right) => left - right
  );
});

const activePlanExercises = computed(function () {
  return (selectedPlan.value?.exercises ?? []).filter(
    (item) => item.dayNumber === activeDay.value
  );
});

const progressDays = computed(function () {
  const formatter = new Intl.DateTimeFormat("zh-CN", { weekday: "short" });
  return Array.from({ length: 7 }, function (_, index) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
    const dayWorkouts = workouts.value.filter(function (workout) {
      const performed = new Date(workout.performedAt);
      const workoutKey = [
        performed.getFullYear(),
        String(performed.getMonth() + 1).padStart(2, "0"),
        String(performed.getDate()).padStart(2, "0")
      ].join("-");
      return workoutKey === key;
    });
    const setCount = dayWorkouts.reduce(function (total, workout) {
      return total + workout.exercises.reduce(function (inner, exercise) {
        return inner + exercise.sets.length;
      }, 0);
    }, 0);
    return {
      key,
      label: formatter.format(date),
      isToday: index === 6,
      workoutCount: dayWorkouts.length,
      setCount
    };
  });
});

const maxDailySets = computed(function () {
  return Math.max(1, ...progressDays.value.map((day) => day.setCount));
});

async function loadData() {
  loading.value = true;
  error.value = "";
  try {
    const [planData, exerciseData, workoutData, weeklyData] = await Promise.all([
      apiRequest<PlanSummary[]>("/api/v1/plans"),
      apiRequest<ExerciseSummary[]>("/api/v1/exercises"),
      apiRequest<WorkoutSession[]>("/api/v1/workouts"),
      apiRequest<WeeklyStats>("/api/v1/stats/weekly")
    ]);
    plans.value = planData;
    exercises.value = exerciseData;
    workouts.value = workoutData;
    stats.value = weeklyData;
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "无法加载训练数据";
  } finally {
    loading.value = false;
  }
}

async function restoreSession() {
  authLoading.value = true;
  if (!getAccessToken()) {
    authLoading.value = false;
    loading.value = false;
    return;
  }

  try {
    currentUser.value = await apiRequest<Profile>("/api/v1/auth/me");
    profileName.value = currentUser.value.displayName;
    await loadData();
  } catch (_cause) {
    clearAccessToken();
    currentUser.value = null;
    loading.value = false;
  } finally {
    authLoading.value = false;
  }
}

async function handleAuthenticated(session: AuthSession) {
  currentUser.value = session.user;
  profileName.value = session.user.displayName;
  authLoading.value = false;
  await loadData();
}

async function logout() {
  try {
    await apiRequest<void>("/api/v1/auth/logout", { method: "POST" });
  } catch (_cause) {
    // The local session should still be cleared if the server session expired.
  }
  clearAccessToken();
  currentUser.value = null;
  plans.value = [];
  exercises.value = [];
  workouts.value = [];
  stats.value = null;
  selectedPlan.value = null;
  editingWorkout.value = null;
}

async function updateProfile() {
  if (!currentUser.value) return;
  profileSaving.value = true;
  error.value = "";
  try {
    currentUser.value = await apiRequest<Profile>("/api/v1/auth/me", {
      method: "PATCH",
      body: JSON.stringify({ displayName: profileName.value })
    });
    showNotice("昵称已更新");
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "昵称更新失败";
  } finally {
    profileSaving.value = false;
  }
}

async function exportData() {
  try {
    await downloadWorkoutExport();
    showNotice("训练记录已导出");
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "训练记录导出失败";
  }
}

async function deleteAccount() {
  if (!window.confirm("确定注销账号并删除全部训练记录吗？此操作不可恢复。")) return;
  try {
    await apiRequest<void>("/api/v1/auth/me", { method: "DELETE" });
    clearAccessToken();
    currentUser.value = null;
    plans.value = [];
    exercises.value = [];
    workouts.value = [];
    stats.value = null;
    selectedPlan.value = null;
    editingWorkout.value = null;
    showNotice("账号已注销");
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "账号注销失败";
  }
}

async function choosePlan(planId: string) {
  error.value = "";
  try {
    selectedPlan.value = await apiRequest<PlanDetail>("/api/v1/plans/" + planId);
    activeDay.value = selectedPlan.value.exercises[0]?.dayNumber ?? 1;
    Object.keys(draft).forEach(function (key) {
      delete draft[key];
    });
    selectedPlan.value.exercises.forEach(function (item) {
      draft[item.id] = {
        weightKg: 0,
        reps: item.targetReps ?? 10,
        sets: item.targetSets,
        durationSeconds: item.targetSeconds ?? 30
      };
    });
    window.setTimeout(function () {
      document.querySelector("#workout-panel")?.scrollIntoView({ behavior: "smooth" });
    }, 30);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "无法读取训练计划";
  }
}

async function saveWorkout() {
  if (!selectedPlan.value) return;
  saving.value = true;
  error.value = "";

  try {
    const exercises = activePlanExercises.value.map(function (item) {
      const entry = draft[item.id] ?? {
        weightKg: 0,
        reps: item.targetReps ?? 10,
        sets: item.targetSets,
        durationSeconds: item.targetSeconds ?? 30
      };
      const isTimed = item.targetSeconds !== undefined;
      const isBodyweight = item.exercise.equipment === "无器械";
      const setType = isTimed
        ? "time" as const
        : isBodyweight
          ? "bodyweight" as const
          : "weight_reps" as const;
      return {
        exerciseId: item.exercise.id,
        exerciseName: item.exercise.name,
        position: item.position,
        targetSets: item.targetSets,
        ...(item.targetReps === undefined ? {} : { targetReps: item.targetReps }),
        targetSeconds: item.targetSeconds,
        sets: Array.from({ length: entry.sets }, function (_, index) {
          return {
            setNumber: index + 1,
            setType,
            ...(setType === "weight_reps" ? { weightKg: entry.weightKg } : {}),
            ...(setType === "time"
              ? { durationSeconds: entry.durationSeconds }
              : { reps: entry.reps })
          };
        })
      };
    });

    const payload: CreateWorkoutSessionRequest = {
      planId: selectedPlan.value.plan.id,
      ...(planDays.value.length > 1 ? { planDay: activeDay.value } : {}),
      performedAt: new Date().toISOString(),
      durationMinutes: selectedPlan.value.plan.estimatedMinutes,
      exercises
    };

    const created = await apiRequest<WorkoutSession>("/api/v1/workouts", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    workouts.value.unshift(created);
    stats.value = await apiRequest<WeeklyStats>("/api/v1/stats/weekly");
    selectedPlan.value = null;
    showNotice("训练记录已保存");
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "训练记录保存失败";
  } finally {
    saving.value = false;
  }
}

function addCustomRow() {
  customRows.value.push({
    key: crypto.randomUUID(),
    exerciseId: exercises.value[0]?.id ?? "",
    sets: 3,
    reps: 10
  });
}

function removeCustomRow(key: string) {
  if (customRows.value.length === 1) return;
  customRows.value = customRows.value.filter((row) => row.key !== key);
}

function openCustomPlan() {
  customPlanOpen.value = true;
  customPlanName.value = "";
  customPlanFocus.value = "full_body";
  customPlanMinutes.value = 30;
  customRows.value = [
    { key: crypto.randomUUID(), exerciseId: exercises.value[0]?.id ?? "", sets: 3, reps: 10 }
  ];
  window.setTimeout(function () {
    document.querySelector("#custom-plan-panel")?.scrollIntoView({ behavior: "smooth" });
  }, 30);
}

async function saveCustomPlan() {
  const validRows = customRows.value.filter((row) => row.exerciseId);
  if (!customPlanName.value.trim() || validRows.length === 0) {
    error.value = "请填写计划名称并至少选择一个动作";
    return;
  }
  saving.value = true;
  error.value = "";
  try {
    const payload: CreateCustomPlanRequest = {
      name: customPlanName.value,
      focus: customPlanFocus.value,
      estimatedMinutes: customPlanMinutes.value,
      exercises: validRows.map((row) => ({
        exerciseId: row.exerciseId,
        targetSets: row.sets,
        targetReps: row.reps
      }))
    };
    const created = await apiRequest<PlanDetail>("/api/v1/plans", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    plans.value.unshift(created.plan);
    customPlanOpen.value = false;
    showNotice("自定义计划已创建");
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "自定义计划创建失败";
  } finally {
    saving.value = false;
  }
}

async function removeCustomPlan(planId: string) {
  if (!window.confirm("确定删除这个自定义计划吗？")) return;
  try {
    await apiRequest<void>("/api/v1/plans/" + planId, { method: "DELETE" });
    plans.value = plans.value.filter((plan) => plan.id !== planId);
    if (selectedPlan.value?.plan.id === planId) selectedPlan.value = null;
    showNotice("自定义计划已删除");
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "自定义计划删除失败";
  }
}

async function removeWorkout(workoutId: string) {
  if (!window.confirm("确定删除这条训练记录吗？")) return;
  try {
    await apiRequest<void>("/api/v1/workouts/" + workoutId, { method: "DELETE" });
    workouts.value = workouts.value.filter(function (item) {
      return item.id !== workoutId;
    });
    stats.value = await apiRequest<WeeklyStats>("/api/v1/stats/weekly");
    showNotice("训练记录已删除");
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "删除失败";
  }
}

function clearEditDraft() {
  Object.keys(editDraft).forEach(function (key) {
    delete editDraft[key];
  });
}

function openEditWorkout(workout: WorkoutSession) {
  selectedPlan.value = null;
  editingWorkout.value = JSON.parse(JSON.stringify(workout)) as WorkoutSession;
  clearEditDraft();
  editingWorkout.value.exercises.forEach(function (exercise) {
    const firstSet = exercise.sets[0];
    editDraft[exercise.id ?? String(exercise.position)] = {
      weightKg: firstSet?.weightKg ?? 0,
      reps: firstSet?.reps ?? 10,
      sets: exercise.sets.length,
      durationSeconds: firstSet?.durationSeconds ?? 30
    };
  });
  window.setTimeout(function () {
    document.querySelector("#edit-workout-panel")?.scrollIntoView({ behavior: "smooth" });
  }, 30);
}

async function saveWorkoutEdit() {
  if (!editingWorkout.value) return;
  saving.value = true;
  error.value = "";
  try {
    const exercises = editingWorkout.value.exercises.map(function (item) {
      const key = item.id ?? String(item.position);
      const entry = editDraft[key] ?? {
        weightKg: item.sets[0]?.weightKg ?? 0,
        reps: item.sets[0]?.reps ?? 10,
        sets: item.sets.length,
        durationSeconds: item.sets[0]?.durationSeconds ?? 30
      };
      const setType = item.sets[0]?.setType ?? "weight_reps";
      return {
        exerciseId: item.exerciseId,
        exerciseName: item.exerciseName,
        position: item.position,
        targetSets: item.targetSets,
        targetReps: item.targetReps,
        targetSeconds: item.targetSeconds,
        notes: item.notes,
        sets: Array.from({ length: entry.sets }, function (_, index) {
          return {
            setNumber: index + 1,
            setType,
            ...(setType === "weight_reps" ? { weightKg: entry.weightKg } : {}),
            ...(setType === "time"
              ? { durationSeconds: entry.durationSeconds }
              : { reps: entry.reps })
          };
        })
      };
    });

    const payload: CreateWorkoutSessionRequest = {
      planId: editingWorkout.value.planId,
      ...(editingWorkout.value.planDay === undefined
        ? {}
        : { planDay: editingWorkout.value.planDay }),
      performedAt: editingWorkout.value.performedAt,
      durationMinutes: editingWorkout.value.durationMinutes,
      notes: editingWorkout.value.notes,
      exercises
    };
    const updated = await apiRequest<WorkoutSession>(
      "/api/v1/workouts/" + editingWorkout.value.id,
      { method: "PATCH", body: JSON.stringify(payload) }
    );
    workouts.value = workouts.value.map(function (item) {
      return item.id === updated.id ? updated : item;
    });
    stats.value = await apiRequest<WeeklyStats>("/api/v1/stats/weekly");
    editingWorkout.value = null;
    showNotice("训练记录已更新");
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "训练记录更新失败";
  } finally {
    saving.value = false;
  }
}

function showNotice(message: string) {
  notice.value = message;
  window.setTimeout(function () {
    notice.value = "";
  }, 2500);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(new Date(value));
}

function difficultyLabel(value: PlanSummary["difficulty"]) {
  return value === "beginner" ? "适合初学者" : "需要基础";
}

function focusLabel(value: PlanSummary["focus"]) {
  const labels: Record<PlanSummary["focus"], string> = {
    full_body: "全身",
    split: "分化训练",
    strength: "基础力量",
    chest: "胸部",
    shoulders: "肩部",
    back: "背部",
    legs: "腿部",
    arms: "手臂",
    core: "核心"
  };
  return labels[value];
}

function formatIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}

onMounted(restoreSession);
</script>

<template>
  <div v-if="authLoading" class="auth-boot" aria-live="polite">
    <span class="auth-boot-mark">F</span>
    <p>正在恢复登录状态…</p>
  </div>

  <AuthView v-else-if="!currentUser" @authenticated="handleAuthenticated" />

  <template v-else>
    <header class="site-header">
      <a class="logo" href="#top">FitPlan<span>.</span></a>
      <nav aria-label="主导航">
        <a href="#plans">训练计划</a>
        <a href="#progress">训练进度</a>
        <a href="#library">动作库</a>
        <a href="#recent">训练记录</a>
        <a href="#profile">账号设置</a>
        <div class="user-area">
          <span>{{ currentUser.displayName }}</span>
          <button type="button" @click="logout">退出</button>
        </div>
      </nav>
    </header>

    <main id="top">
    <section class="hero">
      <p class="eyebrow">你的第一步，从一次训练开始</p>
      <h1>用清晰的计划，<br /><span>记录每一次进步。</span></h1>
      <p class="hero-copy">选择适合你的训练方案，记录重量、次数和组数，让训练成果有迹可循。</p>
      <a class="primary-button" href="#plans">选择训练计划 <span>↓</span></a>

      <div class="hero-metrics">
        <div><strong>{{ stats?.workoutCount ?? 0 }}</strong><span>本周训练</span></div>
        <div><strong>{{ stats?.streakDays ?? 0 }}</strong><span>连续天数</span></div>
        <div><strong>{{ stats?.totalSets ?? 0 }}</strong><span>本周总组数</span></div>
      </div>
    </section>

    <p v-if="error" class="alert" role="alert">{{ error }}</p>

    <section id="progress" class="section progress-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">训练进度</p>
          <h2>今天比昨天多做一点</h2>
        </div>
        <p>按近 7 天训练组数展示训练节奏，帮助发现停滞和恢复。</p>
      </div>

      <div class="progress-board">
        <div class="progress-summary">
          <article><span>本周训练</span><strong>{{ stats?.workoutCount ?? 0 }}</strong><small>次</small></article>
          <article><span>本周总组数</span><strong>{{ stats?.totalSets ?? 0 }}</strong><small>组</small></article>
          <article><span>训练时长</span><strong>{{ stats?.totalDurationMinutes ?? 0 }}</strong><small>分钟</small></article>
          <article><span>连续训练</span><strong>{{ stats?.streakDays ?? 0 }}</strong><small>天</small></article>
        </div>

        <div class="progress-chart" aria-label="近七天训练组数">
          <div
            v-for="day in progressDays"
            :key="day.key"
            class="progress-day"
            :class="{ today: day.isToday, active: day.setCount > 0 }"
          >
            <span class="bar-count">{{ day.setCount || "" }}</span>
            <div
              class="progress-bar"
              :style="{ height: Math.max(8, Math.round((day.setCount / maxDailySets) * 140)) + 'px' }"
            ></div>
            <small>{{ day.label }}</small>
          </div>
        </div>
      </div>
    </section>

    <section id="plans" class="section">
      <div class="section-heading plans-heading">
        <div class="heading-copy">
          <div>
            <p class="eyebrow">训练计划</p>
            <h2>从适合你的节奏开始</h2>
          </div>
          <button type="button" class="custom-plan-trigger" @click="openCustomPlan">
            ＋ DIY 计划
          </button>
        </div>
        <p>参考常见全身、分化与力量计划，也可以按胸、肩、背、腿、手臂和核心筛选。</p>
      </div>

      <div class="plan-categories" role="tablist" aria-label="按训练部位筛选计划">
        <button
          v-for="category in planCategories"
          :key="category.value"
          type="button"
          role="tab"
          :aria-selected="selectedPlanCategory === category.value"
          :class="{ active: selectedPlanCategory === category.value }"
          @click="selectedPlanCategory = category.value"
        >
          {{ category.label }}
        </button>
      </div>

      <div v-if="loading" class="loading-card">正在加载训练计划…</div>
      <div v-else class="plan-grid">
        <article
          v-for="(plan, index) in filteredPlans"
          :key="plan.id"
          class="plan-card"
          :class="{ featured: index === 0 && !plan.isCustom }"
        >
          <div class="plan-top">
            <div class="plan-labels">
              <span>{{ focusLabel(plan.focus) }}</span>
              <span>{{ difficultyLabel(plan.difficulty) }}</span>
              <span v-if="plan.isCustom" class="custom-tag">自定义</span>
            </div>
            <div class="plan-top-actions">
              <b>{{ formatIndex(index) }}</b>
              <button
                v-if="plan.isCustom"
                type="button"
                class="custom-delete"
                :aria-label="'删除' + plan.name"
                @click="removeCustomPlan(plan.id)"
              >
                删除
              </button>
            </div>
          </div>
          <h3>{{ plan.name }}</h3>
          <p>{{ plan.description }}</p>
          <ul>
            <li>每周 {{ plan.daysPerWeek }} 次训练</li>
            <li>预计 {{ plan.estimatedMinutes }} 分钟</li>
            <li>按组记录训练数据</li>
          </ul>
          <button type="button" @click="choosePlan(plan.id)">开始这个计划</button>
        </article>
      </div>

      <div v-if="!loading && filteredPlans.length === 0" class="empty-card plan-empty">
        <h3>这个分类还没有计划</h3>
        <p>可以点击“DIY 计划”，自己组合动作后保存到这个分类。</p>
      </div>

      <section v-if="customPlanOpen" id="custom-plan-panel" class="custom-plan-panel">
        <div class="custom-plan-heading">
          <div>
            <p class="eyebrow">DIY 训练计划</p>
            <h3>按自己的器械和目标组合动作</h3>
            <p>设置训练部位、预计时长、动作和组数，保存后会出现在计划列表中。</p>
          </div>
          <button type="button" class="close-button" aria-label="关闭自定义计划" @click="customPlanOpen = false">×</button>
        </div>

        <form @submit.prevent="saveCustomPlan">
          <div class="custom-plan-basics">
            <label>
              计划名称
              <input v-model.trim="customPlanName" type="text" minlength="2" maxlength="40" placeholder="例如：我的周一胸肩训练" required />
            </label>
            <label>
              训练部位
              <select v-model="customPlanFocus">
                <option v-for="focus in planFocusOptions" :key="focus.value" :value="focus.value">
                  {{ focus.label }}
                </option>
              </select>
            </label>
            <label>
              预计分钟
              <input v-model.number="customPlanMinutes" type="number" min="5" max="240" required />
            </label>
          </div>

          <div class="custom-exercise-list">
            <div v-for="(row, index) in customRows" :key="row.key" class="custom-exercise-row">
              <span class="custom-row-number">{{ formatIndex(index) }}</span>
              <label>
                动作
                <select v-model="row.exerciseId" required>
                  <option v-for="exercise in exercises" :key="exercise.id" :value="exercise.id">
                    {{ exercise.name }} · {{ exercise.muscleGroup }}
                  </option>
                </select>
              </label>
              <label>
                组数
                <input v-model.number="row.sets" type="number" min="1" max="20" required />
              </label>
              <label>
                每组次数
                <input v-model.number="row.reps" type="number" min="1" max="100" required />
              </label>
              <button
                type="button"
                class="remove-row"
                :disabled="customRows.length === 1"
                aria-label="删除这个动作"
                @click="removeCustomRow(row.key)"
              >
                移除
              </button>
            </div>
          </div>

          <div class="custom-plan-actions">
            <button type="button" class="add-row-button" @click="addCustomRow">＋ 添加动作</button>
            <button type="submit" class="save-button" :disabled="saving">
              {{ saving ? "正在保存…" : "保存自定义计划" }}
            </button>
          </div>
        </form>
      </section>
    </section>

    <section id="library" class="section library-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">动作库</p>
          <h2>先理解动作，再增加重量</h2>
        </div>
        <p>按名称、训练部位和器械筛选动作，并阅读动作要领和安全提示。</p>
      </div>

      <div class="library-toolbar">
        <label class="search-field">
          <span>搜索动作</span>
          <input v-model.trim="exerciseQuery" type="search" placeholder="例如：深蹲、背部、无器械" />
        </label>
        <label>
          <span>训练部位</span>
          <select v-model="selectedMuscle">
            <option v-for="group in muscleGroups" :key="group" :value="group">{{ group }}</option>
          </select>
        </label>
        <label>
          <span>器械</span>
          <select v-model="selectedEquipment">
            <option v-for="equipment in equipmentTypes" :key="equipment" :value="equipment">
              {{ equipment }}
            </option>
          </select>
        </label>
      </div>

      <div v-if="filteredExercises.length" class="exercise-library-grid">
        <article v-for="exercise in filteredExercises" :key="exercise.id" class="exercise-card">
          <div class="exercise-tags">
            <span>{{ exercise.muscleGroup }}</span>
            <span>{{ exercise.equipment }}</span>
          </div>
          <h3>{{ exercise.name }}</h3>
          <p>{{ exercise.instructions }}</p>
          <div class="safety-note">
            <strong>安全提示</strong>
            <span>{{ exercise.safetyNotes }}</span>
          </div>
        </article>
      </div>
      <div v-else class="empty-card">
        <h3>没有找到匹配动作</h3>
        <p>尝试清空搜索词或切换筛选条件。</p>
      </div>
    </section>

    <section v-if="selectedPlan" id="workout-panel" class="workout-panel">
      <div class="workout-header">
        <div>
          <p class="eyebrow">今日训练</p>
          <h2>{{ selectedPlan.plan.name }}</h2>
          <p>填写每个动作的数据，每组使用相同设置。</p>
        </div>
        <button type="button" class="close-button" aria-label="关闭训练表单" @click="selectedPlan = null">×</button>
      </div>

      <div v-if="planDays.length > 1" class="day-tabs" role="tablist" aria-label="选择训练日">
        <span>选择训练日</span>
        <button
          v-for="day in planDays"
          :key="day"
          type="button"
          role="tab"
          :aria-selected="activeDay === day"
          :class="{ active: activeDay === day }"
          @click="activeDay = day"
        >
          第 {{ day }} 天
        </button>
      </div>

      <form @submit.prevent="saveWorkout">
        <fieldset v-for="(item, index) in activePlanExercises" :key="item.id" class="exercise-fieldset">
          <legend><span>{{ formatIndex(index) }}</span>{{ item.exercise.name }}</legend>
          <p>{{ item.exercise.instructions }}</p>
          <div class="exercise-fields">
            <label>重量（kg）<input v-model.number="draft[item.id].weightKg" type="number" min="0" step="0.5" /></label>
            <label v-if="item.targetSeconds === undefined">
              每组次数
              <input v-model.number="draft[item.id].reps" type="number" min="1" max="1000" required />
            </label>
            <label v-else>
              每组秒数
              <input v-model.number="draft[item.id].durationSeconds" type="number" min="1" max="36000" required />
            </label>
            <label>组数<input v-model.number="draft[item.id].sets" type="number" min="1" max="20" required /></label>
          </div>
        </fieldset>
        <button class="save-button" type="submit" :disabled="saving">{{ saving ? "正在保存…" : "保存本次训练" }}</button>
      </form>
    </section>

    <section v-if="editingWorkout" id="edit-workout-panel" class="workout-panel">
      <div class="workout-header">
        <div>
          <p class="eyebrow">编辑训练</p>
          <h2>{{ editingWorkout.planName ?? "自由训练" }}</h2>
          <p>修改重量、次数和组数后重新保存。</p>
        </div>
        <button type="button" class="close-button" aria-label="关闭编辑表单" @click="editingWorkout = null">×</button>
      </div>

      <form @submit.prevent="saveWorkoutEdit">
        <fieldset
          v-for="(item, index) in editingWorkout.exercises"
          :key="item.id ?? item.position"
          class="exercise-fieldset"
        >
          <legend><span>{{ formatIndex(index) }}</span>{{ item.exerciseName }}</legend>
          <div class="exercise-fields">
            <label>
              重量（kg）
              <input
                v-model.number="editDraft[item.id ?? String(item.position)].weightKg"
                type="number"
                min="0"
                step="0.5"
              />
            </label>
            <label v-if="item.sets[0]?.setType === 'time'">
              每组秒数
              <input
                v-model.number="editDraft[item.id ?? String(item.position)].durationSeconds"
                type="number"
                min="1"
                max="36000"
                required
              />
            </label>
            <label v-else>
              每组次数
              <input
                v-model.number="editDraft[item.id ?? String(item.position)].reps"
                type="number"
                min="1"
                max="1000"
                required
              />
            </label>
            <label>
              组数
              <input
                v-model.number="editDraft[item.id ?? String(item.position)].sets"
                type="number"
                min="1"
                max="30"
                required
              />
            </label>
          </div>
        </fieldset>
        <button class="save-button" type="submit" :disabled="saving">
          {{ saving ? "正在保存…" : "保存修改" }}
        </button>
      </form>
    </section>

    <section id="recent" class="section recent">
      <div class="section-heading">
        <div><p class="eyebrow">训练记录</p><h2>最近的训练</h2></div>
        <p>记录由 API 返回，将来会保存到云端数据库中。</p>
      </div>

      <div v-if="workouts.length === 0" class="empty-card">
        <span>＋</span>
        <h3>还没有训练记录</h3>
        <p>选择一个训练计划，完成你的第一次记录。</p>
      </div>

      <div v-else class="record-list">
        <article v-for="workout in workouts" :key="workout.id" class="record-card">
          <div class="record-heading">
            <div>
              <p class="eyebrow">{{ formatDate(workout.performedAt) }}</p>
              <h3>{{ workout.planName ?? "自由训练" }}</h3>
            </div>
            <div class="record-actions">
              <button type="button" class="edit-button" @click="openEditWorkout(workout)">编辑</button>
              <button type="button" class="delete-button" @click="removeWorkout(workout.id)">删除</button>
            </div>
          </div>
          <ul>
            <li v-for="exercise in workout.exercises" :key="exercise.id ?? exercise.exerciseName">
              <strong>{{ exercise.exerciseName }}</strong>
              <span>{{ exercise.sets.length }} 组 × {{ exercise.sets[0]?.reps ?? "—" }} 次</span>
            </li>
          </ul>
        </article>
      </div>
    </section>

    <section id="profile" class="section profile-section">
      <div class="section-heading">
        <div><p class="eyebrow">账号与数据</p><h2>管理你的训练空间</h2></div>
        <p>昵称会显示在训练空间中。训练记录只能由当前账号访问。</p>
      </div>

      <div class="settings-card">
        <div class="settings-block">
          <div>
            <h3>个人资料</h3>
            <p>{{ currentUser.email }}</p>
          </div>
          <form class="inline-form" @submit.prevent="updateProfile">
            <label>
              昵称
              <input v-model.trim="profileName" type="text" minlength="2" maxlength="40" required />
            </label>
            <button type="submit" :disabled="profileSaving">
              {{ profileSaving ? "保存中…" : "保存昵称" }}
            </button>
          </form>
        </div>

        <div class="settings-block">
          <div><h3>导出训练记录</h3><p>下载当前账号全部训练组数据为 CSV。</p></div>
          <button class="secondary-button" type="button" @click="exportData">导出 CSV</button>
        </div>

        <div class="settings-block danger-block">
          <div><h3>注销账号</h3><p>永久删除当前账号和全部训练记录。</p></div>
          <button class="danger-button" type="button" @click="deleteAccount">注销账号</button>
        </div>
      </div>
    </section>
    </main>

    <div v-if="notice" class="toast" role="status">{{ notice }}</div>

    <footer>
      <a class="logo" href="#top">FitPlan<span>.</span></a>
      <p>训练内容仅供一般健身参考，不替代医生或专业教练的建议。</p>
      <p>© 2026 FitPlan</p>
    </footer>
  </template>
</template>
