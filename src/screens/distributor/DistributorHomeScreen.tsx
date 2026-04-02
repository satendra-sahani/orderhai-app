// src/screens/distributor/DistributorHomeScreen.tsx

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Modal,
  Dimensions,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../../components/Icon";
import { colors } from "../../theme/colors";
import {
  apiGetDistributorProfile,
  apiGetCreditSummary,
  apiGetB2BProducts,
  apiCreatePaymentOrder,
  apiVerifyPayment,
  apiRecordCreditPayment,
} from "../../api";
import RazorpayCheckout from "react-native-razorpay";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const DistributorHomeScreen = ({ navigation }: any) => {
  const [profile, setProfile] = useState<any>(null);
  const [credit, setCredit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);
  const [stockProducts, setStockProducts] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [profileData, creditData, productsData] = await Promise.all([
        apiGetDistributorProfile(),
        apiGetCreditSummary(),
        apiGetB2BProducts().catch(() => []),
      ]);
      setProfile(profileData);
      setCredit(creditData);

      // Process stock data
      const items: any[] = Array.isArray(productsData) ? productsData : productsData?.products ?? [];
      const stockItems = items.map((p: any) => {
        const variant = p.variants?.[0];
        return {
          _id: p._id,
          name: p.name,
          unit: p.unit || "",
          image: p.image,
          stock: variant?.stock ?? 0,
          category: p.category,
        };
      });
      setStockProducts(stockItems);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleCreditPayment = async () => {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }

    setPaying(true);
    try {
      const rzpOrder = await apiCreatePaymentOrder(amount, `credit_${Date.now()}`);

      const options = {
        description: "Credit Payment",
        currency: "INR",
        key: "rzp_test_MMGuj3e4zdYV1A",
        amount: rzpOrder.amount,
        name: "Nandani B2B",
        order_id: rzpOrder.order_id,
        prefill: {
          contact: profile?.phone || "",
          name: profile?.distributorProfile?.businessName || profile?.name || "",
        },
        theme: { color: colors.primary },
      };

      let paymentData: any;
      try {
        paymentData = await RazorpayCheckout.open(options);
      } catch (rzpErr: any) {
        setPaying(false);
        Alert.alert("Payment Cancelled", rzpErr?.description || "Payment was cancelled.");
        return;
      }

      await apiVerifyPayment({
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
      });

      const result = await apiRecordCreditPayment(amount, paymentData.razorpay_payment_id);

      setCredit((prev: any) => ({
        ...prev,
        creditUsed: result.creditUsed,
        creditAvailable: result.creditAvailable,
      }));

      setShowPayModal(false);
      setPayAmount("");
      Alert.alert("Payment Successful", `Rs. ${amount.toLocaleString("en-IN")} credited to your account.`);
      loadData();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  const creditUsed = credit?.creditUsed ?? 0;
  const creditLimit = credit?.creditLimit ?? 0;
  const creditAvailable = credit?.creditAvailable ?? creditLimit - creditUsed;
  const creditRatio = creditLimit > 0 ? creditUsed / creditLimit : 0;

  const getCreditBarColor = () => {
    if (creditRatio > 0.8) return colors.error;
    if (creditRatio > 0.5) return colors.warning;
    return "#27ae60";
  };

  const businessName = profile?.distributorProfile?.businessName || profile?.name || "Business";
  const firstLetter = businessName.charAt(0).toUpperCase();

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0d3b54" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0d3b54" />

      {/* Gradient-like Header */}
      <View style={styles.headerBg}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{firstLetter}</Text>
            </View>
            <View style={styles.headerTextBlock}>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.businessName} numberOfLines={1}>
                {businessName}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.notifButton}
              onPress={() => navigation.navigate("DistributorProfile")}
            >
              <Icon name="settings-outline" size={22} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.dateText}>{dateStr}</Text>

        {/* Credit Summary Card — overlapping header */}
        <View style={styles.creditCard}>
          <View style={styles.creditHeader}>
            <View style={styles.creditTitleRow}>
              <View style={styles.creditIconBg}>
                <Icon name="wallet-outline" size={18} color={colors.primary} />
              </View>
              <Text style={styles.creditTitle}>Credit Overview</Text>
            </View>
            {creditUsed > 0 && (
              <TouchableOpacity
                style={styles.payNowButton}
                onPress={() => setShowPayModal(true)}
              >
                <Text style={styles.payNowText}>Pay Now</Text>
                <Icon name="chevron-forward" size={14} color={colors.white} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.creditBarContainer}>
            <View style={styles.creditBarBackground}>
              <View
                style={[
                  styles.creditBarFill,
                  {
                    width: `${Math.max(Math.min(creditRatio * 100, 100), 2)}%`,
                    backgroundColor: getCreditBarColor(),
                  },
                ]}
              />
            </View>
            <View style={styles.creditBarLabels}>
              <Text style={styles.creditBarLabelLeft}>
                Used: <Text style={styles.creditBarValue}>Rs. {creditUsed.toLocaleString("en-IN")}</Text>
              </Text>
              <Text style={styles.creditBarLabelRight}>
                Limit: <Text style={styles.creditBarValue}>Rs. {creditLimit.toLocaleString("en-IN")}</Text>
              </Text>
            </View>
          </View>

          <View style={styles.availableRow}>
            <View>
              <Text style={styles.availableLabel}>Available Credit</Text>
              <Text style={styles.availableAmount}>
                Rs. {creditAvailable.toLocaleString("en-IN")}
              </Text>
            </View>
            <View style={[styles.creditBadge, creditRatio > 0.5 ? styles.creditBadgeWarn : styles.creditBadgeGood]}>
              <Text style={[styles.creditBadgeText, creditRatio > 0.5 ? styles.creditBadgeTextWarn : styles.creditBadgeTextGood]}>
                {creditRatio > 0.8 ? "Low Credit" : creditRatio > 0.5 ? "Moderate" : "Healthy"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: colors.primary }]}>
            <View style={[styles.statIconBg, { backgroundColor: "#eaf2f8" }]}>
              <Icon name="receipt-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{credit?.totalOrders ?? 0}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: colors.warning }]}>
            <View style={[styles.statIconBg, { backgroundColor: "#fff8e1" }]}>
              <Icon name="document-text-outline" size={20} color={colors.warning} />
            </View>
            <Text style={styles.statValue}>{credit?.pendingInvoices ?? 0}</Text>
            <Text style={styles.statLabel}>Pending Invoices</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: colors.error }]}>
            <View style={[styles.statIconBg, { backgroundColor: "#fce4ec" }]}>
              <Icon name="cash-outline" size={20} color={colors.error} />
            </View>
            <Text style={styles.statValue}>
              {(credit?.outstanding ?? 0) > 999
                ? `${((credit?.outstanding ?? 0) / 1000).toFixed(1)}k`
                : `Rs. ${credit?.outstanding ?? 0}`}
            </Text>
            <Text style={styles.statLabel}>Outstanding</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("DistributorCatalog")}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBg, { backgroundColor: "#eaf2f8" }]}>
              <Icon name="grid-outline" size={24} color={colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Browse{"\n"}Catalog</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("DistributorOrders")}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBg, { backgroundColor: "#e8f5e9" }]}>
              <Icon name="list-outline" size={24} color="#2e7d32" />
            </View>
            <Text style={styles.actionLabel}>My{"\n"}Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("DistributorInvoices")}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBg, { backgroundColor: "#fff8e1" }]}>
              <Icon name="document-text-outline" size={24} color="#f57f17" />
            </View>
            <Text style={styles.actionLabel}>View{"\n"}Invoices</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("DistributorAssignedOrders")}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBg, { backgroundColor: "#fce4ec" }]}>
              <Icon name="people-outline" size={24} color="#c62828" />
            </View>
            <Text style={styles.actionLabel}>Customer{"\n"}Orders</Text>
          </TouchableOpacity>
        </View>

        {/* Stock Overview */}
        <Text style={styles.sectionTitle}>Stock Overview</Text>
        <View style={styles.stockSummaryRow}>
          <View style={[styles.stockSummaryCard, { borderLeftColor: "#27ae60" }]}>
            <Text style={styles.stockSummaryValue}>
              {stockProducts.filter((p) => p.stock > 10).length}
            </Text>
            <Text style={styles.stockSummaryLabel}>In Stock</Text>
          </View>
          <View style={[styles.stockSummaryCard, { borderLeftColor: "#e67e22" }]}>
            <Text style={[styles.stockSummaryValue, { color: "#e67e22" }]}>
              {stockProducts.filter((p) => p.stock > 0 && p.stock <= 10).length}
            </Text>
            <Text style={styles.stockSummaryLabel}>Low Stock</Text>
          </View>
          <View style={[styles.stockSummaryCard, { borderLeftColor: colors.error }]}>
            <Text style={[styles.stockSummaryValue, { color: colors.error }]}>
              {stockProducts.filter((p) => p.stock <= 0).length}
            </Text>
            <Text style={styles.stockSummaryLabel}>Out of Stock</Text>
          </View>
        </View>

        {/* Low Stock / Out of Stock Items */}
        {stockProducts.filter((p) => p.stock <= 10).length > 0 && (
          <View style={styles.stockAlertCard}>
            <View style={styles.stockAlertHeader}>
              <Icon name="alert-circle-outline" size={18} color="#e67e22" />
              <Text style={styles.stockAlertTitle}>Attention Needed</Text>
            </View>
            {stockProducts
              .filter((p) => p.stock <= 10)
              .sort((a, b) => a.stock - b.stock)
              .slice(0, 8)
              .map((item) => (
                <View key={item._id} style={styles.stockItem}>
                  <View style={styles.stockItemLeft}>
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.stockItemImage} />
                    ) : (
                      <View style={[styles.stockItemImage, styles.stockItemImagePlaceholder]}>
                        <Icon name="cube-outline" size={16} color={colors.textLight} />
                      </View>
                    )}
                    <View style={styles.stockItemInfo}>
                      <Text style={styles.stockItemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.stockItemUnit}>{item.unit}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.stockBadge,
                      {
                        backgroundColor:
                          item.stock <= 0 ? "#fce4ec" : "#fff3e0",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stockBadgeText,
                        {
                          color: item.stock <= 0 ? colors.error : "#e65100",
                        },
                      ]}
                    >
                      {item.stock <= 0 ? "Out" : `${item.stock} left`}
                    </Text>
                  </View>
                </View>
              ))}
            {stockProducts.filter((p) => p.stock <= 10).length > 8 && (
              <TouchableOpacity
                style={styles.stockViewAll}
                onPress={() => navigation.navigate("DistributorCatalog")}
              >
                <Text style={styles.stockViewAllText}>
                  View all {stockProducts.filter((p) => p.stock <= 10).length} items
                </Text>
                <Icon name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* All Products Stock */}
        {stockProducts.length > 0 && (
          <View style={styles.stockListCard}>
            <View style={styles.stockListHeader}>
              <Text style={styles.stockListTitle}>All Products</Text>
              <Text style={styles.stockListCount}>{stockProducts.length} items</Text>
            </View>
            {stockProducts.slice(0, 10).map((item) => (
              <View key={item._id} style={styles.stockListItem}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.stockListImage} />
                ) : (
                  <View style={[styles.stockListImage, styles.stockListImagePlaceholder]}>
                    <Icon name="cube-outline" size={18} color={colors.textLight} />
                  </View>
                )}
                <View style={styles.stockListItemLeft}>
                  <Text style={styles.stockListItemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.stockListItemUnit}>{item.unit || item.category}</Text>
                </View>
                <View style={styles.stockListItemRight}>
                  <View
                    style={[
                      styles.stockBarBg,
                      {
                        backgroundColor:
                          item.stock <= 0
                            ? "#fce4ec"
                            : item.stock <= 10
                            ? "#fff3e0"
                            : "#e8f5e9",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.stockBarFill,
                        {
                          width: `${Math.min((item.stock / 100) * 100, 100)}%`,
                          backgroundColor:
                            item.stock <= 0
                              ? colors.error
                              : item.stock <= 10
                              ? "#e67e22"
                              : "#27ae60",
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.stockListQty,
                      {
                        color:
                          item.stock <= 0
                            ? colors.error
                            : item.stock <= 10
                            ? "#e67e22"
                            : "#27ae60",
                      },
                    ]}
                  >
                    {item.stock}
                  </Text>
                </View>
              </View>
            ))}
            {stockProducts.length > 10 && (
              <TouchableOpacity
                style={styles.stockViewAll}
                onPress={() => navigation.navigate("DistributorCatalog")}
              >
                <Text style={styles.stockViewAllText}>View full catalog</Text>
                <Icon name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Business Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="call-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.infoText}>{profile?.phone || "N/A"}</Text>
          </View>
          {profile?.distributorProfile?.gstin ? (
            <View style={styles.infoRow}>
              <Icon name="document-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.infoText}>GSTIN: {profile.distributorProfile.gstin}</Text>
            </View>
          ) : null}
          {profile?.distributorProfile?.territory ? (
            <View style={styles.infoRow}>
              <Icon name="location-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.infoText}>Territory: {profile.distributorProfile.territory}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Icon name="time-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              Payment Terms: {profile?.distributorProfile?.paymentTerms?.replace("_", " ") || "NET 15"}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Credit Payment Modal */}
      <Modal
        visible={showPayModal}
        transparent
        animationType="slide"
        onRequestClose={() => !paying && setShowPayModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Pay Credit Outstanding</Text>
            <Text style={styles.modalSubtitle}>
              Outstanding: Rs. {creditUsed.toLocaleString("en-IN")}
            </Text>

            <View style={styles.amountInputContainer}>
              <Text style={styles.amountPrefix}>Rs.</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
                value={payAmount}
                onChangeText={setPayAmount}
                editable={!paying}
              />
            </View>

            <View style={styles.quickAmounts}>
              {[1000, 5000, 10000].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[
                    styles.quickAmountChip,
                    payAmount === String(amt) && styles.quickAmountChipActive,
                  ]}
                  onPress={() => setPayAmount(String(amt))}
                  disabled={paying}
                >
                  <Text
                    style={[
                      styles.quickAmountText,
                      payAmount === String(amt) && styles.quickAmountTextActive,
                    ]}
                  >
                    Rs. {amt.toLocaleString("en-IN")}
                  </Text>
                </TouchableOpacity>
              ))}
              {creditUsed > 0 && (
                <TouchableOpacity
                  style={[
                    styles.quickAmountChip,
                    styles.quickAmountChipFull,
                    payAmount === String(creditUsed) && styles.quickAmountChipActive,
                  ]}
                  onPress={() => setPayAmount(String(creditUsed))}
                  disabled={paying}
                >
                  <Text
                    style={[
                      styles.quickAmountText,
                      payAmount === String(creditUsed) && styles.quickAmountTextActive,
                    ]}
                  >
                    Full Amount
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowPayModal(false);
                  setPayAmount("");
                }}
                disabled={paying}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalPayButton, paying && { opacity: 0.7 }]}
                onPress={handleCreditPayment}
                disabled={paying}
              >
                {paying ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Icon name="card-outline" size={18} color={colors.white} />
                    <Text style={styles.modalPayText}>Pay via Razorpay</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Header
  headerBg: {
    backgroundColor: colors.primary,
    paddingBottom: 60,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.white,
  },
  headerTextBlock: {
    marginLeft: 12,
    flex: 1,
  },
  greeting: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  businessName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.white,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  dateText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    paddingHorizontal: 20,
    marginTop: 4,
  },

  // Credit Card (overlapping)
  creditCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  creditHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  creditTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  creditIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#eaf2f8",
    alignItems: "center",
    justifyContent: "center",
  },
  creditTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  payNowButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 4,
  },
  payNowText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.white,
  },
  creditBarContainer: {
    marginBottom: 14,
  },
  creditBarBackground: {
    height: 8,
    backgroundColor: "#eef2f5",
    borderRadius: 4,
    overflow: "hidden",
  },
  creditBarFill: {
    height: 8,
    borderRadius: 4,
  },
  creditBarLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  creditBarLabelLeft: {
    fontSize: 11,
    color: colors.textLight,
  },
  creditBarLabelRight: {
    fontSize: 11,
    color: colors.textLight,
  },
  creditBarValue: {
    fontWeight: "600",
    color: colors.textSecondary,
  },
  availableRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#f0f2f5",
  },
  availableLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  availableAmount: {
    fontSize: 22,
    fontWeight: "800",
    color: "#27ae60",
    marginTop: 2,
  },
  creditBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  creditBadgeGood: {
    backgroundColor: "#e8f5e9",
  },
  creditBadgeWarn: {
    backgroundColor: "#fff3e0",
  },
  creditBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  creditBadgeTextGood: {
    color: "#2e7d32",
  },
  creditBadgeTextWarn: {
    color: "#e65100",
  },

  scrollContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderLeftWidth: 3,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: colors.textSecondary,
    marginTop: 3,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  // Quick Actions
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 18,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 20,
  },

  // Stock Overview
  stockSummaryRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  stockSummaryCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderLeftWidth: 3,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  stockSummaryValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#27ae60",
  },
  stockSummaryLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  stockAlertCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  stockAlertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  stockAlertTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#e65100",
  },
  stockItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  stockItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  stockItemImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  stockItemImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  stockItemInfo: {
    flex: 1,
  },
  stockItemName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  stockItemUnit: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 1,
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  stockViewAll: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingTop: 12,
    marginTop: 4,
  },
  stockViewAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  stockListCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  stockListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  stockListTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  stockListCount: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  stockListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    gap: 10,
  },
  stockListImage: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
  },
  stockListImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  stockListItemLeft: {
    flex: 1,
    marginRight: 12,
  },
  stockListItemName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  stockListItemUnit: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 1,
  },
  stockListItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: 100,
  },
  stockBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  stockBarFill: {
    height: 6,
    borderRadius: 3,
  },
  stockListQty: {
    fontSize: 13,
    fontWeight: "700",
    minWidth: 28,
    textAlign: "right",
  },

  // Business Info
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 18,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    gap: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ddd",
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  amountPrefix: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textSecondary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    paddingVertical: 14,
  },
  quickAmounts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 28,
  },
  quickAmountChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
    backgroundColor: "#f5f7fa",
    borderWidth: 1,
    borderColor: "#e8ecef",
  },
  quickAmountChipActive: {
    backgroundColor: "#eaf2f8",
    borderColor: colors.primary,
  },
  quickAmountChipFull: {
    borderColor: colors.primary,
  },
  quickAmountText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  quickAmountTextActive: {
    color: colors.primary,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  modalPayButton: {
    flex: 2,
    flexDirection: "row",
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  modalPayText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
});
