import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../components/Screen";
import { useBudget } from "../state/BudgetStore";
import type { RootStackParamList } from "../navigation/types";
import { formatMoney } from "../utils/format";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ui = {
    bg: "#F9FAFB",
    card: "#FFFFFF",
    text: "#223447",
    muted: "#6B7280",
    border: "#E5E7EB",
    accent: "#223447",
    danger: "#EF4444",
    warn: "#F59E0B",
};

export function NotificationsScreen() {
    const navigation = useNavigation<Nav>();
    const { state } = useBudget();

    const notifications = useMemo(() => {
        const todayStr = new Date().toISOString().split("T")[0];

        return state.bills
            .filter((b) => {
                if (b.paid) return false;
                const dueStr = new Date(b.dueISO).toISOString().split("T")[0];
                return dueStr <= todayStr;
            })
            .map(b => {
                const due = new Date(b.dueISO);
                const now = new Date();
                due.setHours(0, 0, 0, 0);
                now.setHours(0, 0, 0, 0);

                const diffTime = due.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let message = "";
                let type: "due" | "overdue" = "due";

                if (diffDays === 0) {
                    message = "is due today";
                } else if (diffDays < 0) {
                    message = `is overdue by ${Math.abs(diffDays)} days`;
                    type = "overdue";
                }

                return { ...b, message, type };
            });
    }, [state.bills]);

    return (
        <Screen padded={false} style={styles.screen}>
            <View style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={24} color={ui.text} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    <View style={styles.headerBtn} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {notifications.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No new notifications.</Text>
                        </View>
                    ) : (
                        <View style={styles.list}>
                            {notifications.map((item) => (
                                <Pressable
                                    key={item.id}
                                    style={styles.textRow}
                                    onPress={() => navigation.navigate("BillDetail", { billId: item.id })}
                                >
                                    <Text style={styles.messageText}>
                                        <Text style={{ fontWeight: '800' }}>{item.title}</Text> {item.message} <Text style={{ fontWeight: '700' }}>({formatMoney(item.amount)})</Text>
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    )}
                </ScrollView>
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: {
        backgroundColor: ui.bg,
    },
    page: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: ui.border,
        backgroundColor: ui.bg, // Transparent/Matching bg
    },
    headerBtn: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: ui.text,
    },
    scrollContent: {
        padding: 16,
    },
    list: {
        gap: 16,
    },
    textRow: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: ui.border,
    },
    messageText: {
        fontSize: 16,
        color: ui.text,
        lineHeight: 24,
    },
    emptyState: {
        marginTop: 40,
        alignItems: "center",
    },
    emptyText: {
        fontSize: 16,
        color: ui.muted,
    },
});
