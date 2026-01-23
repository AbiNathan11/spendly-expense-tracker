import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../components/Screen";
import { theme } from "../theme/theme";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Slide = {
  title: string;
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const ui = {
  bg: "#223447",
  text: "#FFFFFF",
  muted: "#B8C5D6",
  accent: "#F59E0B",
  cardBg: "#2A3A5C",
  dotInactive: "#4A5568",
  skipText: "#9CA3AF",
};

export function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const slides = useMemo<Slide[]>(
    () => [
      {
        title: "Budget with\nEnvelopes",
        body: "Easily allocate your funds to different\nspending categories and stay on track with\nyour financial goals.",
        icon: "mail-open-outline",
      },
      {
        title: "Know Your Daily Limit",
        body: "Our app calculates a safe-to-spend amount\nfor each day, so you never have to guess.",
        icon: "calculator-outline", // Changed icon
      },
      {
        title: "Never Miss a Bill",
        body: "Get smart reminders for upcoming payments\nand subscriptions so you're always on time.",
        icon: "notifications-outline",
      },
    ],
    []
  );

  const [index, setIndex] = useState(0);
  const current = slides[index];
  const isLast = index === slides.length - 1;

  const handleNext = () => {
    if (isLast) navigation.replace("Auth", { mode: "signup" });
    else setIndex((v: number) => v + 1);
  };

  const handleSkip = () => {
    navigation.replace("Auth", { mode: "signup" });
  };

  return (
    <Screen padded={false} ignoreSafe style={[styles.screen, { backgroundColor: ui.bg }]}>
      <View style={styles.container}>
        {/* Illustration Area */}
        <View style={styles.illustrationArea}>
          <View style={styles.illustrationContent}>
            <Ionicons name={current.icon} size={120} color={ui.accent} />
          </View>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.body}>{current.body}</Text>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {/* Left: Skip */}
          <Pressable onPress={handleSkip} style={styles.btn}>
            <Text style={styles.skip}>Skip</Text>
          </Pressable>

          {/* Center: Dots */}
          <View style={styles.dots}>
            {slides.map((_: Slide, i: number) => (
              <View key={i} style={[styles.dot, i === index ? styles.dotActive : null]} />
            ))}
          </View>

          {/* Right: Next */}
          <Pressable onPress={handleNext} style={styles.btn}>
            <Text style={styles.nextText}>{isLast ? "Start" : "Next"}</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: ui.bg,
    flex: 1,
  },
  container: {
    flex: 1,
  },
  illustrationArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 40,
  },
  illustrationContent: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg,
  },
  title: {
    color: ui.text,
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  body: {
    color: ui.muted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  bottomControls: {
    flexDirection: "row", // Row layout
    alignItems: "center",
    justifyContent: "space-between", // Spread left and right
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.md,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: ui.dotInactive,
  },
  dotActive: {
    backgroundColor: ui.accent,
    width: 24,
  },
  btn: {
    padding: 10,
  },
  nextText: {
    color: ui.accent, // Yellow text
    fontSize: 18,
    fontWeight: "700",
  },
  skip: {
    color: ui.skipText,
    fontSize: 16,
    fontWeight: "500",
  },
});
