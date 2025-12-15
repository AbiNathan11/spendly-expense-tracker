import { DefaultTheme, type Theme as NavigationTheme } from "@react-navigation/native";

const colors = {
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  surface2: "#F3F4F6",
  text: "#223447",
  muted: "#6B7280",
  primary: "#223447",
  success: "#10B981",
  danger: "#EF4444",
  border: "#E5E7EB",
  accent: "#F59E0B",
};

export const theme = {
  colors,
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
  },
  typography: {
    title: {
      fontSize: 22,
      fontWeight: "700" as const,
    },
    subtitle: {
      fontSize: 16,
      fontWeight: "600" as const,
    },
    body: {
      fontSize: 14,
      fontWeight: "400" as const,
    },
    caption: {
      fontSize: 12,
      fontWeight: "500" as const,
    },
  },
  navigationTheme: {
    ...DefaultTheme,
    dark: false,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.bg,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  } satisfies NavigationTheme,
};
