import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, Modal, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, RefreshControl } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../components/Screen";
import { useBudget } from "../state/BudgetStore";
import { formatMoney } from "../utils/format";

function getEnvelopeIcon(name: string): keyof typeof Ionicons.glyphMap {
  const lower = name.toLowerCase();
  if (lower.includes("food") || lower.includes("groceries") || lower.includes("eat") || lower.includes("drink")) return "restaurant-outline";
  if (lower.includes("transport") || lower.includes("car") || lower.includes("bus") || lower.includes("fuel") || lower.includes("gas") || lower.includes("uber")) return "car-outline";
  if (lower.includes("entertainment") || lower.includes("movie") || lower.includes("fun") || lower.includes("game") || lower.includes("netflix")) return "film-outline";
  if (lower.includes("utilit") || lower.includes("bill") || lower.includes("light") || lower.includes("water") || lower.includes("wifi") || lower.includes("phone")) return "flash-outline";
  if (lower.includes("rent") || lower.includes("house") || lower.includes("home")) return "home-outline";
  if (lower.includes("shopping") || lower.includes("clothe") || lower.includes("gift")) return "cart-outline";
  if (lower.includes("health") || lower.includes("med") || lower.includes("doctor") || lower.includes("gym")) return "medical-outline";
  if (lower.includes("save") || lower.includes("invest") || lower.includes("bank")) return "wallet-outline";
  if (lower.includes("education") || lower.includes("book") || lower.includes("school") || lower.includes("course")) return "book-outline";
  return "pricetag-outline";
}

import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ui = {
  bg: "#F9FAFB",
  card: "#FFFFFF",
  border: "#E5E7EB",
  text: "#223447",
  muted: "#6B7280",
  accent: "#223447",
  greenSoft: "#D8F6E8",
  yellowSoft: "#FFF3D2",
  redSoft: "#FFE1DC",
  track: "#E6EDF5",
  shadow: "rgba(16,24,40,0.08)",
  primary: "#223447",
};


