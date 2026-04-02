// src/screens/admin/AdminDeliveryBoysScreen.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  TextInput,
  ScrollView,
  Modal,
  Switch,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "../../components/Icon";
import { colors } from "../../theme/colors";
import {
  DUMMY_DELIVERY_BOYS,
  DUMMY_ORDERS,
  ORDER_STATUS_COLORS,
  type AdminDeliveryBoy,
  type AdminOrder,
  type OrderStatus,
} from "../../data/adminDummyData";

type FilterTab = "ALL" | "ONLINE" | "OFFLINE" | "ON_DELIVERY";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "ONLINE", label: "Online" },
  { key: "OFFLINE", label: "Offline" },
  { key: "ON_DELIVERY", label: "On Delivery" },
];

const formatStatusLabel = (status: OrderStatus): string => {
  return status.replace(/_/g, " ");
};

const getVehicleIcon = (type: string): string => {
  switch (type) {
    case "BIKE":
      return "bicycle";
    case "CYCLE":
      return "bicycle";
    case "AUTO":
      return "car-outline";
    default:
      return "bicycle";
  }
};

const getVehicleBadgeColor = (type: string): string => {
  switch (type) {
    case "BIKE":
      return colors.info;
    case "CYCLE":
      return colors.success;
    case "AUTO":
      return "#9C27B0";
    default:
      return colors.textSecondary;
  }
};

