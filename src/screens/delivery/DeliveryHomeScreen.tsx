// src/screens/delivery/DeliveryHomeScreen.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "../../components/Icon";
import { colors } from "../../theme/colors";
import {
  apiGetTodayAssignments,
  apiToggleAvailability,
} from "../../api";

export const DeliveryHomeScreen = ({ navigation }: any) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAssignments = async () => {
    try {
      const data = await apiGetTodayAssignments();
      const list = Array.isArray(data) ? data : (data as any)?.assignments ?? [];
      setAssignments(list);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load assignments.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAssignments();
  }, []);

  const handleToggleAvailability = async (value: boolean) => {
    setTogglingAvailability(true);
    try {
      await apiToggleAvailability(value);
      setIsAvailable(value);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update availability.");
    } finally {
      setTogglingAvailability(false);
    }
  };

  const completedCount = assignments.filter(
    (a) => a.status === "DELIVERED"
  ).length;
  const pendingCount = assignments.filter(
    (a) => a.status !== "DELIVERED" && a.status !== "CANCELLED"
  ).length;
  const inProgressAssignment = assignments.find(
    (a) => a.status === "OUT_FOR_DELIVERY" || a.status === "PICKED_UP"
  );

  const todayEarnings = assignments
    .filter((a) => a.status === "DELIVERED")
    .reduce((sum: number, a: any) => sum + (a.deliveryFee || 0), 0);

  const StatCard = ({
    label,
    value,
    iconName,
    iconColor,
  }: {
    label: string;
    value: string | number;
    iconName: string;
    iconColor: string;
  }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: `${iconColor}20` }]}>
        <Icon name={iconName} size={20} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Nandani Delivery</Text>
          <Text style={styles.headerSubtitle}>
            {isAvailable ? "You are online" : "You are offline"}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {togglingAvailability && (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ marginRight: 8 }}
            />
          )}
          <Switch
            value={isAvailable}
            onValueChange={handleToggleAvailability}
            disabled={togglingAvailability}
            trackColor={{ false: "#ccc", true: colors.success }}
            thumbColor={colors.white}
          />
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate("DeliveryProfile")}
          >
            <Icon name="person-circle-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard
            label="Assigned"
            value={assignments.length}
            iconName="list-outline"
            iconColor={colors.info}
          />
          <StatCard
            label="Completed"
            value={completedCount}
            iconName="checkmark-circle-outline"
            iconColor={colors.success}
          />
          <StatCard
            label="Pending"
            value={pendingCount}
            iconName="time-outline"
            iconColor={colors.warning}
          />
          <StatCard
            label="Earnings"
            value={`Rs.${todayEarnings}`}
            iconName="wallet-outline"
            iconColor={colors.primary}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate("DeliveryList")}
            >
              <Icon name="bicycle-outline" size={22} color={colors.white} />
              <Text style={styles.actionButtonText}>Start Deliveries</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.success }]}
              onPress={() => navigation.navigate("DeliveryEarnings")}
            >
              <Icon name="cash-outline" size={22} color={colors.white} />
              <Text style={styles.actionButtonText}>View Earnings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Current Assignment */}
        {inProgressAssignment && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Assignment</Text>
            <TouchableOpacity
              style={styles.currentCard}
              onPress={() =>
                navigation.navigate("DeliveryDetail", {
                  order: inProgressAssignment,
                })
              }
            >
              <View style={styles.currentCardHeader}>
                <Text style={styles.currentOrderId}>
                  Order #{inProgressAssignment.orderId || inProgressAssignment._id}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${colors.warning}20` },
                  ]}
                >
                  <Text style={[styles.statusText, { color: colors.warning }]}>
                    {(inProgressAssignment.status || "")
                      .replace(/_/g, " ")
                      .replace(/^\w/, (c: string) => c.toUpperCase())}
                  </Text>
                </View>
              </View>
              <Text style={styles.currentCustomer}>
                {inProgressAssignment.customerName || inProgressAssignment.name || "Customer"}
              </Text>
              <Text style={styles.currentAddress} numberOfLines={1}>
                {inProgressAssignment.address || "Address not available"}
              </Text>
              <View style={styles.currentFooter}>
                <Icon name="arrow-forward" size={16} color={colors.primary} />
                <Text style={styles.currentFooterText}>
                  Tap to view details
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More</Text>
          {[
            {
              label: "Settlements",
              icon: "receipt-outline",
              screen: "DeliverySettlement",
            },
            {
              label: "Leave Requests",
              icon: "calendar-outline",
              screen: "DeliveryLeave",
            },
          ].map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Icon name={item.icon} size={20} color={colors.text} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Icon name="chevron-forward" size={18} color={colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileButton: {
    marginLeft: 12,
  },
  scroll: {
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    backgroundColor: colors.white,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  currentCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 16,
  },
  currentCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  currentOrderId: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  currentCustomer: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  currentAddress: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  currentFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  currentFooterText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
});

export default DeliveryHomeScreen;
