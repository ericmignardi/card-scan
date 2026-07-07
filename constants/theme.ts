// Mirrors the palette in tailwind.config.js. NativeWind class names cover most styling,
// but a few RN props (icon `color`, ActivityIndicator, Switch track colors) take raw
// color values instead of class names, so they read from here to avoid hardcoded hex
// scattered across screens.
export const colors = {
  background: "#090d16",
  backgroundCard: "#131927",
  foreground: "#f8fafc",
  foregroundMuted: "#94a3b8",
  primary: "#3b82f6",
  secondary: "#475569",
  accent: "#14b8a6",
  border: "#1e293b",
  rookie: "#eab308",
  danger: "#ef4444",
} as const;

export const SPORTS = ["Baseball", "Basketball", "Football", "Soccer", "Hockey", "Other"] as const;

export type Sport = (typeof SPORTS)[number];
