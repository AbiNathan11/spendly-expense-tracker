import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../components/Screen";
import { useBudget } from "../state/BudgetStore";
import { formatMoney } from "../utils/format";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "BillDetail">;

const ui = {
  bg: "#F9FAFB",
  card: "#FFFFFF",
  border: "#E5E7EB",
  text: "#223447",
  muted: "#6B7280",
  warn: "#F59E0B",
  primary: "#223447",
  toggleBg: "#E5E7EB",
};

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatDueLong(iso: string) {
  const d = new Date(iso);
  return `Due on ${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function daysBetween(a: Date, b: Date) {
  const ms = 24 * 60 * 60 * 1000;
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((db - da) / ms);
}

function dueSubtitle(iso: string) {
  const now = new Date();
  const due = new Date(iso);
  const diff = daysBetween(now, due);
  if (diff === 0) return "Due today";
  if (diff > 0) return `Due in ${diff} days`;
  return `Overdue by ${Math.abs(diff)} days`;
}

export function BillDetailScreen({ route, navigation }: Props) {
  const { state, markBillPaid, formatCurrency } = useBudget();
  const bill = state.bills.find((b) => b.id === route.params.billId);
  const envelope = state.envelopes.find((e) => e.id === bill?.envelopeId);

  if (!bill) {
    return (
      <Screen style={{ backgroundColor: ui.bg }}>
        <Text style={{ color: ui.text }}>Bill not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen padded={false} style={styles.screen}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={ui.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Bill Details</Text>
          <Pressable style={styles.headerBtn} onPress={() => navigation.navigate("AddBill", { billId: bill.id })}>
            <Text style={styles.edit}>Edit</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.detailCard}>
            <Text style={styles.vendor}>{bill.title.replace(/\s+Subscription$/i, "")}</Text>
            <Text style={styles.amount}>{formatCurrency(bill.amount)}</Text>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: "#FEF3C7" }]}>
                <Ionicons name="calendar-outline" size={20} color={ui.warn} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>{formatDueLong(bill.dueISO)}</Text>
                <Text style={[styles.infoSub, { color: ui.warn }]}>{dueSubtitle(bill.dueISO)}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: "#DBEAFE" }]}>
                <Ionicons name="folder-outline" size={20} color={ui.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>{envelope ? envelope.name : "Unassigned"}</Text>
              </View>
            </View>
          </View>

          <View style={styles.toggleWrap}>
            <Pressable
              style={[styles.toggleBtn, !bill.paid ? styles.toggleActive : null]}
              onPress={() => markBillPaid(bill.id, false)}
            >
              <Text style={[styles.toggleText, !bill.paid ? styles.toggleTextActive : null]}>Unpaid</Text>
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, bill.paid ? styles.toggleActive : null]}
              onPress={() => markBillPaid(bill.id, true)}
            >
              <Text style={[styles.toggleText, bill.paid ? styles.toggleTextActive : null]}>Paid</Text>
            </Pressable>
          </View>
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
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  headerBtn: {
    width: 64,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    color: ui.text,
    fontWeight: "900",
    fontSize: 18,
  },
  edit: {
    color: ui.primary,
    fontWeight: "900",
    textAlign: "right",
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  detailCard: {
    marginTop: 12,
    backgroundColor: ui.card,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: ui.border,
    padding: 18,
  },
  vendor: {
    textAlign: "center",
    color: ui.muted,
    fontWeight: "800",
    fontSize: 16,
    marginTop: 4,
  },
  amount: {
    textAlign: "center",
    color: ui.text,
    fontWeight: "900",
    fontSize: 54,
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: ui.border,
    marginVertical: 18,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  infoIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTitle: {
    color: ui.text,
    fontWeight: "900",
    fontSize: 16,
  },
  infoSub: {
    marginTop: 2,
    fontWeight: "900",
  },
  toggleWrap: {
    marginTop: 18,
    backgroundColor: ui.toggleBg,
    borderRadius: 22,
    padding: 6,
    flexDirection: "row",
    gap: 6,
  },
  toggleBtn: {
    flex: 1,
    height: 44,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: ui.card,
    borderWidth: 1,
    borderColor: ui.border,
  },
  toggleText: {
    color: ui.muted,
    fontWeight: "900",
  },
  toggleTextActive: {
    color: ui.text,
  },
});
