import React, { useMemo, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Pressable,
  Switch,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
  Keyboard,
  ScrollView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../components/Screen";
import { useBudget } from "../state/BudgetStore";
import { addExpenseRpc } from "../services/expenseRpcService";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "UpdateSpending">;

const ui = {
  bg: "#F9FAFB",
  card: "#FFFFFF",
  text: "#223447",
  muted: "#6B7280",
  border: "#E5E7EB",
  fieldBg: "#FFFFFF",
  fieldPh: "#9CA3AF",
  accent: "#223447",
  danger: "#EF4444",
};

export function UpdateSpendingScreen({ route, navigation }: Props) {
  const { state, addTransaction, formatCurrency } = useBudget();

  const defaultEnvelopeId = route.params && "envelopeId" in route.params ? route.params.envelopeId : undefined;

  const [envelopeId, setEnvelopeId] = useState(defaultEnvelopeId ?? state.envelopes[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("0.00");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const envelopes = useMemo(() => state.envelopes, [state.envelopes]);
  const selected = envelopes.find((e) => e.id === envelopeId);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleSave = async () => {
    const amt = Number(amount);

    if (!envelopeId) {
      Alert.alert("Select envelope", "Please select an envelope.");
      return;
    }
    if (!title.trim()) {
      Alert.alert("Add description", "Please add a description.");
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      Alert.alert("Invalid amount", "Please enter a valid amount.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await addExpenseRpc({
        envelope_id: envelopeId,
        amount: amt,
        description: title.trim(),
        date: date.toISOString().split('T')[0],
      });

      if (result.success) {
        addTransaction({ envelopeId, title: title.trim(), amount: amt, dateISO: date.toISOString() });

        if (result.is_overspent) {
          Alert.alert(
            "Expense Added",
            `Note: This envelope is now overspent.\nNew Balance: ${result.new_balance}`,
            [{ text: "OK", onPress: () => navigation.goBack() }]
          );
        } else {
          navigation.goBack();
        }
      } else {
        Alert.alert("Error", result.error || "Failed to add expense.");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen padded={false} style={styles.screen}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()} disabled={isLoading}>
            <Ionicons name="close" size={22} color={ui.text} />
          </Pressable>
          <Text style={styles.headerTitle}>New Expense</Text>
          <View style={styles.headerBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            <Text style={styles.label}>Amount</Text>
            <View style={styles.field}>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={ui.fieldPh}
                keyboardType="numeric"
                style={styles.amountInput}
                editable={!isLoading}
              />
            </View>

            <Text style={styles.label}>Description</Text>
            <View style={styles.field}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="What was this for?"
                placeholderTextColor={ui.fieldPh}
                style={styles.textInput}
                editable={!isLoading}
              />
            </View>

            <Text style={styles.label}>Envelope</Text>
            <Pressable
              style={styles.fieldRow}
              onPress={() => {
                Keyboard.dismiss();
                if (!isLoading) {
                  setPickerOpen((v) => !v);
                }
              }}
            >
              <Text style={[styles.selectText, !selected ? styles.selectPlaceholder : null]}>
                {selected ? selected.name : "Select an envelope"}
              </Text>
              <Ionicons name={pickerOpen ? "chevron-up" : "chevron-down"} size={18} color={ui.muted} />
            </Pressable>

            {pickerOpen ? (
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
                    <Text style={styles.pickerText}>{e.name}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <View style={styles.dateSection}>
              <Pressable
                style={styles.dateRow}
                onPress={() => {
                  Keyboard.dismiss();
                  setShowDatePicker((v) => !v);
                }}
              >
                <View style={styles.dateIconWrap}>
                  <Ionicons name="calendar" size={20} color={ui.accent} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.dateLabel}>Date of Expense</Text>
                  <Text style={styles.dateValue}>
                    {date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
                <Ionicons name={showDatePicker ? "chevron-up" : "chevron-forward"} size={18} color={ui.muted} />
              </Pressable>

              {showDatePicker && (
                <View style={[styles.pickerWrapper, { backgroundColor: '#FFFFFF' }]}>
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={onDateChange}
                    maximumDate={new Date()}
                    accentColor={ui.accent}
                    textColor={ui.accent}
                    themeVariant="light"
                  />
                </View>
              )}
            </View>

            <View style={styles.rowCard}>
              <View style={styles.rowLeft}>
                <Ionicons name="repeat" size={18} color={ui.text} />
                <Text style={styles.rowTitle}>Recurring Expense</Text>
              </View>
              <Switch
                value={recurring}
                onValueChange={setRecurring}
                disabled={isLoading}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#0B1220" />
            ) : (
              <Text style={styles.primaryText}>Log Expense</Text>
            )}
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
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: ui.text,
    fontWeight: "900",
    fontSize: 18,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  form: {
    paddingHorizontal: 18,
    paddingTop: 8,
    gap: 12,
  },
  label: {
    color: ui.text,
    fontWeight: "800",
    marginTop: 4,
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
    fontWeight: "900",
    color: ui.text,
  },
  textInput: {
    fontSize: 15,
    fontWeight: "700",
    color: ui.text,
  },
  selectText: {
    fontSize: 15,
    fontWeight: "700",
    color: ui.text,
  },
  selectPlaceholder: {
    color: ui.fieldPh,
  },
  pickerList: {
    borderRadius: 16,
    backgroundColor: ui.card,
    borderWidth: 1,
    borderColor: ui.border,
    overflow: "hidden",
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: ui.border,
    backgroundColor: ui.card,
  },
  pickerText: {
    color: ui.text,
    fontWeight: "800",
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
    gap: 10,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rowTitle: {
    color: ui.text,
    fontWeight: "800",
  },
  dateSection: {
    marginTop: 8,
    backgroundColor: ui.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ui.border,
    overflow: "hidden",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: ui.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  dateLabel: {
    fontSize: 12,
    color: ui.muted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: 16,
    color: ui.accent,
    fontWeight: "800",
    marginTop: 2,
  },
  pickerWrapper: {
    paddingTop: 0,
    paddingBottom: 4,
    paddingHorizontal: 0,
    borderTopWidth: 1,
    borderTopColor: ui.border,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ scale: 0.92 }], // Slight scale down for a more compact feel
    marginVertical: -15, // Negative margin to offset the scale footprint
  },
  footer: {
    paddingHorizontal: 18,
    paddingBottom: 20,
    marginTop: "auto",
  },
  primaryBtn: {
    height: 58,
    borderRadius: 29,
    backgroundColor: ui.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },
});
