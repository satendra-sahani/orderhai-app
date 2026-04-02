// src/screens/admin/AdminDistributorsScreen.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  FlatList,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "../../components/Icon";
import { colors } from "../../theme/colors";
import {
  DUMMY_DISTRIBUTORS,
  DISTRIBUTOR_STATUS_COLORS,
  type AdminDistributor,
  type DistributorStatus,
} from "../../data/adminDummyData";

type StatusFilter = "ALL" | DistributorStatus;

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "ACTIVE", label: "Active" },
  { key: "PENDING", label: "Pending" },
  { key: "SUSPENDED", label: "Suspended" },
];

const getCreditBarColor = (ratio: number): string => {
  if (ratio < 0.5) return colors.success;
  if (ratio < 0.8) return colors.warning;
  return colors.error;
};

export const AdminDistributorsScreen = ({ navigation }: any) => {
  const [distributors, setDistributors] = useState<AdminDistributor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDistributor, setSelectedDistributor] =
    useState<AdminDistributor | null>(null);
  const [editCreditLimit, setEditCreditLimit] = useState("");

  useEffect(() => {
    setDistributors([...DUMMY_DISTRIBUTORS]);
  }, []);

  const filteredDistributors = distributors.filter((d) => {
    const matchesSearch =
      searchQuery === "" ||
      d.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.gstin.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenDetail = (distributor: AdminDistributor) => {
    setSelectedDistributor(distributor);
    setEditCreditLimit(String(distributor.creditLimit));
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedDistributor(null);
    setEditCreditLimit("");
  };

  const handleApprove = (id: string) => {
    setDistributors((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, status: "ACTIVE" as DistributorStatus, creditLimit: 100000 }
          : d
      )
    );
    const updated = distributors.find((d) => d.id === id);
    if (updated) {
      setSelectedDistributor({
        ...updated,
        status: "ACTIVE",
        creditLimit: 100000,
      });
      setEditCreditLimit("100000");
    }
    Alert.alert("Approved", "Distributor has been approved and activated.");
  };

  const handleReject = (id: string) => {
    Alert.alert(
      "Confirm Rejection",
      "Are you sure you want to reject this distributor?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => {
            setDistributors((prev) => prev.filter((d) => d.id !== id));
            handleCloseModal();
          },
        },
      ]
    );
  };

  const handleSaveCreditLimit = (id: string) => {
    const newLimit = parseFloat(editCreditLimit);
    if (isNaN(newLimit) || newLimit <= 0) {
      Alert.alert("Validation", "Please enter a valid credit limit.");
      return;
    }
    setDistributors((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, creditLimit: newLimit } : d
      )
    );
    const updated = distributors.find((d) => d.id === id);
    if (updated) {
      setSelectedDistributor({ ...updated, creditLimit: newLimit });
    }
    Alert.alert("Saved", "Credit limit has been updated.");
  };

  const handleSuspend = (id: string) => {
    Alert.alert(
      "Confirm Suspension",
      "Are you sure you want to suspend this distributor?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Suspend",
          style: "destructive",
          onPress: () => {
            setDistributors((prev) =>
              prev.map((d) =>
                d.id === id
                  ? { ...d, status: "SUSPENDED" as DistributorStatus }
                  : d
              )
            );
            const updated = distributors.find((d) => d.id === id);
            if (updated) {
              setSelectedDistributor({ ...updated, status: "SUSPENDED" });
            }
          },
        },
      ]
    );
  };

  const handleActivate = (id: string) => {
    setDistributors((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, status: "ACTIVE" as DistributorStatus }
          : d
      )
    );
    const updated = distributors.find((d) => d.id === id);
    if (updated) {
      setSelectedDistributor({ ...updated, status: "ACTIVE" });
    }
    Alert.alert("Activated", "Distributor has been re-activated.");
  };

  const renderStatusTab = (tab: { key: StatusFilter; label: string }) => {
    const isActive = statusFilter === tab.key;
    const count =
      tab.key === "ALL"
        ? distributors.length
        : distributors.filter((d) => d.status === tab.key).length;

    return (
      <TouchableOpacity
        key={tab.key}
        style={[
          styles.statusTab,
          isActive ? styles.statusTabActive : styles.statusTabInactive,
        ]}
        onPress={() => setStatusFilter(tab.key)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.statusTabText,
            isActive
              ? styles.statusTabTextActive
              : styles.statusTabTextInactive,
          ]}
        >
          {tab.label} ({count})
        </Text>
      </TouchableOpacity>
    );
  };

  const renderDistributorCard = ({ item }: { item: AdminDistributor }) => {
    const creditRatio =
      item.creditLimit > 0 ? item.creditUsed / item.creditLimit : 0;
    const creditBarColor = getCreditBarColor(creditRatio);
    const statusColor = DISTRIBUTOR_STATUS_COLORS[item.status];

    return (
      <TouchableOpacity
        style={styles.distributorCard}
        onPress={() => handleOpenDetail(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.cardNameSection}>
            <Text style={styles.businessName}>{item.businessName}</Text>
            <Text style={styles.ownerName}>{item.ownerName}</Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}
          >
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardInfoRow}>
          <View style={styles.cardInfoItem}>
            <Icon name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.cardInfoText}>{item.area}</Text>
          </View>
          <View style={styles.cardInfoItem}>
            <Icon name="document-text-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.cardInfoText}>{item.gstin}</Text>
          </View>
        </View>

        {item.creditLimit > 0 && (
          <View style={styles.creditSection}>
            <View style={styles.creditBarTrack}>
              <View
                style={[
                  styles.creditBarFill,
                  {
                    width: `${Math.min(creditRatio * 100, 100)}%`,
                    backgroundColor: creditBarColor,
                  },
                ]}
              />
            </View>
            <Text style={styles.creditText}>
              {"\u20B9"}{item.creditUsed.toLocaleString("en-IN")} / {"\u20B9"}
              {item.creditLimit.toLocaleString("en-IN")}
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.ordersCount}>
            <Icon name="receipt-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.ordersCountText}>
              {item.totalOrders} orders
            </Text>
          </View>
          <Icon name="chevron-forward" size={18} color={colors.textLight} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailModal = () => {
    if (!selectedDistributor) return null;
    const d = selectedDistributor;
    const creditRatio =
      d.creditLimit > 0 ? d.creditUsed / d.creditLimit : 0;
    const creditBarColor = getCreditBarColor(creditRatio);
    const statusColor = DISTRIBUTOR_STATUS_COLORS[d.status];

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{d.businessName}</Text>
                <TouchableOpacity onPress={handleCloseModal}>
                  <Icon name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Status Badge */}
              <View
                style={[
                  styles.modalStatusBadge,
                  { backgroundColor: statusColor + "20" },
                ]}
              >
                <Text
                  style={[styles.modalStatusBadgeText, { color: statusColor }]}
                >
                  {d.status}
                </Text>
              </View>

              {/* Info Section */}
              <View style={styles.detailSection}>
                <DetailRow
                  icon="person-circle-outline"
                  label="Owner"
                  value={d.ownerName}
                />
                <DetailRow icon="call" label="Phone" value={d.phone} />
                <DetailRow icon="location-outline" label="Area" value={d.area} />
                <DetailRow
                  icon="document-text-outline"
                  label="GSTIN"
                  value={d.gstin}
                />
                <DetailRow
                  icon="time-outline"
                  label="Joined"
                  value={d.joinedAt}
                />
                <DetailRow
                  icon="receipt-outline"
                  label="Total Orders"
                  value={String(d.totalOrders)}
                />
              </View>

              {/* Credit Usage */}
              {d.creditLimit > 0 && (
                <View style={styles.detailCreditSection}>
                  <Text style={styles.detailSectionTitle}>Credit Usage</Text>
                  <View style={styles.creditBarTrackLarge}>
                    <View
                      style={[
                        styles.creditBarFillLarge,
                        {
                          width: `${Math.min(creditRatio * 100, 100)}%`,
                          backgroundColor: creditBarColor,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.creditTextLarge}>
                    {"\u20B9"}{d.creditUsed.toLocaleString("en-IN")} / {"\u20B9"}
                    {d.creditLimit.toLocaleString("en-IN")} (
                    {Math.round(creditRatio * 100)}%)
                  </Text>
                </View>
              )}

              {/* Actions per Status */}
              {d.status === "PENDING" && (
                <View style={styles.actionSection}>
                  <Text style={styles.detailSectionTitle}>Pending Approval</Text>
                  <View style={styles.pendingActions}>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => handleApprove(d.id)}
                      activeOpacity={0.7}
                    >
                      <Icon
                        name="checkmark-circle"
                        size={20}
                        color={colors.white}
                      />
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleReject(d.id)}
                      activeOpacity={0.7}
                    >
                      <Icon
                        name="close-circle-outline"
                        size={20}
                        color={colors.white}
                      />
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {d.status === "ACTIVE" && (
                <View style={styles.actionSection}>
                  {/* Credit Limit Adjustment */}
                  <Text style={styles.detailSectionTitle}>
                    Adjust Credit Limit
                  </Text>
                  <View style={styles.creditEditRow}>
                    <TextInput
                      style={styles.creditEditInput}
                      value={editCreditLimit}
                      onChangeText={setEditCreditLimit}
                      keyboardType="numeric"
                      placeholder="Credit limit"
                      placeholderTextColor={colors.textLight}
                    />
                    <TouchableOpacity
                      style={styles.creditSaveButton}
                      onPress={() => handleSaveCreditLimit(d.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.creditSaveButtonText}>Save</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Suspend */}
                  <TouchableOpacity
                    style={styles.suspendButton}
                    onPress={() => handleSuspend(d.id)}
                    activeOpacity={0.7}
                  >
                    <Icon name="warning" size={18} color={colors.white} />
                    <Text style={styles.suspendButtonText}>
                      Suspend Distributor
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {d.status === "SUSPENDED" && (
                <View style={styles.actionSection}>
                  <TouchableOpacity
                    style={styles.activateButton}
                    onPress={() => handleActivate(d.id)}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name="checkmark-circle"
                      size={20}
                      color={colors.white}
                    />
                    <Text style={styles.activateButtonText}>
                      Re-activate Distributor
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
          style={styles.headerBackButton}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Distributors</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>
            {filteredDistributors.length}
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Icon name="search" size={20} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search distributors..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Icon name="close" size={20} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status Filter Tabs */}
      <View style={styles.statusTabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusTabsContent}
        >
          {STATUS_TABS.map(renderStatusTab)}
        </ScrollView>
      </View>

      {/* Distributor List */}
      <FlatList
        data={filteredDistributors}
        renderItem={renderDistributorCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="people-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyText}>No distributors found</Text>
          </View>
        }
      />

      {/* Detail Modal */}
      {renderDetailModal()}
    </SafeAreaView>
  );
};

// --- Helper Component ---

const DetailRow = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) => (
  <View style={detailRowStyles.row}>
    <View style={detailRowStyles.labelSection}>
      <Icon name={icon} size={16} color={colors.textSecondary} />
      <Text style={detailRowStyles.label}>{label}</Text>
    </View>
    <Text style={detailRowStyles.value}>{value}</Text>
  </View>
);

const detailRowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  labelSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  value: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "600",
    maxWidth: "50%",
    textAlign: "right",
  },
});

