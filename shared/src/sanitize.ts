export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeDisplayName(name: string): string {
  return name.trim().slice(0, 24);
}

export function sanitizeChatText(text: string): string {
  return text
    .trim()
    .replace(/[<>]/g, "")
    .slice(0, 500);
}
