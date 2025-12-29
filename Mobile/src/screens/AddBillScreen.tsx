import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../components/Screen";
import { useBudget } from "../state/BudgetStore";
import { billService } from "../services/billService";
import { supabase } from "../config/supabase";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "AddBill">;

const ui = {
    bg: "#F9FAFB",
    card: "#FFFFFF",
    text: "#223447",
    muted: "#6B7280",
    border: "#E5E7EB",
    fieldBg: "#FFFFFF",
    fieldPh: "#9CA3AF",
    accent: "#223447",
    primaryText: "#FFFFFF",
};

const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

function formatDisplayDate(iso: string) {
    const d = new Date(iso);
    return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function AddBillScreen({ route, navigation }: Props) {
    const { state, addBill, updateBill } = useBudget();

    // Check if we are editing an existing bill
    const billId = route.params?.billId;
    const editingBill = useMemo(() => state.bills.find(b => b.id === billId), [state.bills, billId]);
    const isEditing = !!editingBill;

    // Helper function to format date as YYYY-MM-DD without timezone issues
    const formatDateForStorage = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const defaultDate = route.params?.date
        ? formatDateForStorage(new Date(route.params.date))
        : (editingBill ? editingBill.dueISO : formatDateForStorage(new Date()));

    const [envelopeId, setEnvelopeId] = useState(editingBill?.envelopeId ?? state.envelopes[0]?.id ?? "");
    const [title, setTitle] = useState(editingBill?.title ?? "");
    const [amount, setAmount] = useState(editingBill ? String(editingBill.amount) : "");
    const [pickerOpen, setPickerOpen] = useState(false);
    const [dueDate, setDueDate] = useState(defaultDate);

    const envelopes = useMemo(() => state.envelopes, [state.envelopes]);
    const selectedEnvelope = envelopes.find((e) => e.id === envelopeId);

    const handleSave = async () => {
        const amt = Number(amount);

        if (!title.trim()) {
            Alert.alert("Missing Title", "Please enter a bill title.");
            return;
        }
        if (!Number.isFinite(amt) || amt <= 0) {
            Alert.alert("Invalid Amount", "Please enter a valid amount.");
            return;
        }
        if (!envelopeId) {
            Alert.alert("Select Envelope", "Please select an envelope for this bill.");
            return;
        }

        // Check authentication first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (!session || sessionError) {
            Alert.alert(
                "Authentication Required", 
                "Please log in first before adding bills.",
                [
                    {
                        text: "Cancel",
                        style: "cancel"
                    },
                    {
                        text: "Go to Login",
                        onPress: () => navigation.navigate("Login" as any)
                    }
                ]
            );
            return;
        }

        try {
            if (isEditing && billId) {
                await updateBill({
                    id: billId,
                    title: title.trim(),
                    amount: amt,
                    dueISO: dueDate,
                    envelopeId: envelopeId,
                });
            } else {
                await addBill({
                    title: title.trim(),
                    amount: amt,
                    dueISO: dueDate,
                    envelopeId: envelopeId,
                });
            }

            navigation.goBack();
        } catch (error) {
            Alert.alert("Error", `Failed to save bill: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    };

    return (
        <Screen padded={false} style={styles.screen}>
            <View style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={24} color={ui.text} />
                    </Pressable>
                    <Text style={styles.headerTitle}>{isEditing ? "Edit Bill" : "Add New Bill"}</Text>
                    <View style={styles.headerBtn} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.form}>
                        {/* Amount Field */}
                        <Text style={styles.label}>Bill Amount</Text>
                        <View style={styles.field}>
                            <TextInput
                                value={amount}
                                onChangeText={setAmount}
                                placeholder="$0.00"
                                placeholderTextColor={ui.fieldPh}
                                keyboardType="numeric"
                                style={styles.amountInput}
                            />
                        </View>

                        {/* Title Field */}
                        <Text style={styles.label}>Bill Name</Text>
                        <View style={styles.field}>
                            <TextInput
                                value={title}
                                onChangeText={setTitle}
                                placeholder="e.g. Netflix, Rent, Electricity"
                                placeholderTextColor={ui.fieldPh}
                                style={styles.textInput}
                            />
                        </View>

                        {/* Date Display */}
                        <Text style={styles.label}>Due Date</Text>
                        <View style={styles.rowCard}>
                            <View style={styles.rowLeft}>
                                <Ionicons name="calendar-outline" size={20} color={ui.text} />
                                <Text style={styles.rowValue}>{formatDisplayDate(dueDate)}</Text>
                            </View>
                            {/* Future: Add DatePicker here */}
                        </View>

                        {/* Envelope Picker */}
                        <Text style={styles.label}>Assign to Envelope</Text>
                        <Pressable
                            style={styles.fieldRow}
                            onPress={() => setPickerOpen((v) => !v)}
                        >
                            <Text style={[styles.selectText, !selectedEnvelope ? styles.selectPlaceholder : null]}>
                                {selectedEnvelope ? selectedEnvelope.name : "Select an envelope"}
                            </Text>
                            <Ionicons name={pickerOpen ? "chevron-up" : "chevron-down"} size={20} color={ui.muted} />
                        </Pressable>

                        {pickerOpen && (
                            <View style={styles.pickerList}>
                                {envelopes.map((e) => (
                                    <Pressable
                                        key={e.id}
                                        style={styles.pickerItem}
                                        onPress={() => {
                                            setEnvelopeId(e.id);
                                            setPickerOpen(false);
                                        }}
                                    >
                                        <View style={[styles.dot, { backgroundColor: e.color }]} />
                                        <Text style={styles.pickerText}>{e.name}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    <Pressable style={styles.primaryBtn} onPress={handleSave}>
                        <Text style={styles.primaryText}>{isEditing ? "Update Bill" : "Save Bill"}</Text>
                    </Pressable>
                </View>
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
        // Removed borders and background as requested
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
    form: {
        gap: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: "700",
        color: ui.muted,
        marginBottom: -8,
        marginLeft: 4,
    },
    field: {
        height: 56,
        borderRadius: 16,
        backgroundColor: ui.fieldBg,
        borderWidth: 1,
        borderColor: ui.border,
        paddingHorizontal: 16,
        justifyContent: "center",
    },
    fieldRow: {
        height: 56,
        borderRadius: 16,
        backgroundColor: ui.fieldBg,
        borderWidth: 1,
        borderColor: ui.border,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    amountInput: {
        fontSize: 24,
        fontWeight: "800",
        color: ui.text,
    },
    textInput: {
        fontSize: 16,
        fontWeight: "600",
        color: ui.text,
    },
    selectText: {
        fontSize: 16,
        fontWeight: "600",
        color: ui.text,
    },
    selectPlaceholder: {
        color: ui.fieldPh,
    },
    rowCard: {
        height: 56,
        borderRadius: 16,
        backgroundColor: ui.card,
        borderWidth: 1,
        borderColor: ui.border,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    rowLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    rowValue: {
        fontSize: 16,
        fontWeight: "700",
        color: ui.text,
    },
    pickerList: {
        backgroundColor: ui.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: ui.border,
        overflow: "hidden",
        marginTop: -8,
    },
    pickerItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: ui.border,
        gap: 12,
    },
    pickerText: {
        fontSize: 16,
        fontWeight: "600",
        color: ui.text,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    footer: {
        padding: 16,
        backgroundColor: ui.bg,
        borderTopWidth: 1,
        borderTopColor: ui.border,
    },
    primaryBtn: {
        height: 56,
        backgroundColor: ui.accent,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    primaryText: {
        color: ui.primaryText,
        fontSize: 18,
        fontWeight: "800",
    },
});
