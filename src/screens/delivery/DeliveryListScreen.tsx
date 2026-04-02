// src/screens/delivery/DeliveryListScreen.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "../../components/Icon";
import { colors } from "../../theme/colors";
import { apiGetTodayAssignments } from "../../api";

const getStatusColor = (status: string) => {
  switch (status) {
    case "PENDING":
    case "CONFIRMED":
      return colors.warning;
    case "PREPARING":
    case "PICKED_UP":
    case "OUT_FOR_DELIVERY":
      return colors.info;
    case "DELIVERED":
      return colors.success;
    case "CANCELLED":
      return colors.error;
    default:
      return colors.textLight;
  }
};

export const DeliveryListScreen = ({ navigation }: any) => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAssignments = async () => {
    try {
      const data = await apiGetTodayAssignments();
      const list = Array.isArray(data) ? data : (data as any)?.assignments ?? [];
      // Sort by priority: in-progress first, then pending, then completed
      const priorityOrder: Record<string, number> = {
        OUT_FOR_DELIVERY: 0,
        PICKED_UP: 1,
        PREPARING: 2,
        CONFIRMED: 3,
        PENDING: 4,
        DELIVERED: 5,
        CANCELLED: 6,
      };
      list.sort(
        (a: any, b: any) =>
          (priorityOrder[a.status] ?? 99) - (priorityOrder[b.status] ?? 99)
      );
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

  const renderItem = ({ item }: { item: any }) => {
    const statusColor = getStatusColor(item.status);
    const orderId = item.orderId || item._id || item.id;
    const itemsCount = item.items?.length || 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("DeliveryDetail", { order: item })
        }
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>Order #{orderId}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${statusColor}20` },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
              {(item.status || "")
                .replace(/_/g, " ")
                .replace(/^\w/, (c: string) => c.toUpperCase())}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Icon name="person-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              {item.customerName || item.name || "Customer"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.address || "Address not available"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="cube-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              {itemsCount} item{itemsCount !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Icon name="chevron-forward" size={18} color={colors.textLight} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Today's Deliveries</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : assignments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="bicycle-outline" size={64} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No deliveries today</Text>
          <Text style={styles.emptySubtitle}>
            New assignments will appear here when assigned.
          </Text>
        </View>
      ) : (
        <FlatList
          data={assignments}
          keyExtractor={(item) => item._id || item.id || item.orderId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
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
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  orderId: {
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
  cardBody: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  cardFooter: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
});

export default DeliveryListScreen;
