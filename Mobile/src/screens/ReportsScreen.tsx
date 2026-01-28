import React, { useMemo, useState, useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, Modal, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { Screen } from "../components/Screen";
import { useBudget } from "../state/BudgetStore";
import { reportService, MonthlyReport, WeeklyReport } from "../services/reportService";

const ui = {
  bg: "#F9FAFB",
  card: "#FFFFFF",
  border: "#E5E7EB",
  text: "#223447",
  muted: "#6B7280",
  accent: "#223447",
  success: "#22C55E",
};

type RangeKey = "week" | "month" | "qtr" | "year";

function sum(nums: number[]) {
  return nums.reduce((s, n) => s + n, 0);
}

function buildDonutColors(args: { values: number[]; colors: string[]; segments: number }) {
  const total = sum(args.values);
  if (total <= 0) return Array.from({ length: args.segments }, () => "#E5E7EB");
  const counts = args.values.map((v) => Math.max(0, Math.round((v / total) * args.segments)));
  // Fix rounding drift
  const used = sum(counts);
  if (used !== args.segments) {
    const i = counts.findIndex(() => true);
    if (i >= 0) counts[i] = Math.max(0, counts[i] + (args.segments - used));
  }
  const out: string[] = [];
  for (let i = 0; i < counts.length; i += 1) {
    for (let k = 0; k < counts[i]; k += 1) out.push(args.colors[i]);
  }
  return out.slice(0, args.segments);
}

function Donut(props: { total: number; values: number[]; colors: string[] }) {
  const { formatCurrency } = useBudget();
  const size = 150;
  const segments = 72;
  const ringRadius = 54;
  const tickW = 5;
  const tickH = 12;
  const angle = 360 / segments;
  const ticks = useMemo(
    () => buildDonutColors({ values: props.values, colors: props.colors, segments }),
    [props.colors, props.values]
  );

  return (
    <View style={[styles.donut, { width: size, height: size }]}>
      {ticks.map((c, idx) => (
        <View
          // eslint-disable-next-line react/no-array-index-key
          key={idx}
          style={[
            styles.tick,
            {
              width: tickW,
              height: tickH,
              borderRadius: tickW / 2,
              backgroundColor: c,
              transform: [{ rotate: `${idx * angle}deg` }, { translateY: -ringRadius }],
            },
          ]}
        />
      ))}
      <View style={styles.donutHole}>
        <Text style={styles.donutLabel}>Total</Text>
        <Text style={styles.donutTotal}>{formatCurrency(props.total)}</Text>
      </View>
    </View>
  );
}

export function ReportsScreen() {
  const { state, formatCurrency } = useBudget();
  const [range, setRange] = useState<RangeKey>("month");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [monthlyData, setMonthlyData] = useState<MonthlyReport | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyReport | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const [mRes, wRes] = await Promise.all([
        reportService.getMonthlyReport(now.getMonth() + 1, now.getFullYear()),
        reportService.getWeeklyReport()
      ]);

      if (mRes.success) setMonthlyData(mRes.data || null);
      if (wRes.success) setWeeklyData(wRes.data || null);
    } catch (error) {
      console.error("FetchReports error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [fetchReports])
  );

  const byCategory = useMemo(() => {
    if (range === "month" && monthlyData) {
      const categories = monthlyData.envelope_breakdown.map((e) => ({
        name: e.name,
        value: e.spent,
        color: state.envelopes.find(env => env.name === e.name)?.color || "#CBD5E1"
      }));
      return { categories, total: monthlyData.total_spent };
    }

    if (range === "week" && weeklyData) {
      const categories = weeklyData.envelope_breakdown.map((e) => ({
        name: e.name,
        value: e.total,
        color: state.envelopes.find(env => env.name === e.name)?.color || "#CBD5E1"
      }));
      return { categories, total: weeklyData.total_spent };
    }

    // Dynamic calculation for QTR and YEAR from state.transactions history
    const now = new Date();
    let cutoff = new Date();
    if (range === "qtr") cutoff.setMonth(now.getMonth() - 3);
    else cutoff.setFullYear(now.getFullYear() - 1);

    const relevantTx = state.transactions.filter(t => new Date(t.dateISO) >= cutoff);
    const totalsByEnv: Record<string, number> = {};
    relevantTx.forEach(t => {
      totalsByEnv[t.envelopeId] = (totalsByEnv[t.envelopeId] || 0) + t.amount;
    });

    const categories = state.envelopes.map(e => ({
      name: e.name,
      value: totalsByEnv[e.id] || 0,
      color: e.color
    })).filter(c => c.value > 0);

    const total = sum(categories.map(c => c.value));
    return { categories, total };
  }, [state.envelopes, state.transactions, range, monthlyData, weeklyData]);

  const trendData = useMemo(() => {
    const now = new Date();

    if (range === "month" && monthlyData) {
      const daily = monthlyData.daily_breakdown;
      const weeks = [0, 0, 0, 0];
      daily.forEach((d, i) => {
        const weekIdx = Math.min(3, Math.floor(i / 7.5));
        weeks[weekIdx] += d.total_spent;
      });
      const max = Math.max(...weeks, 1);
      return {
        labels: ['W1', 'W2', 'W3', 'W4'],
        values: weeks.map(v => v / max),
        spent: monthlyData.total_spent,
        deltaPct: 0,
        caption: "spent this month",
        barWidth: 32
      };
    }

    if (range === "week" && weeklyData) {
      const days = weeklyData.daily_breakdown;
      const max = Math.max(...days.map(d => d.total_spent), 1);
      return {
        labels: days.map(d => d.day.slice(0, 3)),
        values: days.map(d => d.total_spent / max),
        spent: weeklyData.total_spent,
        deltaPct: 0,
        caption: "total for this week",
        barWidth: 20
      };
    }

    if (range === "qtr") {
      const labels: string[] = [];
      const monthTotals: number[] = [0, 0, 0];
      for (let i = 2; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(d.toLocaleString('default', { month: 'short' }));

        const m = d.getMonth();
        const y = d.getFullYear();
        monthTotals[2 - i] = state.transactions
          .filter(t => {
            const td = new Date(t.dateISO);
            return td.getMonth() === m && td.getFullYear() === y;
          })
          .reduce((s, t) => s + t.amount, 0);
      }

      const max = Math.max(...monthTotals, 1);
      return {
        labels,
        values: monthTotals.map(v => v / max),
        spent: sum(monthTotals),
        deltaPct: 0,
        caption: "spent last 3 months",
        barWidth: 40
      };
    }

    // YEAR
    const labels: string[] = [];
    const yearTotals: number[] = Array(12).fill(0);
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleString('default', { month: 'narrow' }));

      const m = d.getMonth();
      const y = d.getFullYear();
      yearTotals[11 - i] = state.transactions
        .filter(t => {
          const td = new Date(t.dateISO);
          return td.getMonth() === m && td.getFullYear() === y;
        })
        .reduce((s, t) => s + t.amount, 0);
    }
    const max = Math.max(...yearTotals, 1);
    return {
      labels,
      values: yearTotals.map(v => v / max),
      spent: sum(yearTotals),
      deltaPct: 0,
      caption: "total for last 12 months",
      barWidth: 8
    };
  }, [range, state.transactions, monthlyData, weeklyData]);

  const getRangeLabel = () => {
    switch (range) {
      case "week": return "This Week";
      case "month": return "This Month";
      case "qtr": return "Last 3 Months";
      case "year": return "This Year";
    }
  };

  return (
    <Screen padded={false} style={styles.screen}>
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Financial Reports</Text>
              <Text style={styles.headerSubtitle}>{getRangeLabel()}</Text>
            </View>
            <View style={styles.headerRight}>
              {loading && <ActivityIndicator size="small" color={ui.accent} style={{ marginRight: 10 }} />}
              <Pressable style={styles.menuBtn} onPress={() => setMenuOpen(true)}>
                <Ionicons name="filter" size={20} color={ui.text} />
              </Pressable>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Spending Trend</Text>
            <View style={styles.amountRow}>
              <Text style={styles.bigAmount}>{formatCurrency(trendData.spent)}</Text>
              {trendData.deltaPct !== 0 && (
                <View style={styles.delta}>
                  <Ionicons
                    name={trendData.deltaPct <= 0 ? "arrow-down" : "arrow-up"}
                    size={14}
                    color={ui.success}
                  />
                  <Text style={styles.deltaText}>{`${Math.abs(trendData.deltaPct)}%`}</Text>
                </View>
              )}
            </View>
            <Text style={styles.caption}>{trendData.caption}</Text>

            <View style={styles.chartContainer}>
              {trendData.labels.map((label, idx) => (
                <View key={idx} style={styles.chartCol}>
                  <View style={[styles.bar, { height: `${trendData.values[idx] * 100}%`, width: trendData.barWidth }]} />
                  <Text style={styles.chartLabel} numberOfLines={1}>{label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Spending by Category</Text>
            <View style={styles.categoryTop}>
              <Donut
                total={byCategory.total}
                values={byCategory.categories.map((c) => c.value)}
                colors={byCategory.categories.map((c) => c.color)}
              />
            </View>

            <View style={styles.legend}>
              {byCategory.categories.map((c, idx) => (
                <View key={`report-legend-${c.name}-${idx}`} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: c.color }]} />
                  <Text style={styles.legendName}>{c.name}</Text>
                  <Text style={styles.legendValue}>{formatCurrency(c.value)}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Filters Menu Modal */}
        <Modal
          transparent
          visible={menuOpen}
          animationType="fade"
          onRequestClose={() => setMenuOpen(false)}
        >
          <TouchableOpacity
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={() => setMenuOpen(false)}
          >
            <View style={styles.menuDropdown}>
              <Text style={styles.menuHeader}>Select Range</Text>
              <TouchableOpacity
                style={[styles.menuItem, range === 'week' && styles.menuItemActive]}
                onPress={() => { setRange('week'); setMenuOpen(false); }}
              >
                <Text style={[styles.menuText, range === 'week' && styles.menuTextActive]}>This Week</Text>
                {range === 'week' && <Ionicons name="checkmark" size={18} color={ui.accent} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuItem, range === 'month' && styles.menuItemActive]}
                onPress={() => { setRange('month'); setMenuOpen(false); }}
              >
                <Text style={[styles.menuText, range === 'month' && styles.menuTextActive]}>This Month</Text>
                {range === 'month' && <Ionicons name="checkmark" size={18} color={ui.accent} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuItem, range === 'qtr' && styles.menuItemActive]}
                onPress={() => { setRange('qtr'); setMenuOpen(false); }}
              >
                <Text style={[styles.menuText, range === 'qtr' && styles.menuTextActive]}>Last 3 Months</Text>
                {range === 'qtr' && <Ionicons name="checkmark" size={18} color={ui.accent} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuItem, range === 'year' && styles.menuItemActive]}
                onPress={() => { setRange('year'); setMenuOpen(false); }}
              >
                <Text style={[styles.menuText, range === 'year' && styles.menuTextActive]}>This Year</Text>
                {range === 'year' && <Ionicons name="checkmark" size={18} color={ui.accent} />}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

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
    paddingBottom: 24,
  },
  header: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    marginBottom: 6,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    color: ui.text,
    fontSize: 18, // Font size matches EnvelopesScreen
    fontWeight: "900",
  },
  headerSubtitle: {
    color: ui.muted,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  card: {
    marginTop: 16,
    backgroundColor: ui.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: ui.border,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardTitle: {
    color: ui.text,
    fontWeight: "900",
    fontSize: 16,
  },
  amountRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
  },
  bigAmount: {
    color: ui.text,
    fontSize: 30,
    fontWeight: "900",
  },
  delta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  deltaText: {
    color: ui.success,
    fontWeight: "900",
  },
  caption: {
    marginTop: 4,
    color: ui.muted,
    fontWeight: "700",
  },
  chartContainer: {
    marginTop: 24,
    height: 140, // Fixed height for alignment
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end", // Bars start from bottom
    paddingHorizontal: 4,
  },
  chartCol: {
    flex: 1,
    height: "100%",
    justifyContent: "flex-end", // align bottom
    alignItems: "center",
    gap: 8,
  },
  bar: {
    width: 12, // slightly wider or dynamic
    minHeight: 4,
    borderRadius: 6,
    backgroundColor: "#A7C7F5",
  },
  chartLabel: {
    color: ui.muted,
    fontWeight: "700",
    fontSize: 10,
    textAlign: "center",
  },
  categoryTop: {
    marginTop: 12,
    alignItems: "center",
  },
  donut: {
    alignItems: "center",
    justifyContent: "center",
  },
  tick: {
    position: "absolute",
    left: "50%",
    top: "50%",
    marginLeft: -2.5,
    marginTop: -6,
  },
  donutHole: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: ui.card,
    alignItems: "center",
    justifyContent: "center",
  },
  donutLabel: {
    color: ui.muted,
    fontWeight: "800",
    fontSize: 12,
  },
  donutTotal: {
    color: ui.text,
    fontWeight: "900",
    marginTop: 2,
  },
  legend: {
    marginTop: 10,
    gap: 10,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  legendName: {
    flex: 1,
    color: ui.text,
    fontWeight: "800",
  },
  legendValue: {
    color: ui.text,
    fontWeight: "900",
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 60,
    paddingRight: 20,
  },
  menuDropdown: {
    width: 200,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  menuHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    textTransform: "uppercase",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  menuItemActive: {
    backgroundColor: "#F3F4F6",
  },
  menuText: {
    fontSize: 15,
    fontWeight: "600",
    color: ui.text,
  },
  menuTextActive: {
    color: ui.accent,
    fontWeight: "800",
  },
});
