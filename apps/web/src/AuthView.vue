<script setup lang="ts">
import { reactive, ref } from "vue";
import type { AuthSession } from "@fitplan/contracts";
import { apiRequest, setAccessToken } from "./api";

const emit = defineEmits<{
  authenticated: [session: AuthSession];
}>();

const mode = ref<"login" | "register">("login");
const submitting = ref(false);
const error = ref("");
const form = reactive({
  displayName: "",
  email: "",
  password: "",
  confirmPassword: ""
});

function switchMode(nextMode: "login" | "register") {
  mode.value = nextMode;
  error.value = "";
  form.password = "";
  form.confirmPassword = "";
}

async function submit() {
  error.value = "";
  if (mode.value === "register" && form.password !== form.confirmPassword) {
    error.value = "两次输入的密码不一致";
    return;
  }

  submitting.value = true;
  try {
    const session = await apiRequest<AuthSession>(
      mode.value === "login" ? "/api/v1/auth/login" : "/api/v1/auth/register",
      {
        method: "POST",
        body: JSON.stringify(
          mode.value === "login"
            ? { email: form.email, password: form.password }
            : {
                email: form.email,
                password: form.password,
                displayName: form.displayName
              }
        )
      }
    );
    setAccessToken(session.accessToken);
    emit("authenticated", session);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "登录失败，请稍后再试";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="auth-page">
    <section class="auth-intro">
      <a class="logo auth-logo" href="/">FitPlan<span>.</span></a>
      <p class="eyebrow">训练，从第一条记录开始</p>
      <h1>每一次认真训练，<br /><span>都值得被看见。</span></h1>
      <p>登录后可以跨设备查看训练计划与历史记录。你的训练数据默认只有自己可见。</p>
      <div class="auth-points">
        <span>清晰计划</span>
        <span>按组记录</span>
        <span>每周进步</span>
      </div>
    </section>

    <section class="auth-card">
      <div class="auth-tabs" aria-label="账号操作">
        <button type="button" :class="{ active: mode === 'login' }" @click="switchMode('login')">登录</button>
        <button type="button" :class="{ active: mode === 'register' }" @click="switchMode('register')">注册</button>
      </div>

      <div class="auth-heading">
        <p class="eyebrow">欢迎来到 FitPlan</p>
        <h2>{{ mode === "login" ? "继续你的训练" : "创建你的账号" }}</h2>
        <p>{{ mode === "login" ? "输入账号信息进入训练空间。" : "只需一分钟，开始记录第一次训练。" }}</p>
      </div>

      <form @submit.prevent="submit">
        <label v-if="mode === 'register'">
          昵称
          <input
            v-model.trim="form.displayName"
            name="displayName"
            type="text"
            minlength="2"
            maxlength="40"
            autocomplete="nickname"
            placeholder="如何称呼你"
            required
          />
        </label>

        <label>
          邮箱
          <input
            v-model.trim="form.email"
            name="email"
            type="email"
            maxlength="254"
            autocomplete="email"
            placeholder="name@example.com"
            required
          />
        </label>

        <label>
          密码
          <input
            v-model="form.password"
            name="password"
            type="password"
            minlength="8"
            maxlength="72"
            :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
            placeholder="至少 8 个字符"
            required
          />
        </label>

        <label v-if="mode === 'register'">
          确认密码
          <input
            v-model="form.confirmPassword"
            name="confirmPassword"
            type="password"
            minlength="8"
            maxlength="72"
            autocomplete="new-password"
            placeholder="再次输入密码"
            required
          />
        </label>

        <p v-if="error" class="auth-error" role="alert">{{ error }}</p>
        <button class="auth-submit" type="submit" :disabled="submitting">
          {{ submitting ? "请稍候…" : mode === "login" ? "登录 FitPlan" : "创建账号" }}
        </button>
      </form>

      <p class="auth-note">当前为开发测试账号，数据服务重启后会清空。正式版将接入云端账号与数据同步。</p>
    </section>
  </div>
</template>
