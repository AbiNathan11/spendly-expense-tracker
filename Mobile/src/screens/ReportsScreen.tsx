import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, Modal, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../components/Screen";
import { useBudget } from "../state/BudgetStore";
import { formatMoney } from "../utils/format";

const ui = {
  bg: "#F9FAFB",
  card: "#FFFFFF",
  border: "#E5E7EB",
  text: "#223447",
  muted: "#6B7280",
  accent: "#223447",
  success: "#22C55E",
};

type RangeKey = "month" | "qtr" | "year";

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
        <Text style={styles.donutTotal}>{formatMoney(props.total)}</Text>
      </View>
    </View>
  );
}

export function ReportsScreen() {
  const { state } = useBudget();
  const [range, setRange] = React.useState<RangeKey>("month");
  const [menuOpen, setMenuOpen] = React.useState(false);

  const byCategory = useMemo(() => {
    // Uses actual envelope color now. Scale based on range.
    let multiplier = 1;
    if (range === "qtr") multiplier = 3.2;
    if (range === "year") multiplier = 12.5;

    const categories = state.envelopes.map((e) => ({
      name: e.name,
      value: e.spent * multiplier,
      color: e.color
    }));
    const total = sum(categories.map((c) => c.value));
    return { categories, total };
  }, [state.envelopes, range]);

  const trendData = useMemo(() => {
    // Mock data for trends based on range
    if (range === 'month') {
      return {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        values: [0.65, 0.45, 0.75, 0.50], // 0-1 scale
        spent: byCategory.total,
        deltaPct: -5,
        caption: "less than last month",
        barWidth: 32
      };
    } else if (range === 'qtr') {
      return {
        labels: ['Oct', 'Nov', 'Dec'],
        values: [0.8, 0.65, 0.9],
        spent: byCategory.total,
        deltaPct: 12,
        caption: "more than last quarter",
        barWidth: 40
      };
    } else {
      return {
        labels: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
        values: [0.4, 0.5, 0.45, 0.6, 0.7, 0.8, 0.6, 0.55, 0.65, 0.7, 0.85, 0.9],
        spent: byCategory.total,
        deltaPct: 8,
        caption: "more than last year",
        barWidth: 8
      };
    }
  }, [range, byCategory.total]);

  const getRangeLabel = () => {
    switch (range) {
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
            <Pressable style={styles.menuBtn} onPress={() => setMenuOpen(true)}>
              <Ionicons name="ellipsis-vertical" size={20} color={ui.text} />
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Spending Trend</Text>
            <View style={styles.amountRow}>
              <Text style={styles.bigAmount}>{formatMoney(trendData.spent)}</Text>
              <View style={styles.delta}>
                <Ionicons
                  name={trendData.deltaPct <= 0 ? "arrow-down" : "arrow-up"}
                  size={14}
                  color={ui.success}
                />
                <Text style={styles.deltaText}>{`${Math.abs(trendData.deltaPct)}%`}</Text>
              </View>
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
                <View key={c.name} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: c.color }]} />
                  <Text style={styles.legendName}>{c.name}</Text>
                  <Text style={styles.legendValue}>{formatMoney(c.value)}</Text>
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
