// Cartoon avatar helper — DiceBear avataaars style, no API key needed
export function getAvatar(creator) {
  if (creator?.avatar && creator.avatar.startsWith("data:")) return creator.avatar;
  const seed = encodeURIComponent(creator?.name || creator?.id || "creator");
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,ffd5dc,ffdfbf&radius=50`;
}

// For brand initials (no avatar system for brands)
export function brandInitial(name = "") {
  return name?.[0]?.toUpperCase() || "B";
}
