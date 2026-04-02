// src/screens/admin/AdminRevenueScreen.tsx
"use client";

import { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "../../components/Icon";
import { colors } from "../../theme/colors";
import {
  MONTHLY_REVENUE,
  DASHBOARD_STATS,
  type RevenueMonth,
} from "../../data/adminDummyData";

const formatCurrency = (amount: number): string => {
  return `\u20B9${amount.toLocaleString("en-IN")}`;
};

const formatCurrencyCompact = (amount: number): string => {
  if (amount >= 100000) {
    return `\u20B9${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `\u20B9${(amount / 1000).toFixed(1)}K`;
  }
  return `\u20B9${amount}`;
};

const BAR_MAX_HEIGHT = 150;

interface SummaryCardProps {
  title: string;
  value: string;
  iconName: string;
  bgColor: string;
}

const SummaryCard = ({ title, value, iconName, bgColor }: SummaryCardProps) => (
  <View style={[styles.summaryCard, { backgroundColor: bgColor }]}>
    <View style={styles.summaryIconCircle}>
      <Icon name={iconName} size={22} color={bgColor} />
    </View>
    <Text style={styles.summaryValue}>{value}</Text>
    <Text style={styles.summaryTitle}>{title}</Text>
  </View>
);

export const AdminRevenueScreen = ({ navigation }: any) => {
  const totalRevenue = DASHBOARD_STATS.totalRevenue;
  const totalOrders = DASHBOARD_STATS.totalOrders;

  const thisMonthRevenue = useMemo(() => {
    return MONTHLY_REVENUE[MONTHLY_REVENUE.length - 1]?.revenue ?? 0;
  }, []);

  const avgOrderValue = useMemo(() => {
    return totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  }, [totalRevenue, totalOrders]);

  const maxRevenue = useMemo(() => {
    return Math.max(...MONTHLY_REVENUE.map((m) => m.revenue));
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={styles.backBtn}
        >
          <Icon name="arrow-back" size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Revenue</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.summaryScroll}
        >
          <SummaryCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            iconName="cash-outline"
            bgColor={colors.primary}
          />
          <SummaryCard
            title="This Month"
            value={formatCurrency(thisMonthRevenue)}
            iconName="trending-up"
            bgColor={colors.success}
          />
          <SummaryCard
            title="Avg Order Value"
            value={formatCurrency(avgOrderValue)}
            iconName="pricetag-outline"
            bgColor={colors.info}
          />
        </ScrollView>

        {/* Bar Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Revenue</Text>
          <View style={styles.chartCard}>
            <View style={styles.chartContainer}>
              {MONTHLY_REVENUE.map((item: RevenueMonth, index: number) => {
                const barHeight =
                  maxRevenue > 0
                    ? (item.revenue / maxRevenue) * BAR_MAX_HEIGHT
                    : 0;
                const isLast = index === MONTHLY_REVENUE.length - 1;

                return (
                  <View key={item.month} style={styles.barWrapper}>
                    {/* Value label above bar */}
                    <Text style={styles.barValueText}>
                      {formatCurrencyCompact(item.revenue)}
                    </Text>

                    {/* Bar */}
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: isLast
                            ? colors.accent
                            : colors.primary,
                        },
                      ]}
                    />

                    {/* Month label below bar */}
                    <Text style={styles.barMonthText}>{item.month}</Text>
                  </View>
                );
              })}
            </View>

            {/* Horizontal grid lines */}
            <View style={styles.gridLinesContainer}>
              {[0.25, 0.5, 0.75, 1].map((fraction) => (
                <View
                  key={fraction}
                  style={[
                    styles.gridLine,
                    {
                      bottom:
                        fraction * BAR_MAX_HEIGHT + 24, // offset for month label
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Monthly Breakdown Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
          <View style={styles.tableCard}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableHeaderText, styles.colMonth]}>
                Month
              </Text>
              <Text style={[styles.tableHeaderText, styles.colOrders]}>
                Orders
              </Text>
              <Text style={[styles.tableHeaderText, styles.colRevenue]}>
                Revenue
              </Text>
              <Text style={[styles.tableHeaderText, styles.colAvg]}>
                Avg
              </Text>
            </View>

            {/* Table Rows */}
            {MONTHLY_REVENUE.map((item: RevenueMonth, index: number) => {
              const avg =
                item.orders > 0 ? Math.round(item.revenue / item.orders) : 0;
              const isEven = index % 2 === 0;

              return (
                <View
                  key={item.month}
                  style={[
                    styles.tableRow,
                    isEven
                      ? styles.tableRowEven
                      : styles.tableRowOdd,
                  ]}
                >
                  <Text style={[styles.tableCell, styles.colMonth]}>
                    {item.month}
                  </Text>
                  <Text style={[styles.tableCell, styles.colOrders]}>
                    {item.orders}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.colRevenue,
                      styles.tableCellBold,
                    ]}
                  >
                    {formatCurrency(item.revenue)}
                  </Text>
                  <Text style={[styles.tableCell, styles.colAvg]}>
                    {formatCurrency(avg)}
                  </Text>
                </View>
              );
            })}

            {/* Totals Row */}
            <View style={[styles.tableRow, styles.tableTotalRow]}>
              <Text style={[styles.tableTotalText, styles.colMonth]}>
                Total
              </Text>
              <Text style={[styles.tableTotalText, styles.colOrders]}>
                {MONTHLY_REVENUE.reduce((sum, m) => sum + m.orders, 0).toLocaleString("en-IN")}
              </Text>
              <Text
                style={[
                  styles.tableTotalText,
                  styles.colRevenue,
                ]}
              >
                {formatCurrency(
                  MONTHLY_REVENUE.reduce((sum, m) => sum + m.revenue, 0)
                )}
              </Text>
              <Text style={[styles.tableTotalText, styles.colAvg]}>
                {formatCurrency(
                  Math.round(
                    MONTHLY_REVENUE.reduce((sum, m) => sum + m.revenue, 0) /
                      MONTHLY_REVENUE.reduce((sum, m) => sum + m.orders, 0)
                  )
                )}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
    flex: 1,
  },
  headerSpacer: {
    width: 36,
  },

  scrollView: {
    flex: 1,
    backgroundColor: colors.lightBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // Summary Cards
  summaryScroll: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 4,
    gap: 12,
  },
  summaryCard: {
    width: 170,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 2,
  },
  summaryTitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },

  // Section
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },

  // Chart
  chartCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: "relative",
    overflow: "hidden",
  },
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: BAR_MAX_HEIGHT + 50, // extra space for labels
    paddingTop: 20,
    zIndex: 2,
  },
  barWrapper: {
    alignItems: "center",
    flex: 1,
  },
  barValueText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 4,
  },
  bar: {
    width: 32,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 4,
  },
  barMonthText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 8,
  },
  gridLinesContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 0,
    bottom: 0,
    zIndex: 1,
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.divider,
  },

  // Table
  tableCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableHeader: {
    backgroundColor: colors.primaryDark,
    paddingVertical: 14,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRowEven: {
    backgroundColor: colors.white,
  },
  tableRowOdd: {
    backgroundColor: colors.lightBackground,
  },
  tableCell: {
    fontSize: 13,
    color: colors.text,
  },
  tableCellBold: {
    fontWeight: "700",
    color: colors.primary,
  },
  tableTotalRow: {
    backgroundColor: colors.primaryLight,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    paddingVertical: 14,
  },
  tableTotalText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primaryDark,
  },

  // Column widths
  colMonth: {
    flex: 1.2,
  },
  colOrders: {
    flex: 1,
    textAlign: "center",
  },
  colRevenue: {
    flex: 1.5,
    textAlign: "right",
  },
  colAvg: {
    flex: 1,
    textAlign: "right",
  },
});
