// src/screens/admin/AdminOrdersScreen.tsx
"use client";

import { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  FlatList,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "../../components/Icon";
import { colors } from "../../theme/colors";
import {
  DUMMY_ORDERS,
  ORDER_STATUS_COLORS,
  type AdminOrder,
  type OrderStatus,
} from "../../data/adminDummyData";

type FilterTab = "ALL" | OrderStatus;

const FILTER_TABS: FilterTab[] = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const formatFilterLabel = (tab: FilterTab): string => {
  if (tab === "ALL") return "All";
  return tab
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
};

const formatCurrency = (amount: number): string => {
  return `\u20B9${amount.toLocaleString("en-IN")}`;
};

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const AdminOrdersScreen = ({ navigation }: any) => {
  const [orders, setOrders] = useState<AdminOrder[]>(() =>
    DUMMY_ORDERS.map((o) => ({ ...o, items: o.items.map((i) => ({ ...i })) }))
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (activeTab !== "ALL") {
      result = result.filter((o) => o.status === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.orderId.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, activeTab, searchQuery]);

  const openDetail = (order: AdminOrder) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const closeDetail = () => {
    setModalVisible(false);
    setSelectedOrder(null);
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    setSelectedOrder((prev) =>
      prev && prev.id === orderId ? { ...prev, status: newStatus } : prev
    );
  };

  const renderOrderCard = ({ item }: { item: AdminOrder }) => {
    const itemCount = item.items.reduce((sum, i) => sum + i.qty, 0);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => openDetail(item)}
        activeOpacity={0.7}
      >
        {/* Top row */}
        <View style={styles.cardTopRow}>
          <Text style={styles.cardOrderId}>{item.orderId}</Text>
          <View
            style={[
              styles.cardStatusBadge,
              { backgroundColor: ORDER_STATUS_COLORS[item.status] },
            ]}
          >
            <Text style={styles.cardStatusText}>
              {formatFilterLabel(item.status)}
            </Text>
          </View>
        </View>

        {/* Middle */}
        <Text style={styles.cardCustomer}>{item.customerName}</Text>
        <View style={styles.cardMidRow}>
          <Text style={styles.cardMeta}>
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </Text>
          <Text style={styles.cardDot}>{"\u2022"}</Text>
          <Text style={styles.cardMeta}>{formatDate(item.createdAt)}</Text>
        </View>

        {/* Bottom row */}
        <View style={styles.cardBottomRow}>
          <Text style={styles.cardTotal}>{formatCurrency(item.total)}</Text>
          <View style={styles.paymentBadge}>
            <Text style={styles.paymentBadgeText}>{item.paymentMethod}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailModal = () => {
    if (!selectedOrder) return null;

    const transitions = STATUS_TRANSITIONS[selectedOrder.status];

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeDetail}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={["top", "bottom"]}>
          <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

          {/* Modal header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeDetail} activeOpacity={0.7}>
              <Icon name="close" size={26} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedOrder.orderId}</Text>
            <View style={{ width: 26 }} />
          </View>

          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={styles.modalBodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Current Status */}
            <View style={styles.modalStatusRow}>
              <Text style={styles.modalSectionLabel}>Status</Text>
              <View
                style={[
                  styles.modalStatusBadge,
                  { backgroundColor: ORDER_STATUS_COLORS[selectedOrder.status] },
                ]}
              >
                <Text style={styles.modalStatusText}>
                  {formatFilterLabel(selectedOrder.status)}
                </Text>
              </View>
            </View>

            {/* Customer Section */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Customer</Text>
              <View style={styles.modalInfoCard}>
                <View style={styles.modalInfoRow}>
                  <Icon name="person" size={18} color={colors.textSecondary} />
                  <Text style={styles.modalInfoText}>
                    {selectedOrder.customerName}
                  </Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Icon name="call" size={18} color={colors.textSecondary} />
                  <Text style={styles.modalInfoText}>
                    {selectedOrder.customerPhone}
                  </Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Icon name="location" size={18} color={colors.textSecondary} />
                  <Text style={styles.modalInfoText}>
                    {selectedOrder.address}
                  </Text>
                </View>
              </View>
            </View>

            {/* Items Section */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Items</Text>
              <View style={styles.modalInfoCard}>
                {selectedOrder.items.map((item, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.modalItemRow,
                      idx < selectedOrder.items.length - 1 &&
                        styles.modalItemRowBorder,
                    ]}
                  >
                    <View style={styles.modalItemLeft}>
                      <Text style={styles.modalItemName}>{item.name}</Text>
                      <Text style={styles.modalItemUnit}>{item.unit}</Text>
                    </View>
                    <Text style={styles.modalItemQtyPrice}>
                      {item.qty} x {formatCurrency(item.price)}
                    </Text>
                  </View>
                ))}
                <View style={styles.modalTotalRow}>
                  <Text style={styles.modalTotalLabel}>Total</Text>
                  <Text style={styles.modalTotalValue}>
                    {formatCurrency(selectedOrder.total)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Payment & Date */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Payment</Text>
              <View style={styles.modalInfoCard}>
                <View style={styles.modalInfoRow}>
                  <Icon name="card" size={18} color={colors.textSecondary} />
                  <Text style={styles.modalInfoText}>
                    {selectedOrder.paymentMethod}
                  </Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Icon name="time" size={18} color={colors.textSecondary} />
                  <Text style={styles.modalInfoText}>
                    {formatDate(selectedOrder.createdAt)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Status Update Buttons */}
            {transitions.length > 0 && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Update Status</Text>
                <View style={styles.statusButtonsRow}>
                  {transitions.map((nextStatus) => {
                    const isCancelAction = nextStatus === "CANCELLED";
                    return (
                      <TouchableOpacity
                        key={nextStatus}
                        style={[
                          styles.statusButton,
                          {
                            backgroundColor: isCancelAction
                              ? colors.error
                              : colors.primary,
                          },
                        ]}
                        onPress={() =>
                          handleStatusChange(selectedOrder.id, nextStatus)
                        }
                        activeOpacity={0.7}
                      >
                        <Text style={styles.statusButtonText}>
                          {formatFilterLabel(nextStatus)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={styles.headerBackBtn}
        >
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Orders</Text>
        <View style={styles.headerCountBadge}>
          <Text style={styles.headerCountText}>{filteredOrders.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrap}>
          <Icon name="search" size={20} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by order ID or customer..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  isActive ? styles.tabActive : styles.tabInactive,
                ]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabText,
                    isActive ? styles.tabTextActive : styles.tabTextInactive,
                  ]}
                >
                  {formatFilterLabel(tab)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="receipt-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyText}>No orders found</Text>
          </View>
        }
      />

      {/* Detail Modal */}
      {renderDetailModal()}
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
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
  },
  headerCountBadge: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: "center",
  },
  headerCountText: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.white,
  },
  searchContainer: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    paddingVertical: 0,
  },
  tabsContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 4,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabInactive: {
    backgroundColor: colors.primaryLight,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
  },
  tabTextActive: {
    color: colors.white,
  },
  tabTextInactive: {
    color: colors.primary,
  },
  listContent: {
    backgroundColor: colors.lightBackground,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    flexGrow: 1,
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardOrderId: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.text,
  },
  cardStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardStatusText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.white,
  },
  cardCustomer: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  cardMidRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardDot: {
    fontSize: 12,
    color: colors.textLight,
    marginHorizontal: 6,
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 10,
  },
  cardTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
  },
  paymentBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paymentBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primary,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textLight,
    marginTop: 12,
  },

  // ─── Modal ──────────────────────────────────────────────────
  modalSafeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  modalHeader: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
  },
  modalBody: {
    flex: 1,
    backgroundColor: colors.lightBackground,
  },
  modalBodyContent: {
    padding: 16,
    paddingBottom: 40,
  },
  modalStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalSectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  modalStatusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  modalStatusText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.white,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
  },
  modalInfoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  modalInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  modalInfoText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 10,
    flex: 1,
  },
  modalItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  modalItemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalItemLeft: {
    flex: 1,
    marginRight: 12,
  },
  modalItemName: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "500",
  },
  modalItemUnit: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalItemQtyPrice: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  modalTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 4,
  },
  modalTotalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  modalTotalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
  },
  statusButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },
});
