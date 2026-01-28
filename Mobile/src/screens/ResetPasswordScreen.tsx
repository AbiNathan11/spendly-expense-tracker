import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../components/Screen";
import { theme } from "../theme/theme";
import { API_URL } from "../config/api";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ResetPasswordRouteProp = RouteProp<RootStackParamList, "ResetPassword">;

export function ResetPasswordScreen() {
    const navigation = useNavigation<Nav>();
    const route = useRoute<ResetPasswordRouteProp>();
    const { email } = route.params;

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (!password || !confirmPassword) {
            Alert.alert("Error", "Please fill in all fields.");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters long.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/reset-password-with-otp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    newPassword: password,
                }),
            });

            const data = await response.json();

            if (data.success) {
                Alert.alert(
                    "Success",
                    "Your password has been reset successfully!",
                    [
                        {
                            text: "Login",
                            onPress: () => navigation.navigate("Auth", { mode: "login" }),
                        },
                    ]
                );
            } else {
                Alert.alert("Error", data.error || "Failed to reset password.");
            }
        } catch (err) {
            Alert.alert("Error", "Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Screen style={styles.screen}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
                </Pressable>
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitle}>
                    Create a new password for your account.
                </Text>

                <View style={styles.inputWrap}>
                    <Text style={styles.label}>New Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter new password"
                            placeholderTextColor={theme.colors.muted}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                        />
                        <Pressable
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeIcon}
                        >
                            <Ionicons
                                name={showPassword ? "eye-off-outline" : "eye-outline"}
                                size={20}
                                color={theme.colors.muted}
                            />
                        </Pressable>
                    </View>
                </View>

                <View style={styles.inputWrap}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.input}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Confirm new password"
                            placeholderTextColor={theme.colors.muted}
                            secureTextEntry={!showConfirmPassword}
                            autoCapitalize="none"
                        />
                        <Pressable
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={styles.eyeIcon}
                        >
                            <Ionicons
                                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                                size={20}
                                color={theme.colors.muted}
                            />
                        </Pressable>
                    </View>
                </View>

                <Pressable
                    style={[styles.btn, loading && styles.btnDisabled]}
                    onPress={handleReset}
                    disabled={loading}
                >
                    <Text style={styles.btnText}>{loading ? "Updating..." : "Update Password"}</Text>
                </Pressable>
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: {
        paddingHorizontal: theme.spacing.lg,
        alignItems: "center",
    },
    header: {
        paddingTop: theme.spacing.md,
        marginBottom: theme.spacing.lg,
        width: "100%",
        maxWidth: 400,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: "center",
    },
    content: {
        flex: 1,
        width: "90%",
        maxWidth: 400,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    subtitle: {
        fontSize: 15,
        color: theme.colors.muted,
        lineHeight: 22,
        marginBottom: theme.spacing.xl,
    },
    inputWrap: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        fontSize: 14,
        fontWeight: "700",
        color: theme.colors.text,
        marginBottom: 8,
    },
    passwordContainer: {
        position: "relative",
    },
    input: {
        height: 52,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        paddingHorizontal: 16,
        paddingRight: 48,
        fontSize: 16,
        color: theme.colors.text,
        backgroundColor: theme.colors.surface,
    },
    eyeIcon: {
        position: "absolute",
        right: 16,
        top: 16,
        padding: 4,
    },
    btn: {
        height: 56,
        backgroundColor: theme.colors.primary,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        marginTop: theme.spacing.md,
    },
    btnDisabled: {
        opacity: 0.6,
    },
    btnText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
    },
});
