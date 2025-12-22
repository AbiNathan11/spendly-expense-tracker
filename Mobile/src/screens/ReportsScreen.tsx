import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../components/Screen";
import { formatMoney } from "../utils/format";
import { reportService } from "../services/reportService";

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

/* ---------------- DONUT ---------------- */

function buildDonutColors(args: {
  values: number[];
  colors: string[];
  segments: number;
}) {
  const total = sum(args.values);
  if (total <= 0)
    return Array.from({ length: args.segments }, () => "#E5E7EB");

  const counts = args.values.map((v) =>
    Math.max(0, Math.round((v / total) * args.segments))
  );

  const used = sum(counts);
  if (used !== args.segments) {
    counts[0] += args.segments - used;
  }

  const out: string[] = [];
  for (let i = 0; i < counts.length; i++) {
    for (let k = 0; k < counts[i]; k++) out.push(args.colors[i]);
  }
  return out.slice(0, args.segments);
}

function Donut(props: {
  total: number;
  values: number[];
  colors: string[];
}) {
  const size = 150;
  const segments = 72;
  const ringRadius = 54;
  const tickW = 5;
  const tickH = 12;
  const angle = 360 / segments;

  const ticks = useMemo(
    () =>
      buildDonutColors({
        values: props.values,
        colors: props.colors,
        segments,
      }),
    [props.values, props.colors]
  );

  return (
    <View style={[styles.donut, { width: size, height: size }]}>
      {ticks.map((c, idx) => (
        <View
          key={idx}
          style={[
            styles.tick,
            {
              width: tickW,
              height: tickH,
              backgroundColor: c,
              transform: [
                { rotate: `${idx * angle}deg` },
                { translateY: -ringRadius },
              ],
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

/* ---------------- SCREEN ---------------- */

export function ReportsScreen() {
  const [range, setRange] = useState<RangeKey>("month");
  const [menuOpen, setMenuOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);

  /* -------- FETCH REPORT -------- */

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        let res;
        if (range === "month") {
          res = await reportService.getMonthlyReport(month, year);
        } else if (range === "qtr") {
          res = await reportService.getQuarterlyReport(year);
        } else {
          res = await reportService.getYearlyReport(year);
        }

        if (!res.success) {
          throw new Error(res.message || "Failed to load report");
        }

        setReport(res.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [range]);

  /* -------- CATEGORY DATA -------- */

  const byCategory = useMemo(() => {
    if (!report) return { categories: [], total: 0 };

    const categories = report.envelope_breakdown.map((e: any) => ({
      name: e.name,
      value: e.spent,
      color: e.color || "#A7C7F5",
    }));

    return {
      categories,
      total: sum(categories.map((c) => c.value)),
    };
  }, [report]);

  /* -------- TREND DATA -------- */

  const trendData = useMemo(() => {
    if (!report) return null;

    return {
      labels: report.trend.labels,
      values: report.trend.values, // already 0–1 normalized
      spent: report.total_spent,
      deltaPct: report.delta_pct,
      caption: report.delta_caption,
      barWidth: range === "year" ? 8 : range === "qtr" ? 40 : 32,
    };
  }, [report, range]);

  const getRangeLabel = () => {
    if (range === "month") return "This Month";
    if (range === "qtr") return "Last 3 Months";
    return "This Year";
  };

  /* -------- STATES -------- */

  if (loading) {
    return (
      <Screen>
        <Text>Loading report...</Text>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <Text style={{ color: "red" }}>{error}</Text>
      </Screen>
    );
  }

  /* -------- UI -------- */

  return (
    <Screen padded={false} style={styles.screen}>
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Financial Reports</Text>
              <Text style={styles.headerSubtitle}>{getRangeLabel()}</Text>
            </View>
            <Pressable style={styles.menuBtn} onPress={() => setMenuOpen(true)}>
              <Ionicons name="ellipsis-vertical" size={20} color={ui.text} />
            </Pressable>
          </View>

          {/* -------- TREND CARD -------- */}
          {trendData && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Spending Trend</Text>

              <View style={styles.amountRow}>
                <Text style={styles.bigAmount}>
                  {formatMoney(trendData.spent)}
                </Text>
                <View style={styles.delta}>
                  <Ionicons
                    name={
                      trendData.deltaPct <= 0 ? "arrow-down" : "arrow-up"
                    }
                    size={14}
                    color={ui.success}
                  />
                  <Text style={styles.deltaText}>
                    {Math.abs(trendData.deltaPct)}%
                  </Text>
                </View>
              </View>

              <Text style={styles.caption}>{trendData.caption}</Text>

              <View style={styles.chartContainer}>
                {trendData.labels.map((label: string, idx: number) => (
                  <View key={idx} style={styles.chartCol}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${trendData.values[idx] * 100}%`,
                          width: trendData.barWidth,
                        },
                      ]}
                    />
                    <Text style={styles.chartLabel}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* -------- CATEGORY CARD -------- */}
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
              {byCategory.categories.map((c: any) => (
                <View key={c.name} style={styles.legendRow}>
                  <View
                    style={[styles.legendDot, { backgroundColor: c.color }]}
                  />
                  <Text style={styles.legendName}>{c.name}</Text>
                  <Text style={styles.legendValue}>
                    {formatMoney(c.value)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* -------- RANGE MENU -------- */}
        <Modal transparent visible={menuOpen} animationType="fade">
          <TouchableOpacity
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={() => setMenuOpen(false)}
          >
            <View style={styles.menuDropdown}>
              {(["month", "qtr", "year"] as RangeKey[]).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.menuItem,
                    range === r && styles.menuItemActive,
                  ]}
                  onPress={() => {
                    setRange(r);
                    setMenuOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.menuText,
                      range === r && styles.menuTextActive,
                    ]}
                  >
                    {r === "month"
                      ? "This Month"
                      : r === "qtr"
                      ? "Last 3 Months"
                      : "This Year"}
                  </Text>
                  {range === r && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={ui.accent}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </Screen>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  screen: { backgroundColor: ui.bg },
  page: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 24 },
  header: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: ui.text },
  headerSubtitle: { fontSize: 14, fontWeight: "600", color: ui.muted },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    marginTop: 16,
    backgroundColor: ui.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: ui.border,
    padding: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: "900", color: ui.text },
  amountRow: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  bigAmount: { fontSize: 30, fontWeight: "900", color: ui.text },
  delta: { flexDirection: "row", alignItems: "center", gap: 4 },
  deltaText: { fontWeight: "900", color: ui.success },
  caption: { marginTop: 4, color: ui.muted, fontWeight: "700" },
  chartContainer: {
    marginTop: 24,
    height: 140,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  chartCol: { flex: 1, alignItems: "center", gap: 8 },
  bar: { borderRadius: 6, backgroundColor: "#A7C7F5" },
  chartLabel: { fontSize: 10, color: ui.muted, fontWeight: "700" },
  categoryTop: { alignItems: "center", marginTop: 12 },
  donut: { alignItems: "center", justifyContent: "center" },
  tick: { position: "absolute", left: "50%", top: "50%" },
  donutHole: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: ui.card,
    alignItems: "center",
    justifyContent: "center",
  },
  donutLabel: { fontSize: 12, fontWeight: "800", color: ui.muted },
  donutTotal: { fontWeight: "900", color: ui.text },
  legend: { marginTop: 10, gap: 10 },
  legendRow: { flexDirection: "row", alignItems: "center" },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  legendName: { flex: 1, fontWeight: "800", color: ui.text },
  legendValue: { fontWeight: "900", color: ui.text },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "flex-end",
    paddingTop: 60,
    paddingRight: 20,
  },
  menuDropdown: {
    width: 200,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 8,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
  },
  menuItemActive: { backgroundColor: "#F3F4F6" },
  menuText: { fontSize: 15, fontWeight: "600", color: ui.text },
  menuTextActive: { fontWeight: "800", color: ui.accent },
});
