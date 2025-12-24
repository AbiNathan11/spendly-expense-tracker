import React, { useState, useEffect } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../components/Screen";
import { theme } from "../theme/theme";
import { authService } from "../services/authService";
import { API_URL } from "../config/api";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ResetRouteProp = RouteProp<RootStackParamList, "ResetPassword">;

interface ResetParams {
  accessToken?: string;
  refreshToken?: string;
}

export function ResetPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ResetRouteProp>();
  const params = route.params as ResetParams || {};

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    // Check if we have tokens from the URL (deep link)
    if (params.accessToken) {
      setToken(params.accessToken);
    } else {
      setError("Invalid or expired reset link");
    }
  }, [params]);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Invalid or expired reset link");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/update-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          password: password
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Failed to reset password");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Screen>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#10B981" />
            </View>
            <Text style={styles.title}>Password Reset Successful</Text>
            <Text style={styles.message}>
              Your password has been reset successfully. You can now login with your new password.
            </Text>
          </View>

          <Pressable
            onPress={() => navigation.replace("Auth", { mode: "login" })}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryText}>Go to Login</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed-outline" size={48} color="#F59E0B" />
          </View>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.message}>
            Enter your new password below.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color="#64748B" />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter new password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              style={styles.input}
            />
          </View>

          <View style={{ height: theme.spacing.md }} />

          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color="#64748B" />
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              style={styles.input}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            onPress={handleResetPassword}
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            disabled={loading}
          >
            <Text style={styles.primaryText}>
              {loading ? "Resetting..." : "Reset Password"}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.xl,
    flex: 1,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#223447",
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
  form: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#223447",
    marginBottom: 8,
  },
  inputRow: {
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: theme.spacing.md,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 14,
    color: "#223447",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    marginBottom: theme.spacing.sm,
  },
  primaryBtn: {
    height: 58,
    borderRadius: 29,
    backgroundColor: "#223447",
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
  backBtn: {
    alignItems: "center",
  },
  backText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#223447",
  },
});
