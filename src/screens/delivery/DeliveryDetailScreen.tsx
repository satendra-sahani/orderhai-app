// src/screens/delivery/DeliveryDetailScreen.tsx
"use client";

import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "../../components/Icon";
import { colors } from "../../theme/colors";
import { apiUpdateDeliveryStatus } from "../../api";

const STATUS_FLOW = ["CONFIRMED", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"];

const getNextAction = (status: string) => {
  switch (status) {
    case "CONFIRMED":
    case "PREPARING":
      return { label: "Picked Up", nextStatus: "PICKED_UP" };
    case "PICKED_UP":
      return { label: "In Transit", nextStatus: "OUT_FOR_DELIVERY" };
    case "OUT_FOR_DELIVERY":
      return { label: "Deliver", nextStatus: "DELIVERED" };
    default:
      return null;
  }
};

export const DeliveryDetailScreen = ({ navigation, route }: any) => {
  const order = route.params?.order;
  const [currentStatus, setCurrentStatus] = useState(order?.status || "CONFIRMED");
  const [updating, setUpdating] = useState(false);

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Order not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const orderId = order.orderId || order._id || order.id;
  const nextAction = getNextAction(currentStatus);

  const handleCall = () => {
    const phone = order.phone || order.customerPhone;
    if (!phone) {
      Alert.alert("No phone", "Customer phone number is not available.");
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const handleNavigate = () => {
    const lat = order.latitude || order.location?.lat;
    const lng = order.longitude || order.location?.lng;
    if (!lat || !lng) {
      Alert.alert("No location", "Customer location coordinates are not available.");
      return;
    }
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `google.navigation:q=${lat},${lng}`,
    });
    if (url) Linking.openURL(url);
  };

  const handleStatusUpdate = async () => {
    if (!nextAction) return;

    // If delivering, open OTP screen
    if (nextAction.nextStatus === "DELIVERED") {
      navigation.navigate("DeliveryOtp", { order: { ...order, status: currentStatus } });
      return;
    }

    setUpdating(true);
    try {
      await apiUpdateDeliveryStatus(orderId, nextAction.nextStatus);
      setCurrentStatus(nextAction.nextStatus);
      Alert.alert("Updated", `Status changed to ${nextAction.nextStatus.replace(/_/g, " ")}`);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  const statusIndex = STATUS_FLOW.indexOf(currentStatus);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{orderId}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={styles.scroll}>
        {/* Status Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Progress</Text>
          <View style={styles.progressRow}>
            {STATUS_FLOW.map((s, i) => {
              const isActive = i <= statusIndex;
              return (
                <View key={s} style={styles.progressItem}>
                  <View
                    style={[
                      styles.progressDot,
                      isActive && styles.progressDotActive,
                    ]}
                  >
                    {isActive && (
                      <Icon name="checkmark" size={12} color={colors.white} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.progressLabel,
                      isActive && styles.progressLabelActive,
                    ]}
                  >
                    {s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}
                  </Text>
                  {i < STATUS_FLOW.length - 1 && (
                    <View
                      style={[
                        styles.progressLine,
                        i < statusIndex && styles.progressLineActive,
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.customerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>
                {order.customerName || order.name || "Customer"}
              </Text>
              <Text style={styles.customerPhone}>
                {order.phone || order.customerPhone || "N/A"}
              </Text>
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={handleCall}>
              <Icon name="call-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={handleNavigate}>
              <Icon name="navigate-outline" size={20} color={colors.success} />
            </TouchableOpacity>
          </View>
          <View style={styles.addressBox}>
            <Icon name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.addressText}>
              {order.address || "Address not available"}
            </Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {(order.items || []).map((item: any, index: number) => (
            <View key={`${item.product}-${index}`} style={styles.itemRow}>
              <Text style={styles.itemName}>
                {item.name}
                {item.variantName ? ` (${item.variantName})` : ""}
              </Text>
              <Text style={styles.itemQty}>x{item.qty}</Text>
              <Text style={styles.itemPrice}>
                Rs.{(item.price * item.qty).toFixed(0)}
              </Text>
            </View>
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>
              Rs.{(order.total || 0).toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment</Text>
            <View
              style={[
                styles.paymentBadge,
                {
                  backgroundColor:
                    order.paymentMethod === "COD"
                      ? `${colors.warning}20`
                      : `${colors.success}20`,
                },
              ]}
            >
              <Text
                style={[
                  styles.paymentText,
                  {
                    color:
                      order.paymentMethod === "COD"
                        ? colors.warning
                        : colors.success,
                  },
                ]}
              >
                {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Paid"}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action */}
      {nextAction && currentStatus !== "DELIVERED" && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              updating && styles.actionBtnDisabled,
            ]}
            onPress={handleStatusUpdate}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Icon
                  name={
                    nextAction.nextStatus === "DELIVERED"
                      ? "checkmark-circle-outline"
                      : "arrow-forward-circle-outline"
                  }
                  size={22}
                  color={colors.white}
                />
                <Text style={styles.actionBtnText}>{nextAction.label}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    gap: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  scroll: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: colors.white,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  progressItem: {
    alignItems: "center",
    flex: 1,
    position: "relative",
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  progressDotActive: {
    backgroundColor: colors.success,
  },
  progressLabel: {
    fontSize: 10,
    color: colors.textLight,
    textAlign: "center",
  },
  progressLabelActive: {
    color: colors.success,
    fontWeight: "600",
  },
  progressLine: {
    position: "absolute",
    top: 12,
    left: "60%",
    right: "-40%",
    height: 2,
    backgroundColor: colors.border,
    zIndex: -1,
  },
  progressLineActive: {
    backgroundColor: colors.success,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  customerName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  addressBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: colors.lightBackground,
    padding: 12,
    borderRadius: 10,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  itemQty: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    minWidth: 60,
    textAlign: "right",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  paymentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paymentText: {
    fontSize: 12,
    fontWeight: "600",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionBtnDisabled: {
    opacity: 0.6,
  },
  actionBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
});

export default DeliveryDetailScreen;