export const AdminDeliveryBoysScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");
  const [deliveryBoys, setDeliveryBoys] = useState<AdminDeliveryBoy[]>(
    () => [...DUMMY_DELIVERY_BOYS]
  );
  const [selectedBoy, setSelectedBoy] = useState<AdminDeliveryBoy | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const filteredBoys = useMemo(() => {
    let result = deliveryBoys;

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (boy) =>
          boy.name.toLowerCase().includes(q) ||
          boy.phone.includes(q) ||
          boy.area.toLowerCase().includes(q)
      );
    }

    // Apply tab filter
    switch (activeFilter) {
      case "ONLINE":
        result = result.filter((b) => b.isOnline && b.activeOrders === 0);
        break;
      case "OFFLINE":
        result = result.filter((b) => !b.isOnline);
        break;
      case "ON_DELIVERY":
        result = result.filter((b) => b.isOnline && b.activeOrders > 0);
        break;
      default:
        break;
    }

    return result;
  }, [deliveryBoys, searchQuery, activeFilter]);

  const filterCounts = useMemo(() => {
    const all = deliveryBoys.length;
    const online = deliveryBoys.filter(
      (b) => b.isOnline && b.activeOrders === 0
    ).length;
    const offline = deliveryBoys.filter((b) => !b.isOnline).length;
    const onDelivery = deliveryBoys.filter(
      (b) => b.isOnline && b.activeOrders > 0
    ).length;
    return { ALL: all, ONLINE: online, OFFLINE: offline, ON_DELIVERY: onDelivery };
  }, [deliveryBoys]);

  const toggleOnline = useCallback((id: string, value: boolean) => {
    setDeliveryBoys((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, isOnline: value, activeOrders: value ? b.activeOrders : 0 }
          : b
      )
    );
  }, []);

  const getActiveOrders = useCallback(
    (boyName: string): AdminOrder[] => {
      // Match delivery boy name partially (first name + initial)
      return DUMMY_ORDERS.filter((order) => {
        if (!order.deliveryBoy) return false;
        return boyName.toLowerCase().startsWith(
          order.deliveryBoy.split(" ")[0].toLowerCase()
        );
      });
    },
    []
  );

  const openModal = useCallback((boy: AdminDeliveryBoy) => {
    setSelectedBoy(boy);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setSelectedBoy(null);
  }, []);

  const renderDeliveryBoyCard = useCallback(
    ({ item }: { item: AdminDeliveryBoy }) => {
      const initial = item.name.charAt(0).toUpperCase();

      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => openModal(item)}
          activeOpacity={0.7}
        >
          <View style={styles.cardTopRow}>
            {/* Avatar */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>

            {/* Info */}
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardPhone}>{item.phone}</Text>
              <Text style={styles.cardArea}>{item.area}</Text>
            </View>

            {/* Online toggle */}
            <View style={styles.toggleContainer}>
              <Switch
                value={item.isOnline}
                onValueChange={(val) => toggleOnline(item.id, val)}
                trackColor={{ false: colors.border, true: colors.success }}
                thumbColor={item.isOnline ? colors.white : "#f4f3f4"}
                ios_backgroundColor={colors.border}
              />
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Icon name="star" size={14} color={colors.accent} />
              <Text style={styles.statText}>{item.rating}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Icon name="checkmark-done" size={14} color={colors.success} />
              <Text style={styles.statText}>{item.totalDeliveries} deliveries</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Icon name="cube-outline" size={14} color={colors.primary} />
              <Text style={styles.statText}>{item.activeOrders} active</Text>
            </View>
          </View>

          {/* Bottom row: status + vehicle badge */}
          <View style={styles.cardBottomRow}>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: item.isOnline
                      ? colors.success
                      : colors.error,
                  },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: item.isOnline ? colors.success : colors.error },
                ]}
              >
                {item.isOnline ? "Online" : "Offline"}
              </Text>
            </View>

            <View
              style={[
                styles.vehicleBadge,
                { backgroundColor: getVehicleBadgeColor(item.vehicleType) },
              ]}
            >
              <Icon
                name={getVehicleIcon(item.vehicleType)}
                size={12}
                color={colors.white}
              />
              <Text style={styles.vehicleBadgeText}>{item.vehicleType}</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [openModal, toggleOnline]
  );

  const renderDetailModal = () => {
    if (!selectedBoy) return null;

    const currentBoy = deliveryBoys.find((b) => b.id === selectedBoy.id) || selectedBoy;
    const activeOrders = getActiveOrders(currentBoy.name);

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer} edges={["top"]}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>{currentBoy.name}</Text>
            <TouchableOpacity onPress={closeModal} activeOpacity={0.7}>
              <Icon name="close" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Section */}
            <View style={styles.modalProfileCard}>
              <View style={styles.modalAvatarLarge}>
                <Text style={styles.modalAvatarText}>
                  {currentBoy.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.modalProfileInfo}>
                <View style={styles.modalInfoRow}>
                  <Icon name="call" size={16} color={colors.textSecondary} />
                  <Text style={styles.modalInfoText}>{currentBoy.phone}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Icon name="location" size={16} color={colors.textSecondary} />
                  <Text style={styles.modalInfoText}>{currentBoy.area}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Icon
                    name={getVehicleIcon(currentBoy.vehicleType)}
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.modalInfoText}>
                    {currentBoy.vehicleType}
                  </Text>
                </View>
              </View>
            </View>

            {/* Stats Cards */}
            <View style={styles.modalStatsRow}>
              <View style={styles.modalStatCard}>
                <Icon name="star" size={20} color={colors.accent} />
                <Text style={styles.modalStatValue}>{currentBoy.rating}</Text>
                <Text style={styles.modalStatLabel}>Rating</Text>
              </View>
              <View style={styles.modalStatCard}>
                <Icon name="checkmark-done" size={20} color={colors.success} />
                <Text style={styles.modalStatValue}>
                  {currentBoy.totalDeliveries}
                </Text>
                <Text style={styles.modalStatLabel}>Deliveries</Text>
              </View>
              <View style={styles.modalStatCard}>
                <Icon name="cube-outline" size={20} color={colors.primary} />
                <Text style={styles.modalStatValue}>
                  {currentBoy.activeOrders}
                </Text>
                <Text style={styles.modalStatLabel}>Active</Text>
              </View>
            </View>

            {/* Online Toggle */}
            <View style={styles.modalToggleRow}>
              <Text style={styles.modalToggleLabel}>Online Status</Text>
              <View style={styles.modalToggleRight}>
                <Text
                  style={[
                    styles.modalToggleStatus,
                    {
                      color: currentBoy.isOnline
                        ? colors.success
                        : colors.error,
                    },
                  ]}
                >
                  {currentBoy.isOnline ? "Online" : "Offline"}
                </Text>
                <Switch
                  value={currentBoy.isOnline}
                  onValueChange={(val) => {
                    toggleOnline(currentBoy.id, val);
                    setSelectedBoy({ ...currentBoy, isOnline: val });
                  }}
                  trackColor={{ false: colors.border, true: colors.success }}
                  thumbColor={currentBoy.isOnline ? colors.white : "#f4f3f4"}
                  ios_backgroundColor={colors.border}
                />
              </View>
            </View>

            {/* Active Deliveries Section */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>
                Active Deliveries ({activeOrders.length})
              </Text>

              {activeOrders.length === 0 ? (
                <View style={styles.emptyOrders}>
                  <Icon
                    name="cube-outline"
                    size={40}
                    color={colors.textLight}
                  />
                  <Text style={styles.emptyOrdersText}>
                    No active deliveries
                  </Text>
                </View>
              ) : (
                activeOrders.map((order) => (
                  <View key={order.id} style={styles.modalOrderCard}>
                    <View style={styles.modalOrderTop}>
                      <Text style={styles.modalOrderId}>{order.orderId}</Text>
                      <View
                        style={[
                          styles.modalStatusBadge,
                          {
                            backgroundColor:
                              ORDER_STATUS_COLORS[order.status],
                          },
                        ]}
                      >
                        <Text style={styles.modalStatusBadgeText}>
                          {formatStatusLabel(order.status)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.modalOrderCustomer}>
                      {order.customerName}
                    </Text>
                    <View style={styles.modalOrderAddressRow}>
                      <Icon
                        name="location-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.modalOrderAddress}>
                        {order.address}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
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
          style={styles.backBtn}
        >
          <Icon name="arrow-back" size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Boys</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{deliveryBoys.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Icon name="search" size={18} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone, or area..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Icon name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => setActiveFilter(tab.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    isActive && styles.filterTabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
                <View
                  style={[
                    styles.filterTabCount,
                    isActive && styles.filterTabCountActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterTabCountText,
                      isActive && styles.filterTabCountTextActive,
                    ]}
                  >
                    {filterCounts[tab.key]}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={filteredBoys}
        renderItem={renderDeliveryBoyCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="people-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyStateText}>No delivery boys found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your search or filter
            </Text>
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
  countBadge: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: "center",
  },
  countBadgeText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },

  // Search
  searchContainer: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    paddingVertical: 0,
  },

  // Filter Tabs
  filterContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.lightBackground,
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginRight: 6,
  },
  filterTabTextActive: {
    color: colors.white,
  },
  filterTabCount: {
    backgroundColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: "center",
  },
  filterTabCountActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  filterTabCountText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  filterTabCountTextActive: {
    color: colors.white,
  },

  // List
  list: {
    flex: 1,
    backgroundColor: colors.lightBackground,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },

  // Card
  card: {
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
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  cardPhone: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardArea: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 1,
  },
  toggleContainer: {
    marginLeft: 8,
  },

  // Stats row
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: colors.border,
    marginHorizontal: 10,
  },

  // Bottom row
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  vehicleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  vehicleBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.white,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 4,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.primary,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
    flex: 1,
  },
  modalScroll: {
    flex: 1,
    backgroundColor: colors.lightBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalScrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // Modal Profile
  modalProfileCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  modalAvatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  modalAvatarText: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.white,
  },
  modalProfileInfo: {
    flex: 1,
    gap: 6,
  },
  modalInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalInfoText: {
    fontSize: 14,
    color: colors.text,
  },

  // Modal Stats
  modalStatsRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 10,
  },
  modalStatCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  modalStatValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 6,
  },
  modalStatLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Modal Toggle
  modalToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  modalToggleLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  modalToggleRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalToggleStatus: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Modal Section
  modalSection: {
    marginTop: 20,
  },
  modalSectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },

  // Modal Order Card
  modalOrderCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  modalOrderTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  modalOrderId: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  modalStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  modalStatusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.white,
    textTransform: "capitalize",
  },
  modalOrderCustomer: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "500",
    marginBottom: 4,
  },
  modalOrderAddressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
  },
  modalOrderAddress: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },

  // Empty orders
  emptyOrders: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 32,
  },
  emptyOrdersText: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
  },
});
