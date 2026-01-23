import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../components/Screen";
import { theme } from "../theme/theme";
import { API_URL } from "../config/api";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ForgotPasswordScreen() {
    const navigation = useNavigation<Nav>();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async () => {
        if (!email) {
            Alert.alert("Error", "Please enter your email address.");
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert("Error", "Please enter a valid email address.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/send-otp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.success) {
                Alert.alert(
                    "OTP Sent",
                    "A 6-digit verification code has been sent to your email.",
                    [
                        {
                            text: "OK",
                            onPress: () => navigation.navigate("VerifyOTP", { email }),
                        },
                    ]
                );
            } else {
                Alert.alert("Error", data.error || "Failed to send OTP.");
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
                <Text style={styles.title}>Forgot Password?</Text>
                <Text style={styles.subtitle}>
                    Enter your email address and we'll send you a verification code to reset your password.
                </Text>

                <View style={styles.inputWrap}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="johndoe@example.com"
                        placeholderTextColor={theme.colors.muted}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <Pressable
                    style={[styles.btn, loading && styles.btnDisabled]}
                    onPress={handleSendOTP}
                    disabled={loading}
                >
                    <Text style={styles.btnText}>{loading ? "Sending..." : "Send OTP"}</Text>
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
    input: {
        height: 52,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        paddingHorizontal: 16,
        fontSize: 16,
        color: theme.colors.text,
        backgroundColor: theme.colors.surface,
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
