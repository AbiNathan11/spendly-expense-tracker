import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../components/Screen";
import { theme } from "../theme/theme";
import { useBudget } from "../state/BudgetStore";
import { formatDateShort, formatMoney } from "../utils/format";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "EnvelopeDetail">;

const ui = {
  bg: "#F9FAFB",
  card: "#FFFFFF",
  border: "#E5E7EB",
  text: "#223447",
  muted: "#6B7280",
  accent: "#223447",
  track: "#E6EDF5",
  danger: "#E44C3C",
  dangerSoft: "#FDE7E5",
  fab: "#223447",
};

function envelopeEmoji(id: string) {
  if (id === "groceries") return "🍔";
  if (id === "transport") return "🚗";
  if (id === "entertainment") return "🎬";
  if (id === "utilities") return "💡";
  return "💰";
}

function txEmoji(title: string) {
  const t = title.toLowerCase();
  if (t.includes("costco") || t.includes("grocery")) return "🛒";
  if (t.includes("trader") || t.includes("market")) return "🥑";
  if (t.includes("coffee")) return "☕";
  if (t.includes("bus") || t.includes("uber") || t.includes("gas")) return "🚌";
  if (t.includes("movie") || t.includes("cinema")) return "🎟️";
  return "💳";
}

export function EnvelopeDetailScreen({ route, navigation }: Props) {
  const { state } = useBudget();
  const envelope = state.envelopes.find((e) => e.id === route.params.envelopeId);

  const transactions = useMemo(
    () => state.transactions.filter((t) => t.envelopeId === route.params.envelopeId),
    [state.transactions, route.params.envelopeId]
  );

  if (!envelope) {
    return (
      <Screen style={{ backgroundColor: ui.bg }}>
        <Text style={{ color: ui.text }}>Envelope not found.</Text>
      </Screen>
    );
  }

  const remaining = envelope.budget - envelope.spent;
  const overspent = remaining < 0;
  const spentPctRaw = envelope.budget === 0 ? 0 : envelope.spent / envelope.budget;
  const spentPct = Math.min(1, Math.max(0, spentPctRaw));
  const pctLabel = `${Math.round(spentPctRaw * 100)}%`;

  return (
    <Screen padded={false} style={styles.screen}>
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color={ui.text} />
            </Pressable>
            <Text style={styles.headerTitle}>{envelope.name}</Text>
            <Pressable
              style={styles.headerBtn}
              onPress={() => navigation.navigate("AddEnvelope", { envelopeId: envelope.id })}
            >
              <Ionicons name="create" size={24} color={ui.text} />
            </Pressable>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <View style={styles.avatarWrap}>
                <Text style={styles.avatarEmoji}>{envelopeEmoji(envelope.id)}</Text>
              </View>
              <Text style={styles.bigTitle}>{envelope.name}</Text>
            </View>

            <View style={styles.kpiRow}>
              <Text style={styles.kpiLabel}>Allocated</Text>
              <Text style={styles.kpiValue}>{formatMoney(envelope.budget)}</Text>
            </View>
            <View style={styles.kpiRow}>
              <Text style={styles.kpiLabel}>Spent</Text>
              <Text style={styles.kpiValue}>{formatMoney(envelope.spent)}</Text>
            </View>
            <View style={styles.kpiRow}>
              <Text style={styles.kpiLabel}>Remaining</Text>
              <Text style={[styles.kpiValue, overspent ? styles.kpiDanger : styles.kpiOk]}>
                {formatMoney(remaining)}
              </Text>
            </View>

            <View style={styles.spentHeader}>
              <Text style={styles.spentTitle}>Spent</Text>
              <Text style={[styles.spentPct, overspent ? styles.kpiDanger : null]}>{pctLabel}</Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${spentPct * 100}%`, backgroundColor: overspent ? ui.danger : ui.accent },
                ]}
              />
            </View>

            {overspent ? (
              <View style={styles.overspentPill}>
                <Ionicons name="warning-outline" size={18} color={ui.danger} />
                <Text style={styles.overspentText}>{`Overspent by ${formatMoney(Math.abs(remaining))}`}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <View style={styles.txList}>
            {transactions.slice(0, 10).map((t) => (
              <View key={t.id} style={styles.txCard}>
                <View style={styles.txLeft}>
                  <View style={styles.txAvatar}>
                    <Text style={styles.txEmoji}>{txEmoji(t.title)}</Text>
                  </View>
                  <View>
                    <Text style={styles.txTitle}>{t.title}</Text>
                    <Text style={styles.txMeta}>{formatDateShort(t.dateISO)}</Text>
                  </View>
                </View>
                <Text style={styles.txAmount}>{`-${formatMoney(t.amount)}`}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <Pressable
          style={styles.fab}
          onPress={() => navigation.navigate("UpdateSpending", { envelopeId: envelope.id })}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </Pressable>
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
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 120,
  },
  header: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
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
    fontSize: 18,
    fontWeight: "900",
  },
  summaryCard: {
    marginTop: 14,
    backgroundColor: ui.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: ui.border,
    padding: 18,
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 28,
  },
  bigTitle: {
    color: ui.text,
    fontSize: 28,
    fontWeight: "900",
  },
  kpiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  kpiLabel: {
    color: ui.muted,
    fontWeight: "700",
  },
  kpiValue: {
    color: ui.text,
    fontWeight: "900",
  },
  kpiOk: {
    color: ui.accent,
  },
  kpiDanger: {
    color: ui.danger,
  },
  spentHeader: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  spentTitle: {
    color: ui.text,
    fontWeight: "900",
    fontSize: 16,
  },
  spentPct: {
    color: ui.text,
    fontWeight: "900",
  },
  progressTrack: {
    marginTop: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor: ui.track,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
  },
  overspentPill: {
    marginTop: 14,
    backgroundColor: ui.dangerSoft,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  overspentText: {
    color: ui.danger,
    fontWeight: "900",
  },
  sectionTitle: {
    marginTop: 26,
    color: ui.text,
    fontSize: 22,
    fontWeight: "900",
  },
  txList: {
    marginTop: 14,
    gap: 12,
  },
  txTitle: {
    color: ui.text,
    fontWeight: "900",
    fontSize: 15,
  },
  txMeta: {
    color: ui.muted,
    marginTop: 2,
    fontWeight: "700",
  },
  txAmount: {
    color: ui.text,
    fontWeight: "900",
    fontSize: 15,
  },
  txCard: {
    backgroundColor: ui.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ui.border,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  txLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  txAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  txEmoji: {
    fontSize: 18,
  },
  fab: {
    position: "absolute",
    right: 18,
    bottom: 24,
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: ui.fab,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
});
