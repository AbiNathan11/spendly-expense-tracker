import React, { useState, useEffect } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../components/Screen";
import { theme } from "../theme/theme";
import { useBudget } from "../state/BudgetStore";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type AuthRouteProp = RouteProp<RootStackParamList, "Auth">;

export function AuthScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<AuthRouteProp>();
  const { login, signup, state } = useBudget();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (route.params?.mode) {
      setMode(route.params.mode);
    }
  }, [route.params?.mode]);

  const primaryLabel = mode === "login" ? "Log In" : "Sign Up";

  const handleAuth = async () => {
    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }

    if (mode === "signup" && !name) {
      alert("Please enter your name");
      return;
    }

    let success;
    if (mode === "signup") {
      success = await signup(email, password, name);
    } else {
      success = await login(email, password);
    }

    if (success) {
      navigation.replace("AppTabs");
    } else {
      alert(state.authError || "Authentication failed");
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="wallet-outline" size={34} color="#F59E0B" />
            <Text style={styles.brand}>Spendly</Text>
          </View>
        </View>

        <View style={styles.segmentWrap}>
          <View style={styles.segment}>
            <Pressable
              onPress={() => setMode("login")}
              style={[styles.segmentBtn, mode === "login" ? styles.segmentBtnActive : null]}
            >
              <Text style={[styles.segmentText, mode === "login" ? styles.segmentTextActive : null]}>Log In</Text>
            </Pressable>
            <Pressable
              onPress={() => setMode("signup")}
              style={[styles.segmentBtn, mode === "signup" ? styles.segmentBtnActive : null]}
            >
              <Text style={[styles.segmentText, mode === "signup" ? styles.segmentTextActive : null]}>Sign Up</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.form}>

          {/* Full Name - Signup Only */}
          {mode === "signup" && (
            <View>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={18} color={stylesVars.icon} />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your Name"
                  placeholderTextColor={stylesVars.placeholder}
                  style={styles.input}
                />
              </View>
              <View style={{ height: theme.spacing.md }} />
            </View>
          )}

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={18} color={stylesVars.icon} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={stylesVars.placeholder}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>

          <View style={{ height: theme.spacing.md }} />

          <View style={styles.passwordRowHeader}>
            <Text style={styles.label}>Password</Text>
            {mode === "login" && (
              <Pressable onPress={() => navigation.navigate("ForgotPassword")}>
                <Text style={styles.forgot}>Forgot Password?</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color={stylesVars.icon} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={stylesVars.placeholder}
              autoCapitalize="none"
              secureTextEntry={!showPassword}
              style={styles.input}
            />
            <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.iconBtn}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={stylesVars.icon} />
            </Pressable>
          </View>

          <Pressable
            onPress={handleAuth}
            style={[styles.primaryBtn, state.authLoading && styles.primaryBtnDisabled]}
            disabled={state.authLoading}
          >
            <Text style={styles.primaryText}>
              {state.authLoading
                ? (mode === "login" ? "Logging in..." : "Signing up...")
                : primaryLabel}
            </Text>
          </Pressable>
        </View>

        <View style={styles.bottomRow}>
          {mode === "signup" ? (
            <>
              <Text style={styles.bottomText}>Already have an account? </Text>
              <Pressable onPress={() => setMode("login")}>
                <Text style={styles.bottomLink}>Log In</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.bottomText}>Don't have an account? </Text>
              <Pressable onPress={() => setMode("signup")}>
                <Text style={styles.bottomLink}>Sign Up</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Screen>
  );
}

const stylesVars = {
  bg: "#F9FAFB",
  text: "#223447",
  muted: "#6B7280",
  placeholder: "#9CA3AF",
  border: "#E5E7EB",
  segmentBg: "#E9EDF3",
  segmentBorder: "#E0E6EE",
  icon: "#64748B",
  accent: "#223447",
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.xl,
  },
  header: {
    alignItems: "center",
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    fontSize: 34,
    fontWeight: "900",
    color: stylesVars.text,
    letterSpacing: 0.2,
    marginLeft: 8,
  },
  segmentWrap: {
    marginTop: 22,
    alignItems: "center",
  },
  segment: {
    width: "100%",
    backgroundColor: stylesVars.segmentBg,
    borderRadius: 999,
    padding: 6,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: stylesVars.segmentBorder,
  },
  segmentBtn: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentBtnActive: {
    backgroundColor: "#FFFFFF",
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "700",
    color: stylesVars.muted,
  },
  segmentTextActive: {
    color: stylesVars.text,
  },
  form: {
    marginTop: 22,
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: stylesVars.text,
    marginLeft: 2,
  },
  passwordRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgot: {
    fontSize: 13,
    fontWeight: "700",
    color: stylesVars.accent,
  },
  inputRow: {
    marginTop: 8,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: stylesVars.border,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 14,
    color: stylesVars.text,
  },
  iconBtn: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtn: {
    marginTop: 18,
    height: 58,
    borderRadius: 29,
    backgroundColor: stylesVars.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  dividerRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: stylesVars.border,
  },
  dividerText: {
    color: stylesVars.muted,
    fontWeight: "700",
  },
  socialGoogle: {
    marginTop: 14,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: stylesVars.border,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 12,
  },
  socialIconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: stylesVars.segmentBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: stylesVars.border,
  },
  socialGoogleText: {
    fontSize: 15,
    fontWeight: "800",
    color: stylesVars.text,
  },
  bottomRow: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: theme.spacing.lg,
  },
  bottomText: {
    color: stylesVars.muted,
    fontWeight: "600",
  },
  bottomLink: {
    color: stylesVars.accent,
    fontWeight: "800",
  },
});
