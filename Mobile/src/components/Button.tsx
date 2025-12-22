import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  type PressableStateCallbackType,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import { theme } from "../theme/theme";

export function Button(props: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  // style?: ViewStyle;
  style?: StyleProp<ViewStyle>;

  disabled?: boolean;
}) {
  const variant = props.variant ?? "primary";
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      style={({ pressed }: PressableStateCallbackType) => [
        styles.base,
        variant === "primary" ? styles.primary : null,
        variant === "secondary" ? styles.secondary : null,
        variant === "ghost" ? styles.ghost : null,
        pressed ? { opacity: 0.9 } : null,
        props.disabled ? { opacity: 0.5 } : null,
        props.style,
      ]}
    >
      <Text
        style={[
          styles.text,
          variant === "ghost" ? { color: theme.colors.text } : null,
          variant === "secondary" ? { color: theme.colors.text } : null,
        ]}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  text: {
    color: "#0B1220",
    fontSize: 14,
    fontWeight: "700",
  },
});
