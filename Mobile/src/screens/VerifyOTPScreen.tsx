import React, { useState, useRef, useEffect } from "react";
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
type VerifyOTPRouteProp = RouteProp<RootStackParamList, "VerifyOTP">;

export function VerifyOTPScreen() {
    const navigation = useNavigation<Nav>();
    const route = useRoute<VerifyOTPRouteProp>();
    const { email } = route.params;

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const inputRefs = useRef<Array<TextInput | null>>([]);

    // Focus first input on mount
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleOtpChange = (value: string, index: number) => {
        // Only allow numbers
        if (value && !/^\d+$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        // Handle backspace
        if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const otpCode = otp.join("");

        if (otpCode.length !== 6) {
            Alert.alert("Error", "Please enter the complete 6-digit OTP.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/verify-otp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    otp: otpCode,
                }),
            });

            const data = await response.json();

            if (data.success) {
                Alert.alert("Success", "OTP verified successfully!", [
                    {
                        text: "Continue",
                        onPress: () => navigation.navigate("ResetPassword", { email }),
                    },
                ]);
            } else {
                Alert.alert("Error", data.error || "Invalid OTP. Please try again.");
                // Clear OTP on error
                setOtp(["", "", "", "", "", ""]);
                inputRefs.current[0]?.focus();
            }
        } catch (err) {
            Alert.alert("Error", "Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
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
                Alert.alert("Success", "A new OTP has been sent to your email.");
                // Clear current OTP
                setOtp(["", "", "", "", "", ""]);
                inputRefs.current[0]?.focus();
            } else {
                Alert.alert("Error", data.error || "Failed to resend OTP.");
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
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="mail-outline" size={40} color="#F59E0B" />
                    </View>
                </View>

                <Text style={styles.title}>Verify OTP</Text>
                <Text style={styles.subtitle}>
                    We've sent a 6-digit code to{"\n"}
                    <Text style={styles.email}>{email}</Text>
                </Text>

                <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => { inputRefs.current[index] = ref; }}
                            style={[
                                styles.otpInput,
                                digit ? styles.otpInputFilled : null,
                            ]}
                            value={digit}
                            onChangeText={(value) => handleOtpChange(value, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            keyboardType="number-pad"
                            maxLength={1}
                            selectTextOnFocus
                        />
                    ))}
                </View>

                <Pressable
                    style={[styles.btn, loading && styles.btnDisabled]}
                    onPress={handleVerify}
                    disabled={loading}
                >
                    <Text style={styles.btnText}>
                        {loading ? "Verifying..." : "Verify OTP"}
                    </Text>
                </Pressable>

                <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>Didn't receive the code? </Text>
                    <Pressable onPress={handleResendOTP} disabled={loading}>
                        <Text style={styles.resendLink}>Resend OTP</Text>
                    </Pressable>
                </View>
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
        alignItems: "center",
    },
    iconContainer: {
        marginBottom: theme.spacing.xl,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#FEF3C7",
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 15,
        color: theme.colors.muted,
        lineHeight: 22,
        marginBottom: theme.spacing.xl,
        textAlign: "center",
    },
    email: {
        fontWeight: "700",
        color: theme.colors.text,
    },
    otpContainer: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 12,
        marginBottom: theme.spacing.xl,
        width: "100%",
    },
    otpInput: {
        width: 50,
        height: 56,
        borderWidth: 2,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        fontSize: 24,
        fontWeight: "700",
        color: theme.colors.text,
        textAlign: "center",
        backgroundColor: theme.colors.surface,
    },
    otpInputFilled: {
        borderColor: "#F59E0B",
        backgroundColor: "#FFFBEB",
    },
    btn: {
        width: "100%",
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
    resendContainer: {
        flexDirection: "row",
        marginTop: theme.spacing.lg,
        alignItems: "center",
    },
    resendText: {
        fontSize: 14,
        color: theme.colors.muted,
    },
    resendLink: {
        fontSize: 14,
        fontWeight: "700",
        color: "#F59E0B",
    },
});
