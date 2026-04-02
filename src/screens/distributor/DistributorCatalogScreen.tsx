// src/screens/distributor/DistributorCatalogScreen.tsx

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  Dimensions,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../../components/Icon";
import { colors } from "../../theme/colors";
import {
  apiGetB2BProducts,
  apiCreateB2BOrder,
  apiGetDistributorProfile,
  apiCreatePaymentOrder,
  apiVerifyPayment,
} from "../../api";
import RazorpayCheckout from "react-native-razorpay";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface B2BVariant {
  _id?: string;
  name: string;
  b2bPrice: number;
  stock: number;
  minB2BQty: number;
  sku?: string;
}

interface B2BProduct {
  _id: string;
  name: string;
  category: string;
  image?: string;
  unit?: string;
  variants?: B2BVariant[];
  sellingPrice?: number;
  price?: number;
}

type CheckoutStep = "cart" | "checkout" | "placing" | "success";

export const DistributorCatalogScreen = ({ navigation }: any) => {
  const [products, setProducts] = useState<B2BProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});

  // Checkout state
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("cart");
  const [showCheckout, setShowCheckout] = useState(false);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CREDIT" | "RAZORPAY">("CREDIT");
  const [profile, setProfile] = useState<any>(null);
  const [successOrder, setSuccessOrder] = useState<any>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const search = searchTerm.trim() || undefined;
      const category = activeCategory !== "All" ? activeCategory : undefined;
      const data = await apiGetB2BProducts(search, category);
      const items: B2BProduct[] = Array.isArray(data) ? data : data?.products ?? [];
      setProducts(items);

      if (activeCategory === "All" && !searchTerm) {
        const cats = [...new Set(items.map((p: B2BProduct) => p.category).filter(Boolean))];
        setCategories(cats as string[]);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, activeCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  const updateQty = (productId: string, delta: number, minQty: number) => {
    setCart((prev) => {
      const current = prev[productId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      if (next < minQty && delta > 0 && current === 0) {
        return { ...prev, [productId]: minQty };
      }
      return { ...prev, [productId]: next };
    });
  };

  const cartCount = Object.values(cart).reduce((sum, q) => sum + q, 0);
  const cartItemCount = Object.keys(cart).length;

  const getCartItems = () => {
    return Object.entries(cart).map(([productId, qty]) => {
      const product = products.find((p) => p._id === productId);
      const variant = product?.variants?.[0];
      const price = variant?.b2bPrice ?? product?.sellingPrice ?? product?.price ?? 0;
      return {
        productId,
        name: product?.name || "",
        unit: product?.unit || "",
        qty,
        price,
        total: price * qty,
        variant: variant?.name,
        image: product?.image,
      };
    });
  };

  const getCartTotal = () => {
    return getCartItems().reduce((sum, item) => sum + item.total, 0);
  };

  const gstRate = 0.05;
  const subtotal = getCartTotal();
  const gstAmount = Math.round(subtotal * gstRate * 100) / 100;
  const grandTotal = subtotal + gstAmount;

  // Open checkout
  const openCheckout = async () => {
    setCheckoutStep("checkout");
    setShowCheckout(true);

    // Load profile for address defaults
    try {
      const prof = await apiGetDistributorProfile();
      setProfile(prof);
      if (!address) {
        setAddress(
          prof?.distributorProfile?.territory ||
          prof?.distributorProfile?.businessName ||
          ""
        );
      }
    } catch {}
  };

  // Place order
  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      Alert.alert("Address Required", "Please enter a delivery address.");
      return;
    }

    setCheckoutStep("placing");

    try {
      const items = Object.entries(cart).map(([productId, qty]) => {
        const product = products.find((p) => p._id === productId);
        const variant = product?.variants?.[0];
        return { product: productId, qty, variant: variant?.name };
      });

      // If Razorpay, do payment first
      if (paymentMethod === "RAZORPAY") {
        const rzpOrder = await apiCreatePaymentOrder(grandTotal, `b2b_${Date.now()}`);

        const options = {
          description: "B2B Order Payment",
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
          setCheckoutStep("checkout");
          Alert.alert("Payment Cancelled", rzpErr?.description || "Payment was cancelled.");
          return;
        }

        // Verify
        await apiVerifyPayment({
          razorpay_order_id: paymentData.razorpay_order_id,
          razorpay_payment_id: paymentData.razorpay_payment_id,
          razorpay_signature: paymentData.razorpay_signature,
        });
      }

      // Place the order
      const result = await apiCreateB2BOrder({ items, address: address.trim(), notes: notes.trim() });
      setSuccessOrder(result);
      setCheckoutStep("success");
    } catch (err: any) {
      setCheckoutStep("checkout");
      Alert.alert("Order Failed", err.message || "Unable to place order. Please try again.");
    }
  };

  const handleSuccessDone = () => {
    setShowCheckout(false);
    setCheckoutStep("cart");
    setCart({});
    setAddress("");
    setNotes("");
    setSuccessOrder(null);
  };

  const handleViewOrders = () => {
    handleSuccessDone();
    navigation.navigate("DistributorOrders");
  };

  const formatCategory = (cat: string) => {
    return cat
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };

  const renderProduct = ({ item }: { item: B2BProduct }) => {
    const qty = cart[item._id] || 0;
    const variant = item.variants?.[0];
    const wholesalePrice = variant?.b2bPrice ?? item.sellingPrice ?? item.price ?? 0;
    const retailPrice = item.sellingPrice ?? item.price ?? 0;
    const minQty = variant?.minB2BQty ?? 1;
    const stock = variant?.stock ?? 999;
    const isOutOfStock = stock <= 0;
    const isLowStock = stock > 0 && stock <= 10;
    const saving =
      retailPrice > wholesalePrice
        ? Math.round(((retailPrice - wholesalePrice) / retailPrice) * 100)
        : 0;

    return (
      <View style={[styles.productCard, isOutOfStock && styles.productCardOOS]}>
        <View style={styles.imageContainer}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={[styles.productImage, isOutOfStock && { opacity: 0.4 }]}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.productImage, styles.productImagePlaceholder]}>
              <Icon name="cube-outline" size={36} color={colors.textLight} />
            </View>
          )}
          {saving > 0 && !isOutOfStock && (
            <View style={styles.savingBadge}>
              <Text style={styles.savingText}>{saving}% OFF</Text>
            </View>
          )}
          {isOutOfStock && (
            <View style={styles.oosBadge}>
              <Text style={styles.oosText}>OUT OF STOCK</Text>
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <Text style={[styles.productName, isOutOfStock && { color: colors.textLight }]} numberOfLines={2}>
            {item.name}
          </Text>
          {item.unit ? <Text style={styles.productUnit}>{item.unit}</Text> : null}
          <View style={styles.priceBlock}>
            <Text style={[styles.wholesalePrice, isOutOfStock && { color: colors.textLight }]}>
              Rs. {wholesalePrice.toLocaleString("en-IN")}
            </Text>
            {retailPrice > wholesalePrice && (
              <Text style={styles.retailPrice}>Rs. {retailPrice.toLocaleString("en-IN")}</Text>
            )}
          </View>
          <View style={styles.stockRow}>
            {isOutOfStock ? (
              <Text style={styles.stockTextOOS}>Out of stock</Text>
            ) : isLowStock ? (
              <Text style={styles.stockTextLow}>Only {stock} left</Text>
            ) : (
              <Text style={styles.stockTextIn}>In Stock ({stock})</Text>
            )}
            {minQty > 1 && <Text style={styles.minQtyText}> · Min: {minQty}</Text>}
          </View>
        </View>

        <View style={styles.cartControlContainer}>
          {isOutOfStock ? (
            <View style={styles.oosButton}>
              <Text style={styles.oosButtonText}>Unavailable</Text>
            </View>
          ) : qty === 0 ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => updateQty(item._id, minQty, minQty)}
              activeOpacity={0.7}
            >
              <Icon name="add" size={18} color={colors.white} />
              <Text style={styles.addButtonText}>ADD</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.qtyControls}>
              <TouchableOpacity style={styles.qtyButton} onPress={() => updateQty(item._id, -1, minQty)}>
                <Icon name="remove" size={16} color={colors.white} />
              </TouchableOpacity>
              <View style={styles.qtyDisplay}>
                <Text style={styles.qtyText}>{qty}</Text>
              </View>
              <TouchableOpacity style={styles.qtyButton} onPress={() => updateQty(item._id, 1, minQty)}>
                <Icon name="add" size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Checkout modal content based on step
  const renderCheckoutContent = () => {
    if (checkoutStep === "placing") {
      return (
        <View style={styles.ckPlacingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.ckPlacingText}>Processing your order...</Text>
          <Text style={styles.ckPlacingSubtext}>Please wait, do not close the app</Text>
        </View>
      );
    }

    if (checkoutStep === "success") {
      return (
        <View style={styles.ckSuccessContainer}>
          <View style={styles.ckSuccessIcon}>
            <Icon name="checkmark-circle" size={72} color="#27ae60" />
          </View>
          <Text style={styles.ckSuccessTitle}>Order Placed Successfully!</Text>
          <Text style={styles.ckSuccessOrderId}>
            Order #{successOrder?.order?.orderId || ""}
          </Text>
          <Text style={styles.ckSuccessAmount}>
            Rs. {grandTotal.toLocaleString("en-IN")}
          </Text>

          <View style={styles.ckSuccessInfo}>
            <View style={styles.ckSuccessRow}>
              <Icon name="location-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.ckSuccessRowText}>{address}</Text>
            </View>
            <View style={styles.ckSuccessRow}>
              <Icon name="card-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.ckSuccessRowText}>
                {paymentMethod === "CREDIT" ? "Paid via Credit" : "Paid via Razorpay"}
              </Text>
            </View>
            <View style={styles.ckSuccessRow}>
              <Icon name="cube-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.ckSuccessRowText}>
                {cartItemCount} items | {cartCount} units
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.ckSuccessBtn} onPress={handleViewOrders}>
            <Icon name="list-outline" size={20} color={colors.white} />
            <Text style={styles.ckSuccessBtnText}>View Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ckSuccessBtnOutline} onPress={handleSuccessDone}>
            <Text style={styles.ckSuccessBtnOutlineText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Checkout step
    const cartItems = getCartItems();
    const creditAvail = (profile?.distributorProfile?.creditLimit || 0) - (profile?.distributorProfile?.creditUsed || 0);

    return (
      <ScrollView style={styles.ckScroll} showsVerticalScrollIndicator={false}>
        {/* Order Items */}
        <Text style={styles.ckSectionTitle}>Order Summary</Text>
        <View style={styles.ckItemsCard}>
          {cartItems.map((item, idx) => (
            <View
              key={item.productId}
              style={[styles.ckItem, idx < cartItems.length - 1 && styles.ckItemBorder]}
            >
              <View style={styles.ckItemLeft}>
                <Text style={styles.ckItemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.ckItemMeta}>
                  {item.unit ? `${item.unit} · ` : ""}Rs. {item.price.toLocaleString("en-IN")} x {item.qty}
                </Text>
              </View>
              <Text style={styles.ckItemTotal}>Rs. {item.total.toLocaleString("en-IN")}</Text>
            </View>
          ))}
        </View>

        {/* Delivery Address */}
        <Text style={styles.ckSectionTitle}>Delivery Address</Text>
        <View style={styles.ckInputCard}>
          <View style={styles.ckInputRow}>
            <Icon name="location-outline" size={20} color={colors.primary} />
            <TextInput
              style={styles.ckAddressInput}
              placeholder="Enter delivery address"
              placeholderTextColor={colors.textLight}
              value={address}
              onChangeText={setAddress}
              multiline
            />
          </View>
        </View>

        {/* Notes */}
        <Text style={styles.ckSectionTitle}>Order Notes (Optional)</Text>
        <View style={styles.ckInputCard}>
          <TextInput
            style={styles.ckNotesInput}
            placeholder="Any special instructions..."
            placeholderTextColor={colors.textLight}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Payment Method */}
        <Text style={styles.ckSectionTitle}>Payment Method</Text>
        <View style={styles.ckPaymentCard}>
          <TouchableOpacity
            style={[styles.ckPayOption, paymentMethod === "CREDIT" && styles.ckPayOptionActive]}
            onPress={() => setPaymentMethod("CREDIT")}
          >
            <View style={styles.ckPayRadio}>
              {paymentMethod === "CREDIT" && <View style={styles.ckPayRadioFill} />}
            </View>
            <View style={styles.ckPayOptionInfo}>
              <Text style={styles.ckPayOptionTitle}>Credit Account</Text>
              <Text style={styles.ckPayOptionDesc}>
                Available: Rs. {creditAvail.toLocaleString("en-IN")}
              </Text>
            </View>
            <Icon name="wallet-outline" size={22} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.ckPayDivider} />

          <TouchableOpacity
            style={[styles.ckPayOption, paymentMethod === "RAZORPAY" && styles.ckPayOptionActive]}
            onPress={() => setPaymentMethod("RAZORPAY")}
          >
            <View style={styles.ckPayRadio}>
              {paymentMethod === "RAZORPAY" && <View style={styles.ckPayRadioFill} />}
            </View>
            <View style={styles.ckPayOptionInfo}>
              <Text style={styles.ckPayOptionTitle}>Pay Online</Text>
              <Text style={styles.ckPayOptionDesc}>UPI, Cards, Net Banking</Text>
            </View>
            <Icon name="card-outline" size={22} color="#6c5ce7" />
          </TouchableOpacity>
        </View>

        {/* Price Breakdown */}
        <Text style={styles.ckSectionTitle}>Price Details</Text>
        <View style={styles.ckPriceCard}>
          <View style={styles.ckPriceRow}>
            <Text style={styles.ckPriceLabel}>Subtotal ({cartItemCount} items)</Text>
            <Text style={styles.ckPriceValue}>Rs. {subtotal.toLocaleString("en-IN")}</Text>
          </View>
          <View style={styles.ckPriceRow}>
            <Text style={styles.ckPriceLabel}>GST (5%)</Text>
            <Text style={styles.ckPriceValue}>Rs. {gstAmount.toLocaleString("en-IN")}</Text>
          </View>
          <View style={styles.ckPriceRow}>
            <Text style={styles.ckPriceLabel}>Delivery</Text>
            <Text style={[styles.ckPriceValue, { color: "#27ae60" }]}>FREE</Text>
          </View>
          <View style={styles.ckPriceDivider} />
          <View style={styles.ckPriceRow}>
            <Text style={styles.ckPriceTotalLabel}>Grand Total</Text>
            <Text style={styles.ckPriceTotalValue}>Rs. {grandTotal.toLocaleString("en-IN")}</Text>
          </View>
        </View>

        {/* Credit warning */}
        {paymentMethod === "CREDIT" && grandTotal > creditAvail && (
          <View style={styles.ckWarning}>
            <Icon name="alert-circle-outline" size={18} color={colors.error} />
            <Text style={styles.ckWarningText}>
              Insufficient credit. Available: Rs. {creditAvail.toLocaleString("en-IN")}
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0d3b54" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>B2B Catalog</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{products.length} items</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Icon name="search-outline" size={20} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products, brands..."
            placeholderTextColor={colors.textLight}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm("")} style={styles.clearButton}>
              <Icon name="close-circle" size={18} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoryWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryBar}>
          <TouchableOpacity
            style={[styles.categoryChip, activeCategory === "All" && styles.categoryChipActive]}
            onPress={() => setActiveCategory("All")}
          >
            <Text style={[styles.categoryChipText, activeCategory === "All" && styles.categoryChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text
                style={[styles.categoryChipText, activeCategory === cat && styles.categoryChipTextActive]}
                numberOfLines={1}
              >
                {formatCategory(cat)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Icon name="cube-outline" size={48} color={colors.textLight} />
          </View>
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptySubtitle}>Try adjusting your search or category filter</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          renderItem={renderProduct}
          contentContainerStyle={[styles.listContent, cartCount > 0 && { paddingBottom: 90 }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Cart Footer */}
      {cartCount > 0 && !showCheckout && (
        <View style={styles.orderFooter}>
          <View style={styles.orderFooterLeft}>
            <View style={styles.orderBadge}>
              <Icon name="cart-outline" size={18} color={colors.white} />
              <View style={styles.orderBadgeCount}>
                <Text style={styles.orderBadgeCountText}>{cartItemCount}</Text>
              </View>
            </View>
            <View>
              <Text style={styles.orderFooterItems}>
                {cartCount} unit{cartCount > 1 ? "s" : ""} | {cartItemCount} item{cartItemCount > 1 ? "s" : ""}
              </Text>
              <Text style={styles.orderFooterTotal}>Rs. {subtotal.toLocaleString("en-IN")}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.checkoutButton} onPress={openCheckout} activeOpacity={0.8}>
            <Text style={styles.checkoutButtonText}>Checkout</Text>
            <Icon name="arrow-forward" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* Checkout Modal */}
      <Modal
        visible={showCheckout}
        animationType="slide"
        onRequestClose={() => {
          if (checkoutStep === "checkout") {
            setShowCheckout(false);
            setCheckoutStep("cart");
          }
        }}
      >
        <SafeAreaView style={styles.ckContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#0d3b54" />

          {/* Checkout Header */}
          {checkoutStep !== "success" && checkoutStep !== "placing" && (
            <View style={styles.ckHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowCheckout(false);
                  setCheckoutStep("cart");
                }}
                style={styles.ckBackBtn}
              >
                <Icon name="arrow-back" size={22} color={colors.white} />
              </TouchableOpacity>
              <Text style={styles.ckHeaderTitle}>Checkout</Text>
              <Text style={styles.ckHeaderBadge}>{cartItemCount} items</Text>
            </View>
          )}

          {renderCheckoutContent()}

          {/* Bottom Place Order Button */}
          {checkoutStep === "checkout" && (
            <View style={styles.ckBottomBar}>
              <View>
                <Text style={styles.ckBottomLabel}>Total Amount</Text>
                <Text style={styles.ckBottomTotal}>Rs. {grandTotal.toLocaleString("en-IN")}</Text>
              </View>
              <TouchableOpacity
                style={styles.ckPlaceBtn}
                onPress={handlePlaceOrder}
                activeOpacity={0.8}
              >
                <Text style={styles.ckPlaceBtnText}>
                  {paymentMethod === "RAZORPAY" ? "Pay & Place Order" : "Place Order"}
                </Text>
                <Icon name="arrow-forward" size={18} color={colors.white} />
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: colors.primary,
  },
  backButton: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: colors.white, marginLeft: 12 },
  headerBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  headerBadgeText: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.9)" },

  // Search
  searchWrapper: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingBottom: 14 },
  searchContainer: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.white,
    paddingHorizontal: 14, paddingVertical: 11,
    borderRadius: 12, gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, padding: 0 },
  clearButton: { padding: 4 },

  // Categories
  categoryWrapper: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: "#eef0f2" },
  categoryBar: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  categoryChip: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 24,
    backgroundColor: "#f0f2f5", borderWidth: 1, borderColor: "transparent",
  },
  categoryChipActive: { backgroundColor: "#eaf2f8", borderColor: colors.primary },
  categoryChipText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  categoryChipTextActive: { color: colors.primary },

  // Loading & Empty
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13, color: colors.textSecondary },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#f0f2f5", alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: colors.textSecondary, textAlign: "center", lineHeight: 19 },

  // Product List
  listContent: { padding: 16, gap: 12 },
  productCard: {
    flexDirection: "row", backgroundColor: colors.white, borderRadius: 14, padding: 14,
    elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, alignItems: "center",
  },
  imageContainer: { position: "relative" },
  productImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: "#f8f8f8" },
  productImagePlaceholder: { alignItems: "center", justifyContent: "center", backgroundColor: "#f0f2f5" },
  savingBadge: {
    position: "absolute", top: 4, left: 4, backgroundColor: "#e53935",
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  savingText: { fontSize: 9, fontWeight: "700", color: colors.white },
  productInfo: { flex: 1, marginLeft: 14 },
  productName: { fontSize: 15, fontWeight: "700", color: colors.text, lineHeight: 20 },
  productUnit: { fontSize: 12, color: colors.textSecondary, marginTop: 3, fontWeight: "500" },
  priceBlock: { flexDirection: "row", alignItems: "baseline", marginTop: 6, gap: 8 },
  wholesalePrice: { fontSize: 17, fontWeight: "800", color: "#27ae60" },
  retailPrice: { fontSize: 12, color: colors.textLight, textDecorationLine: "line-through", fontWeight: "500" },
  productCardOOS: { opacity: 0.85 },
  oosBadge: {
    position: "absolute", top: 4, left: 4, backgroundColor: "#424242",
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  oosText: { fontSize: 8, fontWeight: "700", color: colors.white, letterSpacing: 0.5 },
  stockRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  stockTextIn: { fontSize: 11, fontWeight: "600", color: "#27ae60" },
  stockTextLow: { fontSize: 11, fontWeight: "600", color: "#e67e22" },
  stockTextOOS: { fontSize: 11, fontWeight: "600", color: colors.error },
  oosButton: {
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10,
    backgroundColor: "#f0f0f0",
  },
  oosButtonText: { fontSize: 11, fontWeight: "600", color: colors.textLight },
  minQtyText: {
    fontSize: 10, color: colors.textLight, fontWeight: "500",
  },

  // Cart Controls
  cartControlContainer: { marginLeft: 10, alignItems: "center" },
  addButton: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.primary,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, gap: 4,
    elevation: 2, shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
  addButtonText: { fontSize: 13, fontWeight: "800", color: colors.white, letterSpacing: 0.5 },
  qtyControls: {
    flexDirection: "row", alignItems: "center", borderRadius: 10, overflow: "hidden",
    backgroundColor: colors.primary, elevation: 2, shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
  qtyButton: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  qtyDisplay: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 2 },
  qtyText: {
    fontSize: 15, fontWeight: "800", color: colors.white,
    minWidth: 28, textAlign: "center", paddingVertical: 6,
  },

  // Cart Footer
  orderFooter: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 14,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    elevation: 12, shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 8,
  },
  orderFooterLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  orderBadge: { position: "relative" },
  orderBadgeCount: {
    position: "absolute", top: -6, right: -8, backgroundColor: "#f39c12",
    width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center",
  },
  orderBadgeCountText: { fontSize: 10, fontWeight: "700", color: colors.white },
  orderFooterItems: { fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  orderFooterTotal: { fontSize: 18, fontWeight: "800", color: colors.white, marginTop: 1 },
  checkoutButton: {
    flexDirection: "row", backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12,
    alignItems: "center", gap: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)",
  },
  checkoutButtonText: { fontSize: 15, fontWeight: "700", color: colors.white },

  // ========== CHECKOUT MODAL ==========
  ckContainer: { flex: 1, backgroundColor: "#f5f7fa" },
  ckHeader: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 14,
  },
  ckBackBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  ckHeaderTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: colors.white, marginLeft: 12 },
  ckHeaderBadge: { fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: "500" },

  ckScroll: { flex: 1, padding: 16 },

  ckSectionTitle: {
    fontSize: 14, fontWeight: "700", color: colors.text,
    marginBottom: 10, marginTop: 6, textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Items Card
  ckItemsCard: {
    backgroundColor: colors.white, borderRadius: 14, padding: 16, marginBottom: 20,
    elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3,
  },
  ckItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  ckItemBorder: { borderBottomWidth: 1, borderBottomColor: "#f0f2f5" },
  ckItemLeft: { flex: 1 },
  ckItemName: { fontSize: 14, fontWeight: "600", color: colors.text },
  ckItemMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  ckItemTotal: { fontSize: 14, fontWeight: "700", color: colors.text, marginLeft: 12 },

  // Address
  ckInputCard: {
    backgroundColor: colors.white, borderRadius: 14, padding: 14, marginBottom: 20,
    elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3,
  },
  ckInputRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  ckAddressInput: {
    flex: 1, fontSize: 14, color: colors.text, padding: 0, minHeight: 40,
    textAlignVertical: "top",
  },
  ckNotesInput: {
    fontSize: 14, color: colors.text, padding: 0, minHeight: 60,
    textAlignVertical: "top",
  },

  // Payment Method
  ckPaymentCard: {
    backgroundColor: colors.white, borderRadius: 14, marginBottom: 20,
    elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, overflow: "hidden",
  },
  ckPayOption: {
    flexDirection: "row", alignItems: "center", padding: 16, gap: 12,
  },
  ckPayOptionActive: { backgroundColor: "#f8fbff" },
  ckPayRadio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: colors.primary, alignItems: "center", justifyContent: "center",
  },
  ckPayRadioFill: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary,
  },
  ckPayOptionInfo: { flex: 1 },
  ckPayOptionTitle: { fontSize: 15, fontWeight: "600", color: colors.text },
  ckPayOptionDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  ckPayDivider: { height: 1, backgroundColor: "#f0f2f5", marginHorizontal: 16 },

  // Price Details
  ckPriceCard: {
    backgroundColor: colors.white, borderRadius: 14, padding: 16, marginBottom: 20,
    elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3,
  },
  ckPriceRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingVertical: 6,
  },
  ckPriceLabel: { fontSize: 14, color: colors.textSecondary },
  ckPriceValue: { fontSize: 14, fontWeight: "600", color: colors.text },
  ckPriceDivider: { height: 1, backgroundColor: "#f0f2f5", marginVertical: 8 },
  ckPriceTotalLabel: { fontSize: 16, fontWeight: "700", color: colors.text },
  ckPriceTotalValue: { fontSize: 18, fontWeight: "800", color: colors.primary },

  // Warning
  ckWarning: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#fce4ec", padding: 14, borderRadius: 10, marginBottom: 16,
  },
  ckWarningText: { fontSize: 13, color: colors.error, flex: 1 },

  // Bottom Bar
  ckBottomBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.white, paddingHorizontal: 20, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: "#eef0f2",
    elevation: 8, shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 4,
  },
  ckBottomLabel: { fontSize: 12, color: colors.textSecondary },
  ckBottomTotal: { fontSize: 20, fontWeight: "800", color: colors.text, marginTop: 1 },
  ckPlaceBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 12,
  },
  ckPlaceBtnText: { fontSize: 15, fontWeight: "700", color: colors.white },

  // Placing
  ckPlacingContainer: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 40,
  },
  ckPlacingText: { fontSize: 18, fontWeight: "700", color: colors.text },
  ckPlacingSubtext: { fontSize: 13, color: colors.textSecondary },

  // Success
  ckSuccessContainer: {
    flex: 1, alignItems: "center", justifyContent: "center", padding: 32,
  },
  ckSuccessIcon: { marginBottom: 20 },
  ckSuccessTitle: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 8 },
  ckSuccessOrderId: { fontSize: 15, color: colors.textSecondary, fontWeight: "600", marginBottom: 4 },
  ckSuccessAmount: { fontSize: 28, fontWeight: "800", color: colors.primary, marginBottom: 24 },
  ckSuccessInfo: {
    backgroundColor: "#f5f7fa", borderRadius: 14, padding: 18, width: "100%",
    marginBottom: 32, gap: 12,
  },
  ckSuccessRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  ckSuccessRowText: { fontSize: 14, color: colors.textSecondary, flex: 1 },
  ckSuccessBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 12, width: "100%", justifyContent: "center", marginBottom: 12,
  },
  ckSuccessBtnText: { fontSize: 16, fontWeight: "700", color: colors.white },
  ckSuccessBtnOutline: {
    paddingVertical: 14, width: "100%", alignItems: "center",
    borderRadius: 12, borderWidth: 1, borderColor: colors.border,
  },
  ckSuccessBtnOutlineText: { fontSize: 15, fontWeight: "600", color: colors.textSecondary },
});
