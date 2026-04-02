// File: src/screens/SubscriptionScreen.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { Icon } from "../components/Icon";
import {
  apiGetSubscriptions,
  apiPauseSubscription,
  apiResumeSubscription,
  apiCancelSubscription,
} from "../api";

type SubscriptionStatus = "ACTIVE" | "PAUSED" | "CANCELLED";
type Frequency = "daily" | "alternate" | "weekly" | "custom";

interface SubscriptionItem {
  productName: string;
  qty: number;
}

interface Subscription {
  id?: string;
  _id?: string;
  items?: SubscriptionItem[];
  productName?: string;
  qty?: number;
  frequency: Frequency;
  deliverySlot?: string;
  status: SubscriptionStatus;
  nextDeliveryDate?: string;
}

export const SubscriptionScreen = ({ navigation }: any) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadSubscriptions = useCallback(async () => {
    try {
      const data = await apiGetSubscriptions();
      setSubscriptions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to load subscriptions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSubscriptions();
  };

  const getId = (sub: Subscription) => sub.id || sub._id || "";

  const getStatusColor = (status: SubscriptionStatus) => {
    switch (status) {
      case "ACTIVE":
        return colors.success;
      case "PAUSED":
        return colors.warning;
      case "CANCELLED":
        return colors.textLight;
      default:
        return colors.textLight;
    }
  };

  const getFrequencyLabel = (freq: Frequency) => {
    switch (freq) {
      case "daily":
        return "Daily";
      case "alternate":
        return "Alternate Days";
      case "weekly":
        return "Weekly";
      case "custom":
        return "Custom";
      default:
        return freq;
    }
  };

  const getSlotLabel = (slot?: string) => {
    if (!slot) return "Morning";
    switch (slot.toLowerCase()) {
      case "morning":
        return "Morning";
      case "afternoon":
        return "Afternoon";
      case "evening":
        return "Evening";
      default:
        return slot;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handlePause = (sub: Subscription) => {
    const id = getId(sub);
    if (!id) return;

    Alert.alert("Pause Subscription", "Pause this subscription?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Pause",
        onPress: async () => {
          setActionId(id);
          try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 7);
            await apiPauseSubscription(id, tomorrow.toISOString());
            setSubscriptions((prev) =>
              prev.map((s) =>
                getId(s) === id ? { ...s, status: "PAUSED" as SubscriptionStatus } : s
              )
            );
          } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to pause subscription.");
          } finally {
            setActionId(null);
          }
        },
      },
    ]);
  };

  const handleResume = async (sub: Subscription) => {
    const id = getId(sub);
    if (!id) return;

    setActionId(id);
    try {
      await apiResumeSubscription(id);
      setSubscriptions((prev) =>
        prev.map((s) =>
          getId(s) === id ? { ...s, status: "ACTIVE" as SubscriptionStatus } : s
        )
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to resume subscription.");
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = (sub: Subscription) => {
    const id = getId(sub);
    if (!id) return;

    Alert.alert(
      "Cancel Subscription",
      "Are you sure you want to cancel this subscription? This cannot be undone.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            setActionId(id);
            try {
              await apiCancelSubscription(id);
              setSubscriptions((prev) =>
                prev.map((s) =>
                  getId(s) === id
                    ? { ...s, status: "CANCELLED" as SubscriptionStatus }
                    : s
                )
              );
            } catch (err: any) {
              Alert.alert(
                "Error",
                err.message || "Failed to cancel subscription."
              );
            } finally {
              setActionId(null);
            }
          },
        },
      ]
    );
  };

  const renderSubscription = ({ item }: { item: Subscription }) => {
    const id = getId(item);
    const statusColor = getStatusColor(item.status);
    const isActioning = actionId === id;

    const itemsList = item.items && item.items.length > 0
      ? item.items
      : item.productName
        ? [{ productName: item.productName, qty: item.qty || 1 }]
        : [];

    return (
      <View style={styles.card}>
        {/* Items */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            {itemsList.map((si, idx) => (
              <Text key={idx} style={styles.itemText}>
                {si.productName} x{si.qty}
              </Text>
            ))}
            {itemsList.length === 0 && (
              <Text style={styles.itemText}>Subscription</Text>
            )}
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${statusColor}20` },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Icon name="repeat" size={14} color={colors.textSecondary} />
            <Text style={styles.detailText}>
              {getFrequencyLabel(item.frequency)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="time" size={14} color={colors.textSecondary} />
            <Text style={styles.detailText}>
              {getSlotLabel(item.deliverySlot)}
            </Text>
          </View>
        </View>

        {item.nextDeliveryDate && item.status !== "CANCELLED" && (
          <View style={styles.nextDeliveryRow}>
            <Icon name="calendar" size={14} color={colors.primary} />
            <Text style={styles.nextDeliveryText}>
              Next delivery: {formatDate(item.nextDeliveryDate)}
            </Text>
          </View>
        )}

        {/* Actions */}
        {item.status !== "CANCELLED" && (
          <View style={styles.actionsRow}>
            {item.status === "ACTIVE" ? (
              <TouchableOpacity
                style={styles.pauseButton}
                onPress={() => handlePause(item)}
                disabled={isActioning}
              >
                {isActioning ? (
                  <ActivityIndicator size="small" color={colors.warning} />
                ) : (
                  <>
                    <Icon name="pause" size={14} color={colors.warning} />
                    <Text style={[styles.actionText, { color: colors.warning }]}>
                      Pause
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : item.status === "PAUSED" ? (
              <TouchableOpacity
                style={styles.resumeButton}
                onPress={() => handleResume(item)}
                disabled={isActioning}
              >
                {isActioning ? (
                  <ActivityIndicator size="small" color={colors.success} />
                ) : (
                  <>
                    <Icon name="play" size={14} color={colors.success} />
                    <Text style={[styles.actionText, { color: colors.success }]}>
                      Resume
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.cancelSubButton}
              onPress={() => handleCancel(item)}
              disabled={isActioning}
            >
              <Icon name="close-circle" size={14} color={colors.error} />
              <Text style={[styles.actionText, { color: colors.error }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F8F8" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Subscriptions</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("CreateSubscription")}
          style={styles.newButton}
        >
          <Icon name="add" size={20} color={colors.white} />
          <Text style={styles.newButtonText}>New</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : subscriptions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="calendar-outline" size={80} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No subscriptions yet</Text>
          <Text style={styles.emptySubtitle}>
            Subscribe for daily milk delivery!
          </Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate("CreateSubscription")}
          >
            <Text style={styles.startButtonText}>Create Subscription</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={subscriptions}
          keyExtractor={(item) => getId(item)}
          renderItem={renderSubscription}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
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
    fontWeight: "700",
    color: colors.text,
  },
  newButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  newButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.white,
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
    alignItems: "flex-start",
    marginBottom: 12,
  },
  itemText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  detailsRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  nextDeliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 12,
  },
  nextDeliveryText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 12,
  },
  pauseButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warning,
    gap: 6,
  },
  resumeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.success,
    gap: 6,
  },
  cancelSubButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: "center",
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  startButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
});

export default SubscriptionScreen;