export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { state, updateDailyLimit, formatCurrency, refreshEnvelopes, refreshBills, refreshTransactions } = useBudget();

  const [modalVisible, setModalVisible] = useState(false);
  const [limitInput, setLimitInput] = useState("");
  const [refreshing, setRefreshing] = React.useState(false);

  // Auto-refresh when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      refreshEnvelopes();
      refreshBills();
      refreshTransactions();
    }, [])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshEnvelopes(), refreshBills(), refreshTransactions()]);
    setRefreshing(false);
  }, []);

  const today = useMemo(() => {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // Show 0 if limit wasn't set today
    const isSetToday = state.lastLimitUpdateDateISO === todayStr;
    const dailyLimit = isSetToday ? state.dailyLimit : 0;

    // Filter transactions to only those from today (robust check)
    const todayTransactions = state.transactions.filter(t => t.dateISO && t.dateISO.startsWith(todayStr));
    const spent = todayTransactions.reduce((sum, t) => sum + t.amount, 0);

    const remaining = dailyLimit - spent;
    const diff = Math.abs(remaining);
    const isOver = dailyLimit > 0 && spent > dailyLimit;
    const pct = dailyLimit === 0 ? 0 : Math.min(1, spent / dailyLimit);

    let color = "#10B981"; // Green
    if (isOver) color = "#EF4444"; // Red
    else if (dailyLimit > 0 && spent >= dailyLimit * 0.9) color = "#F59E0B"; // Yellow

    return { dailyLimit, spent, remaining: Math.max(0, remaining), diff, isOver, pct, color };
  }, [state.transactions, state.dailyLimit, state.lastLimitUpdateDateISO]);

  const cards = useMemo(() => {
    return state.envelopes.map((e) => {
      const left = e.budget - e.spent;
      const overspent = left < 0;
      const pct = e.budget === 0 ? 0 : Math.min(1, e.spent / e.budget);
      const icon = getEnvelopeIcon(e.name);
      const iconBg = e.color + '20';

      let barColor = "#10B981"; // Green
      if (overspent) barColor = "#EF4444";
      else if (e.spent >= e.budget * 0.9) barColor = "#F59E0B";

      return { e, left, overspent, pct, icon, iconBg, barColor };
    });
  }, [state.envelopes]);

  const notificationCount = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return state.bills.filter((b) => {
      if (b.paid) return false;
      const dueStr = new Date(b.dueISO).toISOString().split("T")[0];
      return dueStr <= todayStr;
    }).length;
  }, [state.bills]);

  const isLocked = useMemo(() => {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return state.lastLimitUpdateDateISO === todayStr;
  }, [state.lastLimitUpdateDateISO]);

  const handleOpenLimitModal = () => {
    if (isLocked) {
      Alert.alert("Locked", "You've already set your limit for today! You can change it again tomorrow.");
      return;
    }
    setLimitInput(state.dailyLimit.toString());
    setModalVisible(true);
  };

  const handleSaveLimit = async () => {
    const val = parseFloat(limitInput);
    if (!isNaN(val) && val > 0) {
      try {
        await updateDailyLimit(val);
        setModalVisible(false);
      } catch (error: any) {
        Alert.alert("Locked", error.message || "Daily limit can only be set once per day.");
      }
    } else {
      Alert.alert("Invalid Input", "Please enter a valid positive number.");
    }
  };

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
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              style={styles.headerBtn}
              onPress={() => {
                if (notificationCount > 0) {
                  // @ts-ignore
                  navigation.navigate("Notifications");
                }
              }}
            >
              <View>
                <Ionicons name="notifications-outline" size={22} color={ui.text} />
                {notificationCount > 0 && <View style={styles.badge} />}
              </View>
            </Pressable>
            <Text style={styles.headerTitle}>Spendly</Text>
            <Pressable
              style={styles.headerBtn}
              onPress={() => navigation.navigate("ProfileSettings")}
            >
              <Ionicons name="person-outline" size={22} color={ui.text} />
            </Pressable>
          </View>

          <Text style={styles.welcomeText}>Welcome, {state.user.name}</Text>

          <Text style={styles.h1}>Today's Spending</Text>

          <Pressable onPress={handleOpenLimitModal}>
            <View style={styles.todayCard}>
              <View style={styles.todayHeader}>
                <View style={styles.todayHeaderLeft}>
                  <Text style={styles.todayLabel}>Daily Limit</Text>
                  <Text style={styles.todayLimitValue}>{formatCurrency(today.dailyLimit)}</Text>
                </View>
                <View style={styles.editIconCircle}>
                  <Ionicons name={isLocked ? "lock-closed" : "pencil"} size={14} color={ui.accent} />
                </View>
              </View>

              <View style={styles.todayMain}>
                <View style={styles.todayRow}>
                  <Text style={styles.spentLabel}>Spent Today</Text>
                  <Text style={styles.spentValue}>{formatCurrency(today.spent)}</Text>
                </View>

                <View style={styles.todayTrack}>
                  <View style={[styles.todayFill, { width: `${today.pct * 100}%`, backgroundColor: today.color }]} />
                </View>

                <View style={styles.todayRow}>
                  <Text style={styles.remainingLabel}>
                    {today.isOver ? "Over Limit" : "Remaining"}
                  </Text>
                  <Text style={[styles.remainingValue, { color: today.isOver ? "#EF4444" : "#10B981" }]}>
                    {formatCurrency(today.remaining)}
                  </Text>
                </View>
              </View>

              {today.isOver && (
                <View style={styles.warnBox}>
                  <Ionicons name="warning-outline" size={18} color="#B91C1C" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.warnTitle}>Budget Exceeded!</Text>
                    <Text style={styles.warnBody}>{`You've spent ${formatCurrency(today.diff)} more than your daily limit.`}</Text>
                  </View>
                </View>
              )}
            </View>
          </Pressable>

          <Text style={styles.h2}>Your Envelopes</Text>

          {cards.length === 0 ? (
            <View style={styles.emptyEnvelopes}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="mail-open-outline" size={28} color={ui.muted} />
              </View>
              <Text style={styles.emptyTitle}>No Envelopes Yet</Text>
              <Text style={styles.emptySubtitle}>Start by creating an envelope to track your spending categories.</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {cards.map(({ e, left, overspent, pct, icon, iconBg, barColor }, index) => (
                <Pressable
                  key={`home-env-${e.id || index}`}
                  style={styles.envelopeCard}
                  onPress={() => navigation.navigate("EnvelopeDetail", { envelopeId: e.id })}
                >
                  <View style={styles.envelopeTop}>
                    <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
                      <Ionicons name={icon as any} size={18} color={e.color} />
                    </View>
                    {overspent ? (
                      <Ionicons name="lock-closed-outline" size={16} color="#F87171" />
                    ) : null}
                  </View>

                  <Text style={styles.envelopeName}>{e.name}</Text>
                  {overspent ? (
                    <Text style={[styles.envelopeMeta, { color: "#F87171" }]}>{`${formatCurrency(
                      Math.abs(left)
                    )} overspent`}</Text>
                  ) : (
                    <Text style={styles.envelopeMeta}>{`${formatCurrency(left)} left of ${formatCurrency(e.budget)}`}</Text>
                  )}

                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: barColor }]} />
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Daily Limit Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Daily Limit</Text>
            <Text style={styles.modalSubtitle}>How much do you want to spend today?</Text>

            <TextInput
              style={styles.modalInput}
              value={limitInput}
              onChangeText={setLimitInput}
              keyboardType="numeric"
              placeholder="e.g. 200"
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSave]}
                onPress={handleSaveLimit}
              >
                <Text style={styles.modalBtnTextSave}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  h1: {
    marginTop: 18,
    color: ui.text,
    fontSize: 28,
    fontWeight: "900",
  },
  todayCard: {
    marginTop: 14,
    backgroundColor: ui.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ui.border,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  todayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: ui.border,
    marginBottom: 16,
  },
  todayHeaderLeft: {
    gap: 2,
  },
  todayLabel: {
    color: ui.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  todayLimitValue: {
    color: ui.text,
    fontSize: 22,
    fontWeight: "900",
  },
  editIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ui.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  todayMain: {
    gap: 12,
  },
  todayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  spentLabel: {
    color: ui.text,
    fontWeight: "700",
    fontSize: 15,
  },
  spentValue: {
    color: ui.text,
    fontWeight: "800",
    fontSize: 15,
  },
  remainingLabel: {
    color: ui.muted,
    fontWeight: "700",
    fontSize: 13,
  },
  remainingValue: {
    fontWeight: "800",
    fontSize: 15,
  },
  todayTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: ui.track,
    overflow: "hidden",
  },
  todayFill: {
    height: "100%",
    borderRadius: 4,
  },
  h2: {
    marginTop: 26,
    color: ui.text,
    fontSize: 18,
    fontWeight: "900",
  },
  grid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },
  envelopeCard: {
    width: "48%",
    backgroundColor: ui.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ui.border,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  envelopeTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  envelopeName: {
    marginTop: 10,
    color: ui.text,
    fontWeight: "900",
    fontSize: 15,
  },
  envelopeMeta: {
    marginTop: 6,
    color: ui.muted,
    fontWeight: "700",
  },
  barTrack: {
    marginTop: 12,
    height: 6,
    borderRadius: 3,
    backgroundColor: ui.track,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: ui.card,
  },
  welcomeText: {
    marginTop: 12,
    color: ui.muted,
    fontSize: 16,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: ui.text,
    textAlign: "center",
  },
  modalSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: ui.muted,
    textAlign: "center",
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    color: ui.text,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnCancel: {
    backgroundColor: "#F3F4F6",
  },
  modalBtnSave: {
    backgroundColor: ui.primary,
  },
  modalBtnTextCancel: {
    color: "#4B5563",
    fontWeight: "700",
    fontSize: 16,
  },
  modalBtnTextSave: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  warnBox: {
    marginTop: 14,
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  warnTitle: {
    color: "#B91C1C",
    fontWeight: "900",
  },
  warnBody: {
    color: "#7F1D1D",
    marginTop: 2,
    fontWeight: "600",
    lineHeight: 18,
  },
  emptyEnvelopes: {
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: ui.border,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: ui.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: ui.muted,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "600",
    marginBottom: 0,
    paddingHorizontal: 20,
  },
});
