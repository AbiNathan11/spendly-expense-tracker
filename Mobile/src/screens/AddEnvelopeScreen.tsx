import React, { useState, useEffect } from "react";
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
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "AddEnvelope">;

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

const colors = [
    "#F87171", // Red
    "#FBBF24", // Amber
    "#F6D57A", // Yellow
    "#34D399", // Emerald
    "#9ED9C4", // Teal
    "#60A5FA", // Blue
    "#818CF8", // Indigo
    "#A78BFA", // Violet
    "#F472B6", // Pink
    "#9CA3AF", // Gray
];

export function AddEnvelopeScreen({ navigation, route }: Props) {
    const { addEnvelope, updateEnvelope, state } = useBudget();
    const editId = route.params?.envelopeId;
    const isEditing = !!editId;

    const [name, setName] = useState("");
    const [budget, setBudget] = useState("");
    const [selectedColor, setSelectedColor] = useState(colors[4]);

    useEffect(() => {
        if (editId) {
            const envelope = state.envelopes.find((e) => e.id === editId);
            if (envelope) {
                setName(envelope.name);
                setBudget(envelope.budget.toString());
                setSelectedColor(envelope.color);
            }
        }
    }, [editId, state.envelopes]);

    const handleSave = async () => {
        const amt = Number(budget);

        if (!name.trim()) {
            Alert.alert("Missing Name", "Please enter an envelope name.");
            return;
        }
        if (!Number.isFinite(amt) || amt <= 0) {
            Alert.alert("Invalid Budget", "Please enter a valid budget amount.");
            return;
        }

        try {
            if (isEditing && editId) {
                await updateEnvelope({
                    id: editId,
                    name: name.trim(),
                    budget: amt,
                    color: selectedColor,
                });
            } else {
                await addEnvelope({
                    name: name.trim(),
                    budget: amt,
                    color: selectedColor,
                });
            }
            navigation.goBack();
        } catch (error) {
            Alert.alert("Error", "Failed to save envelope. Please try again.");
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
                    <Text style={styles.headerTitle}>{isEditing ? "Edit Envelope" : "New Envelope"}</Text>
                    <View style={styles.headerBtn} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.form}>
                        {/* Name Field */}
                        <Text style={styles.label}>Envelope Name</Text>
                        <View style={styles.field}>
                            <TextInput
                                value={name}
                                onChangeText={setName}
                                placeholder="e.g. Groceries, Rent, Fun"
                                placeholderTextColor={ui.fieldPh}
                                style={styles.textInput}
                            />
                        </View>

                        {/* Budget Field */}
                        <Text style={styles.label}>Monthly Budget</Text>
                        <View style={styles.field}>
                            <TextInput
                                value={budget}
                                onChangeText={setBudget}
                                placeholder="$0.00"
                                placeholderTextColor={ui.fieldPh}
                                keyboardType="numeric"
                                style={styles.amountInput}
                            />
                        </View>

                        {/* Color Picker */}
                        <Text style={styles.label}>Color Tag</Text>
                        <View style={styles.colorGrid}>
                            {colors.map((c) => (
                                <Pressable
                                    key={c}
                                    style={[
                                        styles.colorItem,
                                        { backgroundColor: c },
                                        selectedColor === c ? styles.colorSelected : null
                                    ]}
                                    onPress={() => setSelectedColor(c)}
                                >
                                    {selectedColor === c && (
                                        <Ionicons name="checkmark" size={16} color="#FFF" />
                                    )}
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    <Pressable style={styles.primaryBtn} onPress={handleSave}>
                        <Text style={styles.primaryText}>{isEditing ? "Update Envelope" : "Create Envelope"}</Text>
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
    colorGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginTop: 4,
    },
    colorItem: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    colorSelected: {
        borderWidth: 3,
        borderColor: "#FFF",
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
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
