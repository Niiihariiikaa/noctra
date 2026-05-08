export function formatINR(amount) {
  if (amount == null) return "₹0";
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatFollowers(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${n}`;
}

export function trustBadge(score) {
  if (score >= 80) return { label: "Verified", color: "#00d4c8", bg: "rgba(0,212,200,0.12)" };
  if (score >= 60) return { label: "High Engagement", color: "#4f8ef7", bg: "rgba(79,142,247,0.12)" };
  if (score >= 40) return { label: "Rising Creator", color: "#ff8c42", bg: "rgba(255,140,66,0.12)" };
  return { label: "New", color: "#a0a0a0", bg: "rgba(160,160,160,0.12)" };
}
