import React, { useMemo, useState, useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../components/Screen";
import { useBudget } from "../state/BudgetStore";
import { formatMoney } from "../utils/format";
import { billService } from "../services/billService";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ui = {
  bg: "#F9FAFB",
  card: "#FFFFFF",
  border: "#E5E7EB",
  text: "#223447",
  muted: "#6B7280",
  chip: "#E5E7EB",
  chipActive: "#223447",
  chipActiveText: "#FFFFFF",
  dotDue: "#F59E0B", // Yellow for today/upcoming
  dotOverdue: "#EF4444", // Red for passed due date
  dotPaid: "#22C55E",
  duePillBg: "#FFF3D2",
  duePillText: "#B45309",
  paidPillBg: "#DCFCE7",
  paidPillText: "#166534",
  fab: "#223447",
  accent: "#223447",
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

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toDateOnly(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function billIcon(title: string): { bg: string; icon: keyof typeof Ionicons.glyphMap; color: string } {
  const t = title.toLowerCase();
  if (t.includes("netflix")) return { bg: "#000000", icon: "tv" as any, color: "#E50914" };
  if (t.includes("spotify")) return { bg: "#22C55E", icon: "logo-spotify" as any, color: "#0B1220" };
  return { bg: "#EAF2FF", icon: "card-outline", color: ui.text };
}

function formatMonthTitle(year: number, monthIndex: number) {
  return `${monthNames[monthIndex]} ${year}`;
}

function formatShortMonthDay(d: Date) {
  return `${monthNames[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

export function BillsScreen() {
  const navigation = useNavigation<Nav>();
  const { state, markBillPaid, refreshBills, formatCurrency } = useBudget();

  const today = useMemo(() => toDateOnly(new Date()), []);
  const [cursor, setCursor] = useState(() => ({ year: today.getFullYear(), month: today.getMonth() }));
  const [selected, setSelected] = useState<Date>(today);
  const [filter, setFilter] = useState<"all" | "due" | "paid">("all");

  // Refresh bills when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshBills();
    }, [refreshBills])
  );

  const billsInMonth = useMemo(() => {
    return state.bills
      .map((b) => ({ ...b, due: toDateOnly(new Date(b.dueISO)) }))
      .filter((b) => b.due.getFullYear() === cursor.year && b.due.getMonth() === cursor.month);
  }, [cursor.month, cursor.year, state.bills]);

  const selectedBills = useMemo(() => {
    const list = billsInMonth.filter((b) => sameDay(b.due, selected));
    if (filter === "paid") return list.filter((b) => b.paid);
    if (filter === "due") return list.filter((b) => !b.paid);
    return list;
  }, [billsInMonth, filter, selected]);

  const nextMonth = () => {
    setCursor((c) => {
      if (c.month === 11) return { year: c.year + 1, month: 0 };
      return { ...c, month: c.month + 1 };
    });
  };

  const prevMonth = () => {
    setCursor((c) => {
      if (c.month === 0) return { year: c.year - 1, month: 11 };
      return { ...c, month: c.month - 1 };
    });
  };

  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const firstDay = new Date(cursor.year, cursor.month, 1).getDay();

  const calendarDays = [];
  // padding
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(cursor.year, cursor.month, i));
  }

  return (
    <Screen padded={false} style={styles.screen}>
      <View style={styles.page}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.monthHeader}>
            <Pressable style={styles.monthBtn} onPress={prevMonth}>
              <Ionicons name="chevron-back" size={24} color={ui.text} />
            </Pressable>
            <Text style={styles.monthTitle}>{formatMonthTitle(cursor.year, cursor.month)}</Text>
            <Pressable style={styles.monthBtn} onPress={nextMonth}>
              <Ionicons name="chevron-forward" size={24} color={ui.text} />
            </Pressable>
          </View>

          <View style={styles.weekdays}>
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <Text key={i} style={styles.weekday}>{d}</Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarDays.map((d, i) => {
              if (!d) return <View key={`p-${i}`} style={styles.dayCell} />;
              const isSelected = sameDay(d, selected);
              const isToday = sameDay(d, today);
              const dayBills = state.bills.filter((b) => sameDay(new Date(b.dueISO), d));
              const hasOverdue = dayBills.some((b) => !b.paid && new Date(b.dueISO) < today);
              const hasUpcoming = dayBills.some((b) => !b.paid && !sameDay(new Date(b.dueISO), today) && new Date(b.dueISO) >= today);
              const hasToday = dayBills.some((b) => !b.paid && sameDay(new Date(b.dueISO), today));
              const hasPaid = dayBills.length > 0 && dayBills.every((b) => b.paid);

              return (
                <Pressable
                  key={d.toISOString()}
                  style={styles.dayCell}
                  onPress={() => setSelected(d)}
                >
                  <View style={[
                    styles.dayCircle,
                    isSelected ? styles.dayCircleSelected : null,
                    isToday && !isSelected ? { backgroundColor: "#F3F4F6" } : null
                  ]}>
                    <Text style={[
                      styles.dayText,
                      isSelected ? styles.dayTextSelected : null,
                      isToday && !isSelected ? { color: ui.accent } : null
                    ]}>
                      {d.getDate()}
                    </Text>
                    <View style={styles.dots}>
                      {hasOverdue && <View style={[styles.dot, { backgroundColor: ui.dotOverdue }]} />}
                      {(hasUpcoming || hasToday) && !hasOverdue && <View style={[styles.dot, { backgroundColor: ui.dotDue }]} />}
                      {hasPaid && <View style={[styles.dot, { backgroundColor: ui.dotPaid }]} />}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>
              {sameDay(selected, today) ? "Today's Bills" : `Bills for ${formatShortMonthDay(selected)}`}
            </Text>

            <View style={styles.chips}>
              <Pressable
                onPress={() => setFilter("all")}
                style={[styles.chip, filter === "all" ? styles.chipActive : null]}
              >
                <Text style={[styles.chipText, filter === "all" ? styles.chipTextActive : null]}>All</Text>
              </Pressable>
              <Pressable
                onPress={() => setFilter("due")}
                style={[styles.chip, filter === "due" ? styles.chipActive : null]}
              >
                <Text style={[styles.chipText, filter === "due" ? styles.chipTextActive : null]}>Due</Text>
              </Pressable>
              <Pressable
                onPress={() => setFilter("paid")}
                style={[styles.chip, filter === "paid" ? styles.chipActive : null]}
              >
                <Text style={[styles.chipText, filter === "paid" ? styles.chipTextActive : null]}>Paid</Text>
              </Pressable>
            </View>

            <View style={styles.billList}>
              {selectedBills.length === 0 ? (
                <Text style={styles.empty}>No bills on this day.</Text>
              ) : (
                selectedBills.map((b) => {
                  const { bg, icon, color } = billIcon(b.title);
                  const isToday = sameDay(b.due, today);
                  const isPast = b.due < today && !isToday;

                  const statusPill = b.paid
                    ? {
                      text: `Paid on ${formatShortMonthDay(new Date(b.paidDateISO || b.dueISO))}`,
                      bg: ui.paidPillBg,
                      fg: ui.paidPillText
                    }
                    : {
                      text: isToday ? "Due Today" : isPast ? "Overdue" : "Upcoming",
                      bg: isPast ? "#FEE2E2" : ui.duePillBg,
                      fg: isPast ? "#991B1B" : ui.duePillText
                    };
                  return (
                    <Pressable
                      key={b.id}
                      style={styles.billRow}
                      onPress={() => navigation.navigate("BillDetail", { billId: b.id })}
                    >
                      <View style={[styles.billIcon, { backgroundColor: bg }]}>
                        <Ionicons name={icon as any} size={20} color={color} />
                      </View>
                      <View style={styles.billMid}>
                        <Text style={[styles.billTitle, b.title.toLowerCase().includes("netflix") && styles.billTitleNormal]}>{b.title}</Text>
                        <View style={[styles.pill, { backgroundColor: statusPill.bg }]}>
                          <Text style={[styles.pillText, { color: statusPill.fg }]}>{statusPill.text}</Text>
                        </View>
                      </View>
                      <Text style={styles.billAmount}>{formatCurrency(b.amount)}</Text>
                      <Pressable
                        onPress={() => markBillPaid(b.id, !b.paid)}
                        style={[styles.check, b.paid ? styles.checkOn : styles.checkOff]}
                      >
                        {b.paid ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
                      </Pressable>
                    </Pressable>
                  );
                })
              )}
            </View>
          </View>
        </ScrollView>

        <Pressable
          style={styles.fab}
          onPress={() => navigation.navigate("AddBill", { date: selected.toISOString() })}
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
    paddingBottom: 140,
  },
  monthHeader: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  monthBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitle: {
    color: ui.text,
    fontWeight: "900",
    fontSize: 18,
  },
  weekdays: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  weekday: {
    width: "14.285%",
    textAlign: "center",
    color: ui.muted,
    fontWeight: "800",
  },
  calendarGrid: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.285%",
    paddingVertical: 8,
    alignItems: "center",
  },
  dayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleSelected: {
    backgroundColor: ui.chipActive,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.65)",
  },
  dayText: {
    color: ui.text,
    fontWeight: "800",
  },
  dayTextSelected: {
    color: "#FFFFFF",
  },
  dots: {
    position: "absolute",
    bottom: 6,
    flexDirection: "row",
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sheet: {
    marginTop: 18,
    backgroundColor: ui.card,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: ui.border,
    padding: 16,
  },
  sheetTitle: {
    color: ui.text,
    fontWeight: "900",
    fontSize: 18,
  },
  chips: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },
  chip: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
    backgroundColor: ui.chip,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: ui.chipActive,
  },
  chipText: {
    color: ui.text,
    fontWeight: "800",
  },
  chipTextActive: {
    color: ui.chipActiveText,
  },
  billList: {
    marginTop: 14,
    gap: 12,
  },
  billRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  billIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  billMid: {
    flex: 1,
  },
  billTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: ui.text,
  },
  billTitleNormal: {
    fontWeight: "700",
  },
  billAmount: {
    fontSize: 16,
    fontWeight: "900",
    color: ui.text,
    marginRight: 8,
  },
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "800",
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOff: {
    borderWidth: 2,
    borderColor: ui.border,
  },
  checkOn: {
    backgroundColor: ui.dotPaid,
  },
  empty: {
    textAlign: "center",
    color: ui.muted,
    paddingVertical: 20,
    fontWeight: "700",
  },
  fab: {
    position: "absolute",
    right: 25,
    bottom: 15,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ui.fab,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
});
