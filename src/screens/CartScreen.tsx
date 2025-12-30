// File: src/screens/CartScreen.tsx
"use client";

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Icon } from "../components/Icon";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
import { useUser } from "../context/UserContext";
import { colors } from "../theme/colors";

type ConfirmAddress = {
  line1: string;
  city?: string;
  label?: string;
  latitude?: number;
  longitude?: number;
  id?: string;
  _id?: string;
};

export const CartScreen = ({ navigation }: any) => {
  const {
    cartItems,
    updateQuantity,
    getTotalPrice,
    placeOrder,
    getTotalItems,
  } = useCart();

  const { user, isLoggedIn, setUser } = useUser();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] =
    useState<string | null>(null);
  const [discountPercent, setDiscountPercent] =
    useState(0);
  const [discountError, setDiscountError] =
    useState<string | null>(null);
  const [showCouponInput, setShowCouponInput] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  const [paymentMethod, setPaymentMethod] =
    useState<"COD" | "ONLINE">("COD");

  const getItemTotal = () => getTotalPrice();

  const getDiscountAmount = () => {
    const itemTotal = getItemTotal();
    return (itemTotal * discountPercent) / 100;
  };

  const getPayableAmount = () => {
    const itemTotal = getItemTotal();
    const delivery = 5;
    const discount = getDiscountAmount();
    return itemTotal - discount + delivery;
  };

  const getItemQuantityDisplay = (item: any) => {
    return `${item.quantity} pcs`;
  };

  const applyCouponHandler = () => {
    const code = couponCode.trim();
    if (!code) {
      setDiscountError("Please enter a coupon code.");
      setAppliedCoupon(null);
      setDiscountPercent(0);
      return;
    }

    let percent = 0;
    switch (code) {
      case "Barkha":
        percent = 10;
        break;
      case "Kavita":
        percent = 12;
        break;
      case "Babita":
        percent = 15;
        break;
      case "anuj":
        percent = 15;
        break;
      case "Sundeep":
        percent = 20;
        break;
      case "SundeepLoveSaniya":
        percent = 98;
        break;
      case "Saniya":
        percent = 80;
        break;
      default:
        percent = 0;
    }

    if (percent === 0) {
      setDiscountError("Invalid coupon code.");
      setAppliedCoupon(null);
      setDiscountPercent(0);
    } else {
      setDiscountError(null);
      setAppliedCoupon(code);
      setDiscountPercent(percent);
    }
  };

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) {
      Alert.alert(
        "Cart Empty",
        "Please add items to your cart before placing an order."
      );
      return;
    }

    if (!isLoggedIn || !user) {
      navigation.navigate("Login");
      return;
    }

    navigation.navigate("AddressConfirm", {
      // AddressConfirm should call this with the full address object
      onConfirm: async (addr: ConfirmAddress) => {
        try {
          setIsLoading(true);

          // Build printable address string
          const addressText = `${addr.line1}${
            addr.city ? `, ${addr.city}` : ""
          }`;

          const total = getPayableAmount();
          const phone = user.phoneNumber;
          const name = user.name || "Customer";

          const order = await placeOrder({
            address: addressText,
            phone,
            name,
            paymentMethod,
          });

          setIsLoading(false);

          if (!order) {
            Alert.alert(
              "Order failed",
              "Unable to place order. Please try again."
            );
            return;
          }

          // Navigate to success
          navigation.replace("OrderSuccess", {
            orderId:
              (order as any).orderId ||
              (order as any).id ||
              (order as any)._id,
            total: total.toFixed(2),
            paymentMethod,
          });
        } catch (err: any) {
          setIsLoading(false);
          Alert.alert(
            "Order failed",
            err.message ||
              "Something went wrong. Please try again."
          );
        }
      },
    });
  };

  const renderCartItem = (item: any) => (
    <View key={item.id} style={styles.cartItem}>
      <View style={styles.itemInfo}>
        <View style={styles.vegIndicator}>
          <View style={styles.vegDot} />
        </View>
        <Text style={styles.itemName}>{item.name}</Text>
        {!!item.variantName && (
          <Text style={styles.itemVariant}>
            {item.variantName}
          </Text>
        )}
        <Text style={styles.itemUnit}>
          {getItemQuantityDisplay(item)}
        </Text>
        <Text style={styles.itemPrice}>
          ₹ {(item.price * item.quantity).toFixed(2)}
        </Text>
      </View>

      <View style={styles.quantityContainer}>
        <TouchableOpacity
          onPress={() =>
            updateQuantity(
              item.id,
              Math.max(1, item.quantity - 1)
            )
          }
          style={styles.qtyButton}
        >
          <Icon
            name="remove"
            size={16}
            color={colors.white}
          />
        </TouchableOpacity>
        <Text style={styles.quantity}>
          {item.quantity}
        </Text>
        <TouchableOpacity
          onPress={() =>
            updateQuantity(item.id, item.quantity + 1)
          }
          style={styles.qtyButton}
        >
          <Icon
            name="add"
            size={16}
            color={colors.white}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const itemTotal = getItemTotal();
  const discountAmount = getDiscountAmount();
  const deliveryCharge = 5;
  const payable = getPayableAmount();
  const totalItems = getTotalItems();

  const deliveryAddressText =
    user?.location?.address ||
    "Set delivery location";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8F8F8"
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
        >
          <Icon
            name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          My Cart ({totalItems})
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>
            Your cart is empty
          </Text>
          <Text style={styles.emptySubtitle}>
            Add items to get started
          </Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Home")
            }
            style={styles.shopButton}
          >
            <Text style={styles.shopButtonText}>
              Start Shopping
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingBottom: 16,
            }}
          >
            {/* Delivery section */}
            <View style={styles.deliverySection}>
              <View style={styles.deliveryRow}>
                <View style={styles.deliveryInfo}>
                  <Text style={styles.deliveryLabel}>
                    Delivery to
                  </Text>
                  <Text
                    style={styles.deliveryAddress}
                    numberOfLines={2}
                  >
                    {deliveryAddressText}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate(
                      "AddressConfirm",
                      {
                        onConfirm: (
                          addr: ConfirmAddress
                        ) => {
                          const addressText =
                            `${addr.line1}${
                              addr.city
                                ? `, ${addr.city}`
                                : ""
                            }`;

                          if (user) {
                            setUser({
                              ...user,
                              location: {
                                address: addressText,
                              },
                            });
                          }

                          // Just close AddressConfirm;
                          // CartScreen UI updates via context
                          navigation.goBack();
                        },
                      }
                    )
                  }
                >
                  <Text
                    style={
                      styles.deliveryOptionText
                    }
                  >
                    Change
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.deliveryOptions}>
                <View style={styles.deliveryOption}>
                  <Icon
                    name="time"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={
                      styles.deliveryOptionText
                    }
                  >
                    Delivery • Now
                  </Text>
                </View>
              </View>

              <View style={styles.deliveryTime}>
                <Icon
                  name="bike"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text
                  style={styles.deliveryTimeText}
                >
                  Delivery in 30-40 mins
                </Text>
              </View>
            </View>

            {/* Items */}
            <View style={styles.itemsSection}>
              <Text style={styles.sectionTitle}>
                Items Added
              </Text>
              {cartItems.map((item: any) =>
                renderCartItem(item)
              )}
            </View>

            {/* Offers / coupon */}
            <View style={styles.itemsSection}>
              <Text style={styles.sectionTitle}>
                Offers & Benefits
              </Text>
              {appliedCoupon && (
                <Text
                  style={{
                    fontSize: 13,
                    marginBottom: 4,
                  }}
                >
                  Applied: {appliedCoupon} (
                  {discountPercent}% off)
                </Text>
              )}
              {discountError && (
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.error,
                    marginBottom: 4,
                  }}
                >
                  {discountError}
                </Text>
              )}
              <TouchableOpacity
                onPress={() =>
                  setShowCouponInput(prev => !prev)
                }
                style={styles.couponButton}
              >
                <Icon
                  name="card"
                  size={18}
                  color={colors.primary}
                />
                <Text
                  style={styles.couponButtonText}
                >
                  {showCouponInput
                    ? "Hide"
                    : "Apply Coupon"}
                </Text>
              </TouchableOpacity>

              {showCouponInput && (
                <View
                  style={{
                    flexDirection: "row",
                    marginTop: 8,
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <TextInput
                    style={[
                      styles.input,
                      { flex: 1, marginBottom: 0 },
                    ]}
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChangeText={setCouponCode}
                  />
                  <TouchableOpacity
                    onPress={applyCouponHandler}
                    style={styles.applyButton}
                  >
                    <Text
                      style={styles.applyButtonText}
                    >
                      Apply
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Payment method */}
            <View style={styles.itemsSection}>
              <Text style={styles.sectionTitle}>
                Payment Method
              </Text>

              <TouchableOpacity
                style={styles.paymentOption}
                onPress={() =>
                  setPaymentMethod("COD")
                }
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={styles.paymentTitle}
                  >
                    Cash on Delivery
                  </Text>
                  <Text
                    style={styles.paymentSubtitle}
                  >
                    Pay with cash when order
                    arrives
                  </Text>
                </View>
                {paymentMethod === "COD" && (
                  <Icon
                    name="checkmark-circle"
                    size={20}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.paymentOption}
                onPress={() =>
                  setPaymentMethod("ONLINE")
                }
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={styles.paymentTitle}
                  >
                    Online Payment
                  </Text>
                  <Text
                    style={styles.paymentSubtitle}
                  >
                    UPI / Card / Wallet
                  </Text>
                </View>
                {paymentMethod === "ONLINE" && (
                  <Icon
                    name="checkmark-circle"
                    size={20}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Bill summary */}
            <View style={styles.itemsSection}>
              <Text style={styles.sectionTitle}>
                Bill Summary
              </Text>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>
                  Item total
                </Text>
                <Text style={styles.billValue}>
                  ₹ {itemTotal.toFixed(2)}
                </Text>
              </View>

              {discountPercent > 0 && (
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>
                    Discount
                  </Text>
                  <Text
                    style={[
                      styles.billValue,
                      { color: colors.success },
                    ]}
                  >
                    - ₹ {discountAmount.toFixed(2)}
                  </Text>
                </View>
              )}

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>
                  Delivery charge
                </Text>
                <Text style={styles.billValue}>
                  ₹ {deliveryCharge.toFixed(2)}
                </Text>
              </View>

              <View
                style={[
                  styles.billRow,
                  { marginTop: 8 },
                ]}
              >
                <Text
                  style={styles.billTotalLabel}
                >
                  To Pay
                </Text>
                <Text
                  style={styles.billTotalValue}
                >
                  ₹ {payable.toFixed(2)}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Checkout footer */}
          <View style={styles.footer}>
            <View>
              <Text style={styles.footerLabel}>
                TOTAL
              </Text>
              <Text
                style={styles.footerAmount}
              >
                ₹ {payable.toFixed(2)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.footerButton}
              onPress={handlePlaceOrder}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={styles.footerButtonText}
                >
                  {paymentMethod === "COD"
                    ? "Place Order (COD)"
                    : "Place Order & Pay Online"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      {isLoading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator
            size="large"
            color={colors.white}
          />
          <Text style={styles.loaderText}>
            Placing your order...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // … keep all your existing styles unchanged …
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
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  deliverySection: {
    backgroundColor: colors.white,
    padding: 16,
    marginBottom: 8,
  },
  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 2,
  },
  deliveryAddress: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  deliveryOptions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  deliveryOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  deliveryOptionText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  deliveryTime: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F5F5F5",
    borderRadius: 6,
    gap: 6,
    marginTop: 12,
  },
  deliveryTimeText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  itemsSection: {
    backgroundColor: colors.white,
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  cartItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  itemInfo: {
    flex: 1,
  },
  vegIndicator: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: colors.success,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  vegDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  itemVariant: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
  itemUnit: {
    fontSize: 11,
    color: colors.textLight,
    marginBottom: 4,
    fontWeight: "600",
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 6,
    overflow: "hidden",
    alignSelf: "center",
  },
  qtyButton: {
    width: 24,
    height: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  quantity: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
    minWidth: 28,
    textAlign: "center",
  },
  couponButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  couponButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  applyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  applyButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.white,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  paymentSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  billLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  billValue: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  billTotalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  billTotalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    gap: 12,
  },
  footerLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  footerAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  footerButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.white,
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
  loaderOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  loaderText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.white,
  },
});
