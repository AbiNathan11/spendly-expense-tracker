import React from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../components/Screen";
import { useBudget } from "../state/BudgetStore";
import { formatMoney } from "../utils/format";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ui = {
  bg: "#F9FAFB",
  card: "#FFFFFF",
  border: "#E5E7EB",
  text: "#223447",
  muted: "#6B7280",
  accent: "#223447",
  track: "#E6EDF5",
  warnBg: "#FEF2F2",
  warnText: "#B91C1C",
  fab: "#223447",
};

function envelopeEmoji(id: string) {
  if (id === "groceries") return "🍔";
  if (id === "transport") return "🚗";
  if (id === "entertainment") return "🎬";
  if (id === "utilities") return "💡";
  return "💰";
}

export function EnvelopesScreen() {
  const navigation = useNavigation<Nav>();
  const { state, formatCurrency, refreshEnvelopes } = useBudget();
  const [refreshing, setRefreshing] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      refreshEnvelopes();
    }, [])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshEnvelopes();
    setRefreshing(false);
  }, []);

  return (
    <Screen padded={false} style={styles.screen}>
      <View style={styles.page}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.header}>
            <View style={{ width: 40 }} />
            <Text style={styles.headerTitle}>My Envelopes</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.list}>
            {state.envelopes.map((e) => {
              const pct = e.budget === 0 ? 0 : e.spent / e.budget;
              const pctLabel = `${Math.round(pct * 100)}%`;
              const left = e.budget - e.spent;
              const overspent = left < 0;
              let barColor = "#10B981"; // Green
              if (e.spent > e.budget) barColor = "#EF4444"; // Red
              else if (e.spent >= e.budget * 0.9) barColor = "#F59E0B"; // Yellow
              const statusText = overspent ? `${formatCurrency(Math.abs(left))} over` : `${formatCurrency(left)} left`;

              return (
                <Pressable
                  key={e.id}
                  style={styles.card}
                  onPress={() => navigation.navigate("EnvelopeDetail", { envelopeId: e.id })}
                >
                  <View style={styles.cardTop}>
                    <View style={[styles.avatarWrap, { backgroundColor: e.color + '20' }]}>
                      <Text style={[styles.avatarEmoji, { color: e.color }]}>{e.name.substring(0, 1).toUpperCase()}</Text>
                    </View>

                    <View style={styles.cardMid}>
                      <Text style={styles.name}>{e.name}</Text>
                      <Text style={[styles.status, overspent ? styles.statusOver : null]}>{statusText}</Text>
                    </View>

                    <Text style={[styles.pct, overspent ? styles.pctOver : null]}>{pctLabel}</Text>
                  </View>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(1, Math.max(0, pct)) * 100}%`, backgroundColor: barColor },
                      ]}
                    />
                  </View>

                  <Text style={styles.spentLine}>{`${formatCurrency(e.spent)} of ${formatCurrency(e.budget)} spent`}</Text>

                  {overspent ? (
                    <View style={styles.warnBox}>
                      <Ionicons name="warning-outline" size={18} color={ui.warnText} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.warnTitle}>A little over on {e.name}!</Text>
                        <Text style={styles.warnBody}>Let's try to get back on track next week.</Text>
                      </View>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {state.envelopes.length === 0 && (
            <View style={styles.createBox}>
              <View style={styles.createIcon}>
                <Ionicons name="card-outline" size={26} color={ui.fab} />
                <View style={styles.createIconPlus}>
                  <Ionicons name="add" size={14} color={ui.fab} />
                </View>
              </View>
              <Text style={styles.createTitle}>Create your first envelope</Text>
              <Text style={styles.createBody}>
                Start budgeting by adding a new category to{"\n"}track your spending.
              </Text>
              <Pressable style={styles.createBtn} onPress={() => navigation.navigate("AddEnvelope")}>
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.createBtnText}>Add Envelope</Text>
              </Pressable>
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
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 120,
  },
  header: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  headerTitle: {
    color: ui.text,
    fontSize: 18,
    fontWeight: "900",
  },
  list: {
    marginTop: 10,
    gap: 16,
  },
  card: {
    backgroundColor: ui.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: ui.border,
    padding: 16,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 20,
  },
  cardMid: {
    flex: 1,
  },
  name: {
    color: ui.text,
    fontSize: 16,
    fontWeight: "900",
  },
  status: {
    marginTop: 4,
    color: ui.muted,
    fontWeight: "800",
  },
  statusOver: {
    color: "#D80000",
  },
  pct: {
    color: ui.text,
    fontWeight: "900",
  },
  pctOver: {
    color: "#D80000",
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: ui.track,
    overflow: "hidden",
    marginTop: 14,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  spentLine: {
    marginTop: 10,
    textAlign: "right",
    color: ui.muted,
    fontWeight: "700",
  },
  warnBox: {
    marginTop: 14,
    backgroundColor: ui.warnBg,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  warnTitle: {
    color: ui.warnText,
    fontWeight: "900",
  },
  warnBody: {
    color: "#7F1D1D",
    marginTop: 2,
    fontWeight: "600",
    lineHeight: 18,
  },
  createBox: {
    marginTop: 18,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#C9D2E1",
    backgroundColor: "#F8FAFC",
    padding: 22,
    alignItems: "center",
  },
  createIcon: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  createIconPlus: {
    position: "absolute",
    right: 14,
    bottom: 12,
  },
  createTitle: {
    marginTop: 14,
    color: ui.text,
    fontSize: 16,
    fontWeight: "900",
  },
  createBody: {
    marginTop: 8,
    color: ui.muted,
    textAlign: "center",
    lineHeight: 18,
    fontWeight: "600",
  },
  createBtn: {
    marginTop: 16,
    height: 44,
    borderRadius: 22,
    backgroundColor: ui.fab,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  createBtnText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
});
