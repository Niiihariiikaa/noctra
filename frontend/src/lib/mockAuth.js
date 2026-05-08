// Simple localStorage-backed mock auth.
const KEY = "zync_user";

export function getUser() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function signIn({ email, role, name, brandId, creatorId }) {
  const user = {
    email,
    role, // "brand" | "creator" | "editor"
    name: name || email.split("@")[0],
    brandId: brandId || null,
    creatorId: creatorId || null,
    signedInAt: new Date().toISOString(),
  };
  localStorage.setItem(KEY, JSON.stringify(user));
  return user;
}

export function signOut() {
  localStorage.removeItem(KEY);
}

export function updateUser(patch) {
  const u = getUser() || {};
  const next = { ...u, ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
