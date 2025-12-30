import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../components/Screen";
import { theme } from "../theme/theme";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ResetPasswordScreen() {
    const navigation = useNavigation<Nav>();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
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

        setLoading(true);
        // TODO: Implement actual password reset logic using token or session
        setTimeout(() => {
            setLoading(false);
            Alert.alert("Success", "Your password has been reset.", [
                { text: "Login", onPress: () => navigation.navigate({ name: "Auth", params: { mode: "login" } }) }
            ]);
        }, 1500);
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
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="New Password"
                        placeholderTextColor={theme.colors.muted}
                        secureTextEntry
                    />
                </View>

                <View style={styles.inputWrap}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <TextInput
                        style={styles.input}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Confirm Password"
                        placeholderTextColor={theme.colors.muted}
                        secureTextEntry
                    />
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
    },
    header: {
        paddingTop: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: "center",
    },
    content: {
        flex: 1,
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
