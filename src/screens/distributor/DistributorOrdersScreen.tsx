// src/screens/distributor/DistributorOrdersScreen.tsx

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
import { apiGetDistributorOrders } from "../../api";

interface B2BOrderItem {
  product: string;
  name: string;
  qty: number;
  price: number;
  variantName?: string;
}

interface B2BOrder {
  _id?: string;
  id?: string;
  orderId: string;
  createdAt: string;
  items: B2BOrderItem[];
  total: number;
  status: "PENDING" | "CONFIRMED" | "DELIVERED" | "CANCELLED";
}

export const DistributorOrdersScreen = ({ navigation }: any) => {
  const [orders, setOrders] = useState<B2BOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<B2BOrder | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const data = await apiGetDistributorOrders();
      const items = Array.isArray(data) ? data : data?.orders ?? [];
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return colors.warning;
      case "CONFIRMED":
        return colors.info;
      case "DELIVERED":
        return colors.success;
      case "CANCELLED":
        return colors.error;
      default:
        return colors.textLight;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const renderOrder = ({ item }: { item: B2BOrder }) => {
    const statusColor = getStatusColor(item.status);
    const id = item.id || item._id || item.orderId;
    const itemsSummary = item.items
      .slice(0, 2)
      .map((i) => i.name)
      .join(", ");
    const moreCount = item.items.length > 2 ? item.items.length - 2 : 0;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => setSelectedOrder(item)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>Order #{item.orderId || id}</Text>
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${statusColor}20` },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status
                .toLowerCase()
                .replace(/_/g, " ")
                .replace(/^\w/, (c) => c.toUpperCase())}
            </Text>
          </View>
        </View>

        <Text style={styles.itemsSummary} numberOfLines={1}>
          {itemsSummary}
          {moreCount > 0 ? ` +${moreCount} more` : ""}
        </Text>

        <View style={styles.orderFooter}>
          <Text style={styles.itemCount}>{item.items.length} items</Text>
          <Text style={styles.totalAmount}>
            Rs. {item.total?.toFixed(2) ?? "0.00"}
          </Text>
        </View>
      </TouchableOpacity>
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
        <Text style={styles.headerTitle}>B2B Orders</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="receipt-outline" size={64} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>
            Your B2B order history will appear here
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("DistributorCatalog")}
            style={styles.shopButton}
          >
            <Text style={styles.shopButtonText}>Browse Catalog</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id || item._id || item.orderId}
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
              <Text style={styles.modalTitle}>
                Order #{selectedOrder?.orderId || selectedOrder?.id || selectedOrder?._id}
              </Text>
              <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Date</Text>
                  <Text style={styles.modalValue}>
                    {formatDate(selectedOrder.createdAt)}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Status</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: `${getStatusColor(selectedOrder.status)}20`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(selectedOrder.status) },
                      ]}
                    >
                      {selectedOrder.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.modalSectionTitle}>Items</Text>
                {selectedOrder.items.map((item, index) => (
                  <View
                    key={`${item.product}-${index}`}
                    style={styles.modalItem}
                  >
                    <Text style={styles.modalItemName}>
                      {item.name}
                      {item.variantName ? ` (${item.variantName})` : ""}
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
                    Rs. {selectedOrder.total?.toFixed(2) ?? "0.00"}
                  </Text>
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
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  itemsSummary: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  itemCount: {
    fontSize: 12,
    color: colors.textLight,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  modalBody: {
    padding: 16,
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  modalItemName: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  modalItemQty: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  modalItemPrice: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    minWidth: 80,
    textAlign: "right",
  },
  modalTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  modalTotalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  modalTotalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
  },
});
