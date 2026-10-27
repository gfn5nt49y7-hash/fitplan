<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import type {
  AuthSession,
  CreateWorkoutSessionRequest,
  PlannedExercise,
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
}

const plans = ref<PlanSummary[]>([]);
const workouts = ref<WorkoutSession[]>([]);
const stats = ref<WeeklyStats | null>(null);
const currentUser = ref<Profile | null>(null);
const selectedPlan = ref<PlanDetail | null>(null);
const editingWorkout = ref<WorkoutSession | null>(null);
const loading = ref(true);
const authLoading = ref(true);
const saving = ref(false);
const profileSaving = ref(false);
const error = ref("");
const notice = ref("");
const profileName = ref("");
const draft = reactive<Record<string, DraftEntry>>({});
const editDraft = reactive<Record<string, DraftEntry>>({});

async function loadData() {
  loading.value = true;
  error.value = "";
  try {
    const [planData, workoutData, weeklyData] = await Promise.all([
      apiRequest<PlanSummary[]>("/api/v1/plans"),
      apiRequest<WorkoutSession[]>("/api/v1/workouts"),
      apiRequest<WeeklyStats>("/api/v1/stats/weekly")
    ]);
    plans.value = planData;
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
    Object.keys(draft).forEach(function (key) {
      delete draft[key];
    });
    selectedPlan.value.exercises.forEach(function (item) {
      draft[item.id] = {
        weightKg: 0,
        reps: item.targetReps ?? 10,
        sets: item.targetSets
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
    const exercises = selectedPlan.value.exercises.map(function (item) {
      const entry = draft[item.id] ?? { weightKg: 0, reps: 10, sets: item.targetSets };
      const isBodyweight = item.exercise.equipment === "无器械";
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
            setType: isBodyweight ? "bodyweight" as const : "weight_reps" as const,
            weightKg: isBodyweight ? undefined : entry.weightKg,
            reps: entry.reps
          };
        })
      };
    });

    const payload: CreateWorkoutSessionRequest = {
      planId: selectedPlan.value.plan.id,
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
  editingWorkout.value = structuredClone(workout);
  clearEditDraft();
  editingWorkout.value.exercises.forEach(function (exercise) {
    const firstSet = exercise.sets[0];
    editDraft[exercise.id ?? String(exercise.position)] = {
      weightKg: firstSet?.weightKg ?? 0,
      reps: firstSet?.reps ?? 10,
      sets: exercise.sets.length
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
        sets: item.sets.length
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
            weightKg: setType === "bodyweight" ? undefined : entry.weightKg,
            reps: entry.reps
          };
        })
      };
    });

    const payload: CreateWorkoutSessionRequest = {
      planId: editingWorkout.value.planId,
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

    <section id="plans" class="section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">训练计划</p>
          <h2>从适合你的节奏开始</h2>
        </div>
        <p>计划来自后端 API，训练时可以选择并按组记录。</p>
      </div>

      <div v-if="loading" class="loading-card">正在加载训练计划…</div>
      <div v-else class="plan-grid">
        <article v-for="(plan, index) in plans" :key="plan.id" class="plan-card" :class="{ featured: index === 0 }">
          <div class="plan-top"><span>{{ difficultyLabel(plan.difficulty) }}</span><b>0{{ index + 1 }}</b></div>
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

      <form @submit.prevent="saveWorkout">
        <fieldset v-for="(item, index) in selectedPlan.exercises" :key="item.id" class="exercise-fieldset">
          <legend><span>0{{ index + 1 }}</span>{{ item.exercise.name }}</legend>
          <p>{{ item.exercise.instructions }}</p>
          <div class="exercise-fields">
            <label>重量（kg）<input v-model.number="draft[item.id].weightKg" type="number" min="0" step="0.5" /></label>
            <label>每组次数<input v-model.number="draft[item.id].reps" type="number" min="1" max="100" required /></label>
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
          <legend><span>0{{ index + 1 }}</span>{{ item.exerciseName }}</legend>
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
            <label>
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
