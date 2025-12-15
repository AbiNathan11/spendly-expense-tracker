import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
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
  chip: "#E5E7EB",
  chipActive: "#223447",
  chipActiveText: "#FFFFFF",
  dotDue: "#F59E0B",
  dotPaid: "#22C55E",
  duePillBg: "#FFF3D2",
  duePillText: "#B45309",
  paidPillBg: "#DCFCE7",
  paidPillText: "#166534",
  fab: "#223447",
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
  const { state, markBillPaid } = useBudget();

  const today = useMemo(() => toDateOnly(new Date()), []);
  const [cursor, setCursor] = useState(() => ({ year: today.getFullYear(), month: today.getMonth() }));
  const [selected, setSelected] = useState<Date>(today);
  const [filter, setFilter] = useState<"all" | "due" | "paid">("all");

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

  const calendar = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const startWeekday = first.getDay(); // 0=Sun

    const cells: Array<{ day: number | null; date: Date | null }> = [];
    for (let i = 0; i < startWeekday; i += 1) cells.push({ day: null, date: null });
    for (let d = 1; d <= daysInMonth; d += 1) cells.push({ day: d, date: new Date(cursor.year, cursor.month, d) });
    while (cells.length % 7 !== 0) cells.push({ day: null, date: null });

    return { cells };
  }, [cursor.month, cursor.year]);

  const dayDots = useMemo(() => {
    const map = new Map<string, { due: boolean; paid: boolean }>();
    for (const b of billsInMonth) {
      const key = `${b.due.getFullYear()}-${b.due.getMonth()}-${b.due.getDate()}`;
      const prev = map.get(key) ?? { due: false, paid: false };
      map.set(key, {
        due: prev.due || !b.paid,
        paid: prev.paid || b.paid,
      });
    }
    return map;
  }, [billsInMonth]);

  return (
    <Screen padded={false} style={styles.screen}>
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.monthHeader}>
            <Pressable
              style={styles.monthBtn}
              onPress={() => {
                const m = cursor.month - 1;
                if (m < 0) setCursor({ year: cursor.year - 1, month: 11 });
                else setCursor({ year: cursor.year, month: m });
              }}
            >
              <Ionicons name="chevron-back" size={22} color={ui.text} />
            </Pressable>
            <Text style={styles.monthTitle}>{formatMonthTitle(cursor.year, cursor.month)}</Text>
            <Pressable
              style={styles.monthBtn}
              onPress={() => {
                const m = cursor.month + 1;
                if (m > 11) setCursor({ year: cursor.year + 1, month: 0 });
                else setCursor({ year: cursor.year, month: m });
              }}
            >
              <Ionicons name="chevron-forward" size={22} color={ui.text} />
            </Pressable>
          </View>

          <View style={styles.weekdays}>
            {"SMTWTFS".split("").map((d, idx) => (
              <Text key={`weekday-${idx}`} style={styles.weekday}>
                {d}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendar.cells.map((c, idx) => {
              const isSelected = c.date ? sameDay(c.date, selected) : false;
              const key = c.date ? `${c.date.getFullYear()}-${c.date.getMonth()}-${c.date.getDate()}` : `${idx}`;
              const dots = c.date ? dayDots.get(key) : undefined;
              return (
                <Pressable
                  key={idx}
                  style={styles.dayCell}
                  onPress={() => {
                    if (!c.date) return;
                    setSelected(c.date);
                  }}
                >
                  {c.day ? (
                    <View style={[styles.dayCircle, isSelected ? styles.dayCircleSelected : null]}>
                      <Text style={[styles.dayText, isSelected ? styles.dayTextSelected : null]}>{c.day}</Text>
                      {dots ? (
                        <View style={styles.dots}>
                          {!dots.due && !dots.paid ? null : (
                            <>
                              {dots.due ? <View style={[styles.dot, { backgroundColor: ui.dotDue }]} /> : null}
                              {dots.paid ? <View style={[styles.dot, { backgroundColor: ui.dotPaid }]} /> : null}
                            </>
                          )}
                        </View>
                      ) : null}
                    </View>
                  ) : (
                    <View style={styles.dayCircle} />
                  )}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{`Bills for ${formatShortMonthDay(selected)}`}</Text>

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
                  const statusPill = b.paid
                    ? { text: `Paid on ${formatShortMonthDay(b.due)}`, bg: ui.paidPillBg, fg: ui.paidPillText }
                    : { text: "Due Today", bg: ui.duePillBg, fg: ui.duePillText };
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
                      <Text style={styles.billAmount}>{formatMoney(b.amount)}</Text>
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
  empty: {
    color: ui.muted,
    fontWeight: "700",
    paddingVertical: 10,
  },
  billRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  billIcon: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  billMid: {
    flex: 1,
    gap: 6,
  },
  billTitle: {
    color: ui.text,
    fontWeight: "900",
    fontSize: 15,
  },
  billTitleNormal: {
    color: ui.text,
    fontWeight: "700",
    fontSize: 15,
  },
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    fontWeight: "900",
    fontSize: 12,
  },
  billAmount: {
    color: ui.text,
    fontWeight: "900",
    marginRight: 8,
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
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
  },
  checkOn: {
    backgroundColor: ui.dotPaid,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 0,
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
