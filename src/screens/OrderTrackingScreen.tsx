// File: src/screens/OrderTrackingScreen.tsx
"use client";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { Icon } from "../components/Icon";
import type { OrderStatus } from "../api";

const TRACKING_STEPS: {
  status: OrderStatus;
  label: string;
  icon: string;
}[] = [
  { status: "PENDING", label: "Order Placed", icon: "receipt" },
  { status: "CONFIRMED", label: "Confirmed", icon: "checkmark-circle" },
  { status: "PREPARING", label: "Preparing", icon: "restaurant" },
  { status: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: "bicycle" },
  { status: "DELIVERED", label: "Delivered", icon: "checkmark-done" },
];

const STATUS_ORDER: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export const OrderTrackingScreen = ({ route, navigation }: any) => {
  const { order } = route.params || {};

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F8F8" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Track Order</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Order information not available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentStatus: OrderStatus = order.status || "PENDING";
  const isCancelled = currentStatus === "CANCELLED";
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStepTime = (stepIndex: number) => {
    if (stepIndex === 0) return formatTime(order.createdAt);
    if (stepIndex <= currentIndex && order.updatedAt) {
      return formatTime(order.updatedAt);
    }
    return "";
  };

  const isStepComplete = (stepIndex: number) => {
    if (isCancelled) return false;
    return stepIndex <= currentIndex;
  };

  const isStepCurrent = (stepIndex: number) => {
    if (isCancelled) return false;
    return stepIndex === currentIndex;
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
        <Text style={styles.headerTitle}>Track Order</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Order info card */}
        <View style={styles.orderInfoCard}>
          <View style={styles.orderInfoHeader}>
            <View>
              <Text style={styles.orderId}>
                Order #{order.orderId || order.id || order._id}
              </Text>
              <Text style={styles.orderDate}>
                {formatDate(order.createdAt)}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isCancelled
                    ? `${colors.error}20`
                    : currentStatus === "DELIVERED"
                    ? `${colors.success}20`
                    : `${colors.primary}20`,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color: isCancelled
                      ? colors.error
                      : currentStatus === "DELIVERED"
                      ? colors.success
                      : colors.primary,
                  },
                ]}
              >
                {currentStatus.replace(/_/g, " ")}
              </Text>
            </View>
          </View>
        </View>

        {/* Cancelled banner */}
        {isCancelled && (
          <View style={styles.cancelledBanner}>
            <Icon name="close-circle" size={20} color={colors.error} />
            <Text style={styles.cancelledText}>
              This order has been cancelled.
            </Text>
          </View>
        )}

        {/* Timeline */}
        {!isCancelled && (
          <View style={styles.timelineContainer}>
            <Text style={styles.sectionTitle}>Order Progress</Text>

            {TRACKING_STEPS.map((step, idx) => {
              const complete = isStepComplete(idx);
              const current = isStepCurrent(idx);
              const stepTime = getStepTime(idx);
              const isLast = idx === TRACKING_STEPS.length - 1;

              return (
                <View key={step.status} style={styles.timelineStep}>
                  {/* Left: dot + line */}
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.timelineDot,
                        complete
                          ? styles.timelineDotComplete
                          : current
                          ? styles.timelineDotCurrent
                          : styles.timelineDotPending,
                      ]}
                    >
                      {complete && !current ? (
                        <Icon
                          name="checkmark"
                          size={14}
                          color={colors.white}
                        />
                      ) : (
                        <Icon
                          name={step.icon}
                          size={14}
                          color={
                            complete || current
                              ? colors.white
                              : colors.textLight
                          }
                        />
                      )}
                    </View>
                    {!isLast && (
                      <View
                        style={[
                          styles.timelineLine,
                          complete && !isLast
                            ? styles.timelineLineComplete
                            : styles.timelineLinePending,
                        ]}
                      />
                    )}
                  </View>

                  {/* Right: label + time */}
                  <View style={styles.timelineRight}>
                    <Text
                      style={[
                        styles.timelineLabel,
                        (complete || current) &&
                          styles.timelineLabelActive,
                        current && styles.timelineLabelCurrent,
                      ]}
                    >
                      {step.label}
                    </Text>
                    {stepTime ? (
                      <Text style={styles.timelineTime}>{stepTime}</Text>
                    ) : null}

                    {/* Delivery boy info */}
                    {step.status === "OUT_FOR_DELIVERY" &&
                      (complete || current) &&
                      order.deliveryBoy && (
                        <View style={styles.deliveryBoyCard}>
                          <Icon
                            name="person"
                            size={16}
                            color={colors.primary}
                          />
                          <Text style={styles.deliveryBoyName}>
                            {order.deliveryBoy.name || "Delivery Partner"}
                          </Text>
                        </View>
                      )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Order Items */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {(order.items || []).map((item: any, idx: number) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemName}>
                {item.name} {item.variantName ? `(${item.variantName})` : ""}
              </Text>
              <Text style={styles.itemQty}>x{item.qty}</Text>
              <Text style={styles.itemPrice}>
                ₹{item.price * item.qty}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>
              ₹{order.total?.toFixed(2) || "0.00"}
            </Text>
          </View>
        </View>

        {/* Delivery address */}
        {order.address && (
          <View style={styles.addressSection}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.addressRow}>
              <Icon name="location" size={18} color={colors.primary} />
              <Text style={styles.addressText}>{order.address}</Text>
            </View>
          </View>
        )}
      </ScrollView>
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
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  orderInfoCard: {
    backgroundColor: colors.white,
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  cancelledBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${colors.error}10`,
    margin: 16,
    marginBottom: 0,
    padding: 14,
    borderRadius: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: `${colors.error}30`,
  },
  cancelledText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.error,
  },
  timelineContainer: {
    backgroundColor: colors.white,
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  timelineStep: {
    flexDirection: "row",
    minHeight: 60,
  },
  timelineLeft: {
    alignItems: "center",
    width: 36,
    marginRight: 12,
  },
  timelineDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDotComplete: {
    backgroundColor: colors.success,
  },
  timelineDotCurrent: {
    backgroundColor: colors.primary,
  },
  timelineDotPending: {
    backgroundColor: "#E0E0E0",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
    marginVertical: 4,
  },
  timelineLineComplete: {
    backgroundColor: colors.success,
  },
  timelineLinePending: {
    backgroundColor: "#E0E0E0",
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 20,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textLight,
  },
  timelineLabelActive: {
    color: colors.text,
  },
  timelineLabelCurrent: {
    color: colors.primary,
    fontWeight: "700",
  },
  timelineTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deliveryBoyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
    gap: 6,
    alignSelf: "flex-start",
  },
  deliveryBoyName: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  itemsSection: {
    backgroundColor: colors.white,
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
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
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
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
  addressSection: {
    backgroundColor: colors.white,
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});

export default OrderTrackingScreen;