// --- Main Styles ---

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerBackButton: {
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
    fontWeight: "700",
    color: colors.white,
  },
  headerBadge: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: "center",
  },
  headerBadgeText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },

  // Search
  searchContainer: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchInputWrapper: {
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

  // Status Tabs
  statusTabsContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 14,
  },
  statusTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  statusTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusTabActive: {
    backgroundColor: colors.primary,
  },
  statusTabInactive: {
    backgroundColor: colors.primaryLight,
  },
  statusTabText: {
    fontSize: 13,
    fontWeight: "600",
  },
  statusTabTextActive: {
    color: colors.white,
  },
  statusTabTextInactive: {
    color: colors.primary,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    backgroundColor: colors.white,
  },

  // Distributor Card
  distributorCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  cardNameSection: {
    flex: 1,
    marginRight: 12,
  },
  businessName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  ownerName: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  cardInfoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 12,
  },
  cardInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardInfoText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Credit Bar
  creditSection: {
    marginBottom: 12,
  },
  creditBarTrack: {
    height: 6,
    backgroundColor: colors.divider,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  creditBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  creditText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
  },

  // Card Footer
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ordersCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ordersCountText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },

  // Empty
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  modalStatusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalStatusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // Detail Section
  detailSection: {
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
  },

  // Credit Large
  detailCreditSection: {
    marginBottom: 20,
  },
  creditBarTrackLarge: {
    height: 10,
    backgroundColor: colors.divider,
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 6,
  },
  creditBarFillLarge: {
    height: "100%",
    borderRadius: 5,
  },
  creditTextLarge: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
  },

  // Action Section
  actionSection: {
    marginTop: 8,
    marginBottom: 8,
  },

  // Pending Actions
  pendingActions: {
    flexDirection: "row",
    gap: 12,
  },
  approveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: 12,
  },
  approveButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.error,
    paddingVertical: 14,
    borderRadius: 12,
  },
  rejectButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },

  // Active Actions
  creditEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  creditEditInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.lightBackground,
  },
  creditSaveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  creditSaveButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  suspendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.error,
    paddingVertical: 14,
    borderRadius: 12,
  },
  suspendButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },

  // Suspended Actions
  activateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: 12,
  },
  activateButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
});
