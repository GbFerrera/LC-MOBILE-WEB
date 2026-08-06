import { clearNavigationData } from "@/lib/navigation-storage";

const APP_SESSION_KEYS = [
  "@linkCallendar:token",
  "@linkCallendar:user",
  "@linkCallendar:navigation_context",
  "@linkCallendar:navigation_data",
  "token",
  "primaryColor",
  "appBackgroundColor",
  "appBackgroundImageUrl",
  "appBackgroundImageOpacity",
] as const;

const DEFAULT_PRIMARY_COLOR = "#3D583F";

export function clearAppSession(): void {
  if (typeof window === "undefined") return;

  for (const key of APP_SESSION_KEYS) {
    localStorage.removeItem(key);
  }

  clearNavigationData();
  resetThemeStyles();
  window.dispatchEvent(new CustomEvent("appSessionCleared"));
}

export function persistAuthSession(token: string, user: object): void {
  if (typeof window === "undefined") return;

  localStorage.setItem("@linkCallendar:token", token);
  localStorage.setItem("@linkCallendar:user", JSON.stringify(user));
  localStorage.setItem("token", token);
}

export function resetThemeStyles(): void {
  if (typeof document === "undefined") return;

  document.documentElement.style.setProperty("--primary", DEFAULT_PRIMARY_COLOR);
  document.documentElement.style.setProperty("--primary-foreground", "#ffffff");
  document.documentElement.style.setProperty("--sidebar-primary", DEFAULT_PRIMARY_COLOR);
  document.documentElement.style.setProperty("--sidebar-primary-foreground", "#ffffff");
  document.documentElement.style.setProperty("--ring", DEFAULT_PRIMARY_COLOR);
  document.documentElement.style.setProperty("--app-bg-color", "#F1F1E7");
  document.documentElement.style.setProperty("--app-bg-image", "none");
  document.documentElement.style.setProperty("--app-bg-image-opacity", "0.2");

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute("content", DEFAULT_PRIMARY_COLOR);
  }
}
