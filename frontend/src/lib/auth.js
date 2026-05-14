import { api } from "./api";

const TOKEN_KEY = "noctra_token";
const USER_KEY = "noctra_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

export async function register({ name, email, password, role, instagram_username, niche, industry }) {
  const body = { name, email, password, role };
  if (instagram_username) body.instagram_username = instagram_username;
  if (niche) body.niche = niche;
  if (industry) body.industry = industry;
  const { data } = await api.post("/auth/register", body);
  saveSession(data.access_token, data.user);
  return data.user;
}

export async function login({ email, password }) {
  const { data } = await api.post("/auth/login", { email, password });
  saveSession(data.access_token, data.user);
  return data.user;
}

export function signOut() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  delete api.defaults.headers.common["Authorization"];
}

// Call once at app start to restore auth header from stored token
export function initAuth() {
  const token = getToken();
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
}
