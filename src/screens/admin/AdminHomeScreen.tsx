// src/screens/admin/AdminHomeScreen.tsx
"use client";

import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "../../components/Icon";
import { colors } from "../../theme/colors";
import {
  DASHBOARD_STATS,
  DUMMY_ORDERS,
  ORDER_STATUS_COLORS,
  type AdminOrder,
  type OrderStatus,
} from "../../data/adminDummyData";

const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  return date.toLocaleDateString("en-IN", options);
};

const formatCurrency = (amount: number): string => {
  return `\u20B9${amount.toLocaleString("en-IN")}`;
};

const formatStatusLabel = (status: OrderStatus): string => {
  return status.replace(/_/g, " ");
};

interface StatCardProps {
  title: string;
  value: string;
  iconName: string;
  iconBgColor: string;
}

const StatCard = ({ title, value, iconName, iconBgColor }: StatCardProps) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconCircle, { backgroundColor: iconBgColor }]}>
      <Icon name={iconName} size={22} color={colors.white} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{title}</Text>
  </View>
);

interface QuickActionProps {
  label: string;
  iconName: string;
  onPress: () => void;
}

const QuickAction = ({ label, iconName, onPress }: QuickActionProps) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.quickActionIcon}>
      <Icon name={iconName} size={24} color={colors.primary} />
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

export const AdminHomeScreen = ({ navigation }: any) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const recentOrders = DUMMY_ORDERS.slice(0, 5);

  const quickActions = [
    { label: "Orders", icon: "receipt-outline", screen: "AdminOrders" },
    { label: "Products", icon: "cube-outline", screen: "AdminProducts" },
    { label: "Distributors", icon: "business-outline", screen: "AdminDistributors" },
    { label: "Delivery", icon: "bicycle-outline", screen: "AdminDelivery" },
    { label: "Revenue", icon: "stats-chart-outline", screen: "AdminRevenue" },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Nandini Admin</Text>
          <Text style={styles.headerSubtitle}>{formatDate(new Date())}</Text>
        </View>
        <TouchableOpacity
          style={styles.headerBellBtn}
          onPress={() => {}}
          activeOpacity={0.7}
        >
          <Icon name="notifications" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Orders"
            value={DASHBOARD_STATS.totalOrders.toLocaleString("en-IN")}
            iconName="receipt"
            iconBgColor={colors.info}
          />
          <StatCard
            title="Today Revenue"
            value={formatCurrency(DASHBOARD_STATS.todayRevenue)}
            iconName="cash"
            iconBgColor={colors.success}
          />
          <StatCard
            title="Active Users"
            value={DASHBOARD_STATS.activeUsers.toLocaleString("en-IN")}
            iconName="people"
            iconBgColor={colors.accent}
          />
          <StatCard
            title="Delivery Boys"
            value={DASHBOARD_STATS.activeDeliveryBoys.toString()}
            iconName="bicycle"
            iconBgColor="#9C27B0"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            {quickActions.map((action) => (
              <QuickAction
                key={action.label}
                label={action.label}
                iconName={action.icon}
                onPress={() => navigation.navigate(action.screen)}
              />
            ))}
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <View style={styles.recentOrdersCard}>
            {recentOrders.map((order: AdminOrder, index: number) => (
              <TouchableOpacity
                key={order.id}
                style={[
                  styles.orderRow,
                  index < recentOrders.length - 1 && styles.orderRowBorder,
                ]}
                onPress={() => navigation.navigate("AdminOrders")}
                activeOpacity={0.7}
              >
                <View style={styles.orderRowLeft}>
                  <Text style={styles.orderRowId}>{order.orderId}</Text>
                  <Text style={styles.orderRowName}>{order.customerName}</Text>
                </View>
                <View style={styles.orderRowRight}>
                  <View style={styles.orderRowMeta}>
                    <Text style={styles.orderRowTotal}>
                      {formatCurrency(order.total)}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: ORDER_STATUS_COLORS[order.status] },
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {formatStatusLabel(order.status)}
                      </Text>
                    </View>
                  </View>
                  <Icon
                    name="chevron-forward"
                    size={18}
                    color={colors.textLight}
                  />
                </View>
              </TouchableOpacity>
            ))}
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  headerBellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.lightBackground,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  statCard: {
    width: "48%",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickAction: {
    alignItems: "center",
    width: "18%",
    marginBottom: 8,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 11,
    color: colors.text,
    textAlign: "center",
    fontWeight: "500",
  },
  recentOrdersCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  orderRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  orderRowLeft: {
    flex: 1,
    marginRight: 12,
  },
  orderRowId: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  orderRowName: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  orderRowRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderRowMeta: {
    alignItems: "flex-end",
    marginRight: 8,
  },
  orderRowTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.white,
    textTransform: "capitalize",
  },
});
