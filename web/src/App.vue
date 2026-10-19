<script setup>
import { ref, onMounted } from "vue";

const API = "";
const mode = ref("login");
const email = ref("");
const password = ref("");
const name = ref("");
const token = ref(localStorage.getItem("token") || "");
const user = ref(null);
const error = ref("");
const loading = ref(false);

async function refreshMe() {
  if (!token.value) { user.value = null; return; }
  const res = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token.value}` } });
  const data = await res.json();
  if (!data.ok) { token.value = ""; localStorage.removeItem("token"); user.value = null; return; }
  user.value = data.user;
}

async function submit() {
  error.value = "";
  loading.value = true;
  try {
    const path = mode.value === "login" ? "/auth/login" : "/auth/register";
    const body = mode.value === "login"
      ? { email: email.value, password: password.value }
      : { email: email.value, password: password.value, name: name.value };
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "failed");
    token.value = data.token;
    localStorage.setItem("token", data.token);
    user.value = data.user;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

function logout() {
  token.value = "";
  user.value = null;
  localStorage.removeItem("token");
}

onMounted(refreshMe);
</script>

<template>
  <div class="page">
    <header>
      <strong>Vue Auth Panel</strong>
      <span class="muted">Node · JWT · Vue 3</span>
    </header>

    <section v-if="user" class="card">
      <h1>سلام، {{ user.name }}</h1>
      <p class="muted">{{ user.email }}</p>
      <button @click="logout">خروج</button>
    </section>

    <section v-else class="card">
      <div class="tabs">
        <button :class="{ on: mode === 'login' }" @click="mode = 'login'">ورود</button>
        <button :class="{ on: mode === 'register' }" @click="mode = 'register'">ثبت‌نام</button>
      </div>
      <form @submit.prevent="submit">
        <label v-if="mode === 'register'">نام
          <input v-model="name" type="text" />
        </label>
        <label>ایمیل
          <input v-model="email" type="email" required />
        </label>
        <label>رمز
          <input v-model="password" type="password" required minlength="6" />
        </label>
        <p v-if="error" class="err">{{ error }}</p>
        <button type="submit" :disabled="loading">{{ loading ? "..." : (mode === 'login' ? 'ورود' : 'ثبت‌نام') }}</button>
      </form>
    </section>
  </div>
</template>

<style>
:root {
  --bg: #0f1419;
  --card: #1a222c;
  --ink: #e8eef2;
  --muted: #8aa0b2;
  --accent: #3d9cf0;
  --err: #e05b5b;
  font-family: "Segoe UI", Tahoma, sans-serif;
}
* { box-sizing: border-box; }
body { margin: 0; background: radial-gradient(800px 400px at 20% 0%, #1a3040, var(--bg)); color: var(--ink); }
.page { max-width: 420px; margin: 0 auto; padding: 2rem 1rem; }
header { display: flex; justify-content: space-between; margin-bottom: 1.5rem; }
.muted { color: var(--muted); font-size: 0.9rem; }
.card { background: var(--card); border: 1px solid #2a3542; border-radius: 12px; padding: 1.5rem; }
.tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
.tabs button, button { cursor: pointer; border: 0; border-radius: 8px; padding: 0.7rem 1rem; background: #243040; color: var(--ink); }
.tabs button.on, button[type="submit"] { background: var(--accent); color: #041018; font-weight: 600; }
label { display: block; margin-bottom: 0.85rem; font-size: 0.9rem; }
input { width: 100%; margin-top: 0.35rem; padding: 0.65rem 0.75rem; border-radius: 8px; border: 1px solid #2a3542; background: #121820; color: var(--ink); }
.err { color: var(--err); }
h1 { margin: 0 0 0.35rem; font-size: 1.4rem; }
</style>
