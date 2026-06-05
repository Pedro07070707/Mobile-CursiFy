export const lightTheme = {
  spacing: { xs: 4, s: 8, m: 16, l: 24, xl: 32, xxl: 48 },
  radius: { sm: 8, md: 12, lg: 16, full: 999 },
  typography: { h1: 30, h2: 22, body: 16, small: 13 },
  dark: false,
  colors: {
    primary: "#4F46E5",
    primaryForeground: "#FFFFFF",
    secondary: "#10B981",
    background: "#FFFFFF",
    surface: "#F9FAFB",
    surfaceHighlight: "#F3F4F6",
    text: "#111827",
    textMain: "#111827",
    textMuted: "#6B7280",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
    error: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B",
    activeTabBg: "#EEF2FF",
    feedbackBg: "#EEF2FF",
  },
};

export const darkTheme = {
  ...lightTheme,
  dark: true,
  colors: {
    primary: "#818CF8",
    primaryForeground: "#FFFFFF",
    secondary: "#34D399",
    background: "#0F172A",
    surface: "#1E293B",
    surfaceHighlight: "#334155",
    text: "#F1F5F9",
    textMain: "#F1F5F9",
    textMuted: "#94A3B8",
    textSecondary: "#94A3B8",
    border: "#334155",
    error: "#F87171",
    success: "#34D399",
    warning: "#FBBF24",
    activeTabBg: "#1E1B4B",
    feedbackBg: "#1E1B4B",
  },
};

export type Theme = typeof lightTheme;

export const Colors = {
  light: {
    text: lightTheme.colors.text,
    background: lightTheme.colors.background,
    backgroundElement: lightTheme.colors.surface,
    backgroundSelected: lightTheme.colors.activeTabBg,
    textSecondary: lightTheme.colors.textSecondary,
  },
  dark: {
    text: darkTheme.colors.text,
    background: darkTheme.colors.background,
    backgroundElement: darkTheme.colors.surface,
    backgroundSelected: darkTheme.colors.activeTabBg,
    textSecondary: darkTheme.colors.textSecondary,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = {
  sans: "system-ui",
  serif: "serif",
  rounded: "system-ui",
  mono: "monospace",
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = 0;
export const MaxContentWidth = 800;
