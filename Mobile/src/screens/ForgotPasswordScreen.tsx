import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../components/Screen";
import { theme } from "../theme/theme";
import { authService } from "../services/authService";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log('Sending password reset request to:', email);
      const response = await authService.forgotPassword(email);
      console.log('Password reset response:', response);
      
      if (response.success) {
        console.log('Password reset email sent successfully');
        setSuccess(true);
      } else {
        console.log('Password reset failed:', response.error);
        setError(response.error || "Failed to send reset email");
      }
    } catch (err) {
      console.log('Password reset error:', err);
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
              <Ionicons name="mail-outline" size={48} color="#10B981" />
            </View>
            <Text style={styles.title}>Check Your Email</Text>
            <Text style={styles.message}>
              We've sent a password reset link to {email}. Please check your inbox and follow the instructions.
            </Text>
          </View>

          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>Back to Login</Text>
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
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.message}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={18} color="#64748B" />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              keyboardType="email-address"
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
              {loading ? "Sending..." : "Send Reset Link"}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>Back to Login</Text>
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
    marginBottom: theme.spacing.xl,
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
  linkContainer: {
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  linkText: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 12,
    textAlign: "center",
  },
  openLinkBtn: {
    backgroundColor: "#223447",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  openLinkText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
