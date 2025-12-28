import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../components/Screen";
import { useBudget } from "../state/BudgetStore";
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
};

export function UpdateSpendingScreen({ route, navigation }: Props) {
  const { state, addTransaction } = useBudget();

  const defaultEnvelopeId = route.params && "envelopeId" in route.params ? route.params.envelopeId : undefined;

  const [envelopeId, setEnvelopeId] = useState(defaultEnvelopeId ?? state.envelopes[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("0.00");
  const [recurring, setRecurring] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const envelopes = useMemo(() => state.envelopes, [state.envelopes]);
  const selected = envelopes.find((e) => e.id === envelopeId);

  return (
    <Screen padded={false} style={styles.screen}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={22} color={ui.text} />
          </Pressable>
          <Text style={styles.headerTitle}>New Expense</Text>
          <View style={styles.headerBtn} />
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Amount</Text>
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

          <Text style={styles.label}>Description</Text>
          <View style={styles.field}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="What was this for?"
              placeholderTextColor={ui.fieldPh}
              style={styles.textInput}
            />
          </View>

          <Text style={styles.label}>Envelope</Text>
          <Pressable
            style={styles.fieldRow}
            onPress={() => setPickerOpen((v) => !v)}
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

          <View style={styles.rowCard}>
            <View style={styles.rowLeft}>
              <Ionicons name="calendar-outline" size={18} color={ui.text} />
              <Text style={styles.rowTitle}>Date</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>Today</Text>
              <Ionicons name="chevron-forward" size={18} color={ui.muted} />
            </View>
          </View>

          <View style={styles.rowCard}>
            <View style={styles.rowLeft}>
              <Ionicons name="repeat" size={18} color={ui.text} />
              <Text style={styles.rowTitle}>Recurring Expense</Text>
            </View>
            <Switch value={recurring} onValueChange={setRecurring} />
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={styles.primaryBtn}
            onPress={async () => {
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

              try {
                await addTransaction({ envelopeId, title: title.trim(), amount: amt });
                navigation.goBack();
              } catch (error) {
                Alert.alert("Error", "Failed to log expense. Please try again.");
              }
            }}
          >
            <Text style={styles.primaryText}>Log Expense</Text>
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
  rowValue: {
    color: ui.text,
    fontWeight: "800",
  },
  footer: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    marginTop: "auto",
  },
  primaryBtn: {
    height: 58,
    borderRadius: 29,
    backgroundColor: ui.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: "#0B1220",
    fontWeight: "900",
    fontSize: 16,
  },
});
