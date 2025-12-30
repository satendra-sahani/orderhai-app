// File: src/screens/OrdersScreen.tsx
"use client";

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { Icon } from "../components/Icon";
import {
  apiGetOrders,
  apiCancelOrder,
  type ApiOrder,
  type OrderStatus,
} from "../api";
import { useEffect, useState } from "react";

export const OrdersScreen = ({ navigation }: any) => {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] =
    useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await apiGetOrders();
      setOrders(data);
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.message || "Unable to load orders. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return colors.warning;
      case "CONFIRMED":
      case "PREPARING":
      case "OUT_FOR_DELIVERY":
        return colors.primary;
      case "DELIVERED":
        return colors.success;
      case "CANCELLED":
        return colors.error;
      default:
        return colors.textLight;
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return "⏱️";
      case "CONFIRMED":
      case "PREPARING":
      case "OUT_FOR_DELIVERY":
        return "🚚";
      case "DELIVERED":
        return "✅";
      case "CANCELLED":
        return "❌";
      default:
        return "❓";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCancel = (order: ApiOrder) => {
    if (order.status !== "PENDING") return;

    Alert.alert(
      "Cancel order",
      "Are you sure you want to cancel this order?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, cancel",
          style: "destructive",
          onPress: async () => {
            const id = order.id || order._id || "";
            if (!id) return;
            setCancellingId(id);
            try {
              const res = await apiCancelOrder(id);
              setOrders(prev =>
                prev.map(o =>
                  (o.id || o._id) === id ? res.order : o
                )
              );
            } catch (err: any) {
              Alert.alert(
                "Error",
                err.message ||
                  "Unable to cancel order. Please try again."
              );
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  const renderOrder = ({ item }: { item: ApiOrder }) => {
    const statusColor = getStatusColor(item.status);
    const statusIcon = getStatusIcon(item.status);
    const id = item.id || item._id || item.orderId;

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>
              Order #{item.orderId || id}
            </Text>
            <Text style={styles.orderDate}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${statusColor}20` },
            ]}
          >
            <Text style={styles.statusEmoji}>{statusIcon}</Text>
            <Text
              style={[
                styles.statusText,
                { color: statusColor },
              ]}
            >
              {item.status
                .toString()
                .toLowerCase()
                .replace(/_/g, " ")
                .replace(/^\w/, c => c.toUpperCase())}
            </Text>
          </View>
        </View>

        <View style={styles.orderItems}>
          {item.items.map((orderItem, index) => (
            <View
              key={`${orderItem.product}-${index}`}
              style={styles.orderItem}
            >
              <Text style={styles.orderItemName}>
                {orderItem.name}{" "}
                {orderItem.variantName
                  ? `(${orderItem.variantName})`
                  : ""}
              </Text>
              <Text style={styles.orderItemQuantity}>
                x{orderItem.qty}
              </Text>
              <Text style={styles.orderItemPrice}>
                ₹ {orderItem.price * orderItem.qty}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>
              Total Amount
            </Text>
            <Text style={styles.totalAmount}>
              ₹ {item.total.toFixed(2)}
            </Text>
          </View>

          {item.status === "PENDING" && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancel(item)}
              disabled={cancellingId === id}
            >
              {cancellingId === id ? (
                <ActivityIndicator
                  size="small"
                  color={colors.error}
                />
              ) : (
                <Text style={styles.cancelButtonText}>
                  Cancel Order
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8F8F8"
      />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon
            name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>
            Your order history will appear here
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Home")}
            style={styles.shopButton}
          >
            <Text style={styles.shopButtonText}>
              Start Shopping
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item =>
            item.id || item._id || item.orderId
          }
          renderItem={renderOrder}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  orderId: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  statusEmoji: {
    fontSize: 14,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  orderItemName: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  orderItemQuantity: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  orderItemPrice: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    minWidth: 60,
    textAlign: "right",
  },
  orderFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  cancelButton: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.error,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: "center",
  },
  shopButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  shopButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
});
