// src/screens/distributor/DistributorAssignedOrdersScreen.tsx

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
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../../components/Icon";
import { colors } from "../../theme/colors";
import { apiGetAssignedOrders, apiUpdateAssignedOrderStatus } from "../../api";

interface OrderItem {
  product: string;
  name: string;
  qty: number;
  price: number;
  variantName?: string;
}

interface AssignedOrder {
  _id: string;
  orderId: string;
  createdAt: string;
  name: string;
  phone: string;
  address: string;
  items: OrderItem[];
  total: number;
  subtotal: number;
  deliveryFee: number;
  paymentMethod: "COD" | "ONLINE";
  status: string;
}

const STATUS_FLOW: Record<string, string> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};

const STATUS_ACTION_LABEL: Record<string, string> = {
  PENDING: "Accept Order",
  CONFIRMED: "Start Preparing",
  PREPARING: "Out for Delivery",
  OUT_FOR_DELIVERY: "Mark Delivered",
};

export const DistributorAssignedOrdersScreen = ({ navigation }: any) => {
  const [orders, setOrders] = useState<AssignedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AssignedOrder | null>(null);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");

  const loadOrders = useCallback(async () => {
    try {
      const data = await apiGetAssignedOrders();
      const items = Array.isArray(data) ? data : [];
      setOrders(items);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to load orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrders();
  }, [loadOrders]);

  const handleStatusUpdate = async (order: AssignedOrder) => {
    const nextStatus = STATUS_FLOW[order.status];
    if (!nextStatus) return;

    setUpdating(true);
    try {
      await apiUpdateAssignedOrderStatus(order.orderId, nextStatus);
      // Update local state
      setOrders((prev) =>
        prev.map((o) =>
          o._id === order._id ? { ...o, status: nextStatus } : o
        )
      );
      if (selectedOrder?._id === order._id) {
        setSelectedOrder({ ...order, status: nextStatus });
      }
      Alert.alert("Success", `Order updated to ${nextStatus.replace(/_/g, " ")}`);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to update order.");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async (order: AssignedOrder) => {
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          setUpdating(true);
          try {
            await apiUpdateAssignedOrderStatus(order.orderId, "CANCELLED");
            setOrders((prev) =>
              prev.map((o) =>
                o._id === order._id ? { ...o, status: "CANCELLED" } : o
              )
            );
            setSelectedOrder(null);
          } catch (err: any) {
            Alert.alert("Error", err.message || "Unable to cancel order.");
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return colors.warning;
      case "CONFIRMED": return colors.info;
      case "PREPARING": return "#FF9800";
      case "OUT_FOR_DELIVERY": return colors.primary;
      case "DELIVERED": return colors.success;
      case "CANCELLED": return colors.error;
      default: return colors.textLight;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const activeStatuses = ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"];
  const filteredOrders = orders.filter((o) =>
    activeTab === "active"
      ? activeStatuses.includes(o.status)
      : !activeStatuses.includes(o.status)
  );

  const renderOrder = ({ item }: { item: AssignedOrder }) => {
    const statusColor = getStatusColor(item.status);
    const nextAction = STATUS_ACTION_LABEL[item.status];

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => setSelectedOrder(item)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderId}>#{item.orderId}</Text>
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status.replace(/_/g, " ")}
            </Text>
          </View>
        </View>

        <View style={styles.customerInfo}>
          <Icon name="person-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.customerName}>{item.name || "Customer"}</Text>
          <Text style={styles.paymentBadge}>
            {item.paymentMethod}
          </Text>
        </View>

        <Text style={styles.addressText} numberOfLines={1}>
          {item.address}
        </Text>

        <View style={styles.orderFooter}>
          <Text style={styles.itemCount}>
            {item.items.length} item{item.items.length > 1 ? "s" : ""}
          </Text>
          <Text style={styles.totalAmount}>
            Rs. {item.total?.toFixed(2)}
          </Text>
        </View>

        {nextAction && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: statusColor }]}
            onPress={() => handleStatusUpdate(item)}
            disabled={updating}
          >
            <Text style={styles.actionBtnText}>{nextAction}</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F8F8" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Orders</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "active" && styles.tabActive]}
          onPress={() => setActiveTab("active")}
        >
          <Text style={[styles.tabText, activeTab === "active" && styles.tabTextActive]}>
            Active ({orders.filter((o) => activeStatuses.includes(o.status)).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "completed" && styles.tabActive]}
          onPress={() => setActiveTab("completed")}
        >
          <Text style={[styles.tabText, activeTab === "completed" && styles.tabTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="receipt-outline" size={64} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No {activeTab} orders</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Order Detail Modal */}
      <Modal
        visible={selectedOrder !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedOrder(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order #{selectedOrder?.orderId}</Text>
              <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Customer</Text>
                  <Text style={styles.modalValue}>{selectedOrder.name || "N/A"}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Phone</Text>
                  <Text style={styles.modalValue}>{selectedOrder.phone}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Address</Text>
                  <Text style={[styles.modalValue, { flex: 1, textAlign: "right" }]}>
                    {selectedOrder.address}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Payment</Text>
                  <Text style={styles.modalValue}>{selectedOrder.paymentMethod}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(selectedOrder.status)}20` }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(selectedOrder.status) }]}>
                      {selectedOrder.status.replace(/_/g, " ")}
                    </Text>
                  </View>
                </View>

                <Text style={styles.modalSectionTitle}>Items</Text>
                {selectedOrder.items.map((item, index) => (
                  <View key={`${item.product}-${index}`} style={styles.modalItem}>
                    <Text style={styles.modalItemName}>
                      {item.name}{item.variantName ? ` (${item.variantName})` : ""}
                    </Text>
                    <Text style={styles.modalItemQty}>x{item.qty}</Text>
                    <Text style={styles.modalItemPrice}>
                      Rs. {(item.price * item.qty).toFixed(2)}
                    </Text>
                  </View>
                ))}

                <View style={styles.modalTotalRow}>
                  <Text style={styles.modalTotalLabel}>Total</Text>
                  <Text style={styles.modalTotalValue}>
                    Rs. {selectedOrder.total?.toFixed(2)}
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  {STATUS_ACTION_LABEL[selectedOrder.status] && (
                    <TouchableOpacity
                      style={[styles.modalActionBtn, { backgroundColor: getStatusColor(selectedOrder.status) }]}
                      onPress={() => handleStatusUpdate(selectedOrder)}
                      disabled={updating}
                    >
                      {updating ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <Text style={styles.modalActionText}>
                          {STATUS_ACTION_LABEL[selectedOrder.status]}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                  {selectedOrder.status !== "DELIVERED" && selectedOrder.status !== "CANCELLED" && (
                    <TouchableOpacity
                      style={[styles.modalActionBtn, styles.cancelBtn]}
                      onPress={() => handleCancel(selectedOrder)}
                      disabled={updating}
                    >
                      <Text style={styles.cancelBtnText}>Cancel Order</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "600", color: colors.text },
  placeholder: { width: 40 },
  tabBar: {
    flexDirection: "row", backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: "500", color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: "700" },
  listContent: { padding: 16 },
  orderCard: {
    backgroundColor: colors.white, borderRadius: 12, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: colors.border,
  },
  orderHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 8,
  },
  orderId: { fontSize: 15, fontWeight: "700", color: colors.text },
  orderDate: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: "600" },
  customerInfo: {
    flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4,
  },
  customerName: { fontSize: 13, color: colors.text, flex: 1 },
  paymentBadge: {
    fontSize: 11, fontWeight: "700", color: colors.primary,
    backgroundColor: `${colors.primary}15`, paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 4,
  },
  addressText: { fontSize: 12, color: colors.textSecondary, marginBottom: 10 },
  orderFooter: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.divider,
  },
  itemCount: { fontSize: 12, color: colors.textLight },
  totalAmount: { fontSize: 18, fontWeight: "700", color: colors.primary },
  actionBtn: {
    marginTop: 12, paddingVertical: 10, borderRadius: 8, alignItems: "center",
  },
  actionBtnText: { fontSize: 14, fontWeight: "700", color: colors.white },
  emptyContainer: {
    flex: 1, alignItems: "center", justifyContent: "center", padding: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginTop: 16 },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: colors.white, borderTopLeftRadius: 20,
    borderTopRightRadius: 20, maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 16, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
  modalBody: { padding: 16 },
  modalRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 12,
  },
  modalLabel: { fontSize: 14, color: colors.textSecondary },
  modalValue: { fontSize: 14, fontWeight: "600", color: colors.text },
  modalSectionTitle: {
    fontSize: 15, fontWeight: "600", color: colors.text,
    marginTop: 12, marginBottom: 8, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: colors.divider,
  },
  modalItem: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  modalItemName: { flex: 1, fontSize: 13, color: colors.text },
  modalItemQty: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },
  modalItemPrice: {
    fontSize: 13, fontWeight: "600", color: colors.text,
    minWidth: 80, textAlign: "right",
  },
  modalTotalRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.divider,
  },
  modalTotalLabel: { fontSize: 16, fontWeight: "600", color: colors.textSecondary },
  modalTotalValue: { fontSize: 20, fontWeight: "700", color: colors.primary },
  modalActions: { marginTop: 20, gap: 10, paddingBottom: 20 },
  modalActionBtn: { paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  modalActionText: { fontSize: 15, fontWeight: "700", color: colors.white },
  cancelBtn: {
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.error,
  },
  cancelBtnText: { fontSize: 15, fontWeight: "700", color: colors.error },
});
