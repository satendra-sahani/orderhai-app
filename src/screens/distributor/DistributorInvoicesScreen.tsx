// src/screens/distributor/DistributorInvoicesScreen.tsx

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
import { apiGetDistributorInvoices } from "../../api";

type InvoiceStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";

interface InvoiceItem {
  name: string;
  variant?: string;
  qty: number;
  unitPrice: number;
  total: number;
  gst?: number;
}

interface Invoice {
  _id?: string;
  id?: string;
  invoiceNumber: string;
  createdAt: string;
  dueDate: string;
  grandTotal: number;
  subtotal?: number;
  gstTotal?: number;
  paidAmount?: number;
  status: InvoiceStatus;
  items?: InvoiceItem[];
  order?: { orderId?: string; status?: string; total?: number };
}

export const DistributorInvoicesScreen = ({ navigation }: any) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const loadInvoices = useCallback(async () => {
    try {
      const data = await apiGetDistributorInvoices();
      const items = Array.isArray(data) ? data : data?.invoices ?? [];
      setInvoices(items);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to load invoices.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadInvoices();
  }, [loadInvoices]);

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case "UNPAID":
        return colors.error;
      case "PARTIALLY_PAID":
        return colors.warning;
      case "PAID":
        return colors.success;
      case "OVERDUE":
        return colors.error;
      default:
        return colors.textLight;
    }
  };

  const getStatusStyle = (status: InvoiceStatus) => {
    if (status === "OVERDUE") {
      return { fontWeight: "700" as const };
    }
    return {};
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatStatusLabel = (status: InvoiceStatus) => {
    return status
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  const renderInvoice = ({ item }: { item: Invoice }) => {
    const statusColor = getStatusColor(item.status);
    const id = item.id || item._id || item.invoiceNumber;

    return (
      <TouchableOpacity
        style={styles.invoiceCard}
        onPress={() => setSelectedInvoice(item)}
        activeOpacity={0.7}
      >
        <View style={styles.invoiceHeader}>
          <View>
            <Text style={styles.invoiceNumber}>
              Invoice #{item.invoiceNumber || id}
            </Text>
            <Text style={styles.invoiceDate}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${statusColor}20` },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: statusColor },
                getStatusStyle(item.status),
              ]}
            >
              {formatStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.invoiceBody}>
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceLabel}>Amount</Text>
            <Text style={styles.invoiceAmount}>
              Rs. {item.grandTotal?.toFixed(2) ?? "0.00"}
            </Text>
          </View>
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceLabel}>Due Date</Text>
            <Text
              style={[
                styles.invoiceDueDate,
                item.status === "OVERDUE" && { color: colors.error, fontWeight: "700" },
              ]}
            >
              {formatDate(item.dueDate)}
            </Text>
          </View>
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
        <Text style={styles.headerTitle}>Invoices</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : invoices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="document-text-outline" size={64} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No invoices yet</Text>
          <Text style={styles.emptySubtitle}>
            Your invoices will appear here after placing orders
          </Text>
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) =>
            item.id || item._id || item.invoiceNumber
          }
          renderItem={renderInvoice}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Invoice Detail Modal */}
      <Modal
        visible={selectedInvoice !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedInvoice(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Invoice #{selectedInvoice?.invoiceNumber || selectedInvoice?.id || selectedInvoice?._id}
              </Text>
              <TouchableOpacity onPress={() => setSelectedInvoice(null)}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedInvoice && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Date</Text>
                  <Text style={styles.modalValue}>
                    {formatDate(selectedInvoice.createdAt)}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Due Date</Text>
                  <Text style={styles.modalValue}>
                    {formatDate(selectedInvoice.dueDate)}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Status</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: `${getStatusColor(selectedInvoice.status)}20`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(selectedInvoice.status) },
                        getStatusStyle(selectedInvoice.status),
                      ]}
                    >
                      {formatStatusLabel(selectedInvoice.status)}
                    </Text>
                  </View>
                </View>
                {selectedInvoice.order?.orderId && (
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Order ID</Text>
                    <Text style={styles.modalValue}>
                      {selectedInvoice.order.orderId}
                    </Text>
                  </View>
                )}

                <View style={styles.modalAmountSection}>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Total Amount</Text>
                    <Text style={styles.modalAmountValue}>
                      Rs. {selectedInvoice.grandTotal?.toFixed(2) ?? "0.00"}
                    </Text>
                  </View>
                  {(selectedInvoice.paidAmount ?? 0) > 0 && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Paid</Text>
                      <Text style={[styles.modalValue, { color: colors.success }]}>
                        Rs. {(selectedInvoice.paidAmount ?? 0).toFixed(2)}
                      </Text>
                    </View>
                  )}
                  {selectedInvoice.grandTotal > 0 && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Balance Due</Text>
                      <Text style={[styles.modalAmountValue, { color: colors.error }]}>
                        Rs.{" "}
                        {(
                          selectedInvoice.grandTotal -
                          (selectedInvoice.paidAmount ?? 0)
                        ).toFixed(2)}
                      </Text>
                    </View>
                  )}
                </View>

                {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                  <>
                    <Text style={styles.modalSectionTitle}>Items</Text>
                    {selectedInvoice.items.map((item, index) => (
                      <View
                        key={`${item.name}-${index}`}
                        style={styles.modalItem}
                      >
                        <Text style={styles.modalItemName}>{item.name}</Text>
                        <Text style={styles.modalItemQty}>x{item.qty}</Text>
                        <Text style={styles.modalItemPrice}>
                          Rs. {(item.total ?? item.unitPrice * item.qty).toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </>
                )}
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
  invoiceCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  invoiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  invoiceNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  invoiceDate: {
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
  invoiceBody: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  invoiceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  invoiceLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  invoiceAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  invoiceDueDate: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
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
    textAlign: "center",
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
  modalAmountSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  modalAmountValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
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
});
