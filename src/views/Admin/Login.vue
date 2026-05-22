<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-logo">
        <el-icon :size="48"><Camera /></el-icon>
      </div>
      <h2 class="login-title">摄影站管理后台</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <el-input v-model="username" placeholder="用户名" size="large" :prefix-icon="User" />
        </div>
        <div class="form-group">
          <el-input v-model="password" type="password" placeholder="密码" size="large" :prefix-icon="Lock" show-password />
        </div>
        <el-button type="primary" size="large" :loading="loading" native-type="submit" class="login-btn">登 录</el-button>
        <p v-if="error" class="error-msg">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { Camera, User, Lock } from "@element-plus/icons-vue"

const emit = defineEmits(["login"])
const username = ref("")
const password = ref("")
const loading = ref(false)
const error = ref("")

const handleLogin = async () => {
  loading.value = true
  error.value = ""
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.value, password: password.value })
    })
    const data = await res.json()
    if (data.success) {
      localStorage.setItem("admin_token", data.token)
      emit("login", data.token)
    } else {
      error.value = data.error || "登录失败"
    }
  } catch (e) {
    error.value = "网络错误"
  }
  loading.value = false
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--admin-bg, #f5f5f7);
}
.login-card {
  width: 360px;
  padding: 48px 40px;
  background: var(--admin-card-bg, #fff);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
  text-align: center;
}
.login-logo {
  color: var(--primary-color, #007aff);
  margin-bottom: 16px;
}
.login-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--admin-text-primary, #1d1d1f);
  margin-bottom: 32px;
}
.form-group {
  margin-bottom: 20px;
}
.login-btn {
  width: 100%;
  border-radius: 12px;
  font-size: 16px;
  height: 48px;
}
.error-msg {
  margin-top: 16px;
  color: #ff3b30;
  font-size: 14px;
}
</style>
