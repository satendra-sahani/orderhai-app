// src/screens/HomeScreen.tsx

"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "../components/Icon";
import { CategoryBar } from "../components/CategoryBar";
import { colors } from "../theme/colors";
import { useCart } from "../context/CartContext";
import { useUser } from "../context/UserContext";
import type { Product } from "../types";
import { HomeSkeleton } from "../components/skeltons/HomeSkeleton";
import { ProductCard } from "../components/ProductCard";
import { API_BASE } from "../api";

export const HomeScreen = ({ navigation }: any) => {
  const {
    addToCart,
    getTotalItems,
    orders,
    cartItems,
    getItemQuantity,
    updateQuantity,
  } = useCart();
  const {
    user,
    isLoggedIn,
    favourites,
    toggleFavourite,
  } = useUser();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] =
    useState("All");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] =
    useState<string[]>([]);
  const [loadingProducts, setLoadingProducts] =
    useState(true);
  const [productsError, setProductsError] =
    useState<string | null>(null);
  const [showSkeleton, setShowSkeleton] =
    useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  // skeleton shimmer timing
  useEffect(() => {
    const t = setTimeout(
      () => setShowSkeleton(false),
      500
    );
    return () => clearTimeout(t);
  }, []);

  // load products from API
  const loadProducts = async () => {
    try {
      setProductsError(null);
      if (!refreshing) {
        setLoadingProducts(true);
      }
      const res = await fetch(`${API_BASE}/api/products`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.message || "Failed to load products"
        );
      }

      // ensure product.id matches favourite ids (id or _id)
      const list: Product[] = (data as any[]).map(
        p =>
          ({
            ...p,
            id: p.id || p._id,
          } as Product)
      );
      setProducts(list);

      const uniqueCats = Array.from(
        new Set(
          list.map(p => p.category).filter(Boolean)
        )
      );
      setCategories(uniqueCats);
    } catch (err: any) {
      setProductsError(
        err.message ||
          "Network error while loading products"
      );
    } finally {
      setLoadingProducts(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        product.name.toLowerCase().includes(q) ||
        (product.description || "")
          .toLowerCase()
          .includes(q);
      const matchesCategory =
        activeCategory === "All" ||
        product.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, activeCategory]);

  const handleProductPress = useCallback(
    (product: Product) => {
      navigation.navigate("ProductDetail", {
        product,
      });
    },
    [navigation]
  );

  const handleAddToCartFromHome = useCallback(
    (product: Product) => {
      if (!isLoggedIn) {
        Alert.alert(
          "Login required",
          "Please login to add items to cart.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Login",
              onPress: () =>
                navigation.navigate("Login"),
            },
          ]
        );
        return;
      }

      const variants =
        product.variants &&
        product.variants.length > 0
          ? product.variants
          : [
              {
                id: product.id,
                name: "Regular",
                price: product.price,
              },
            ];
      const firstVariant = variants[0];

      const finalPrice = product.sponsor
        ? Math.round(
            firstVariant.price *
              (1 -
                product.sponsor
                  .discountPercent / 100)
          )
        : firstVariant.price;

      addToCart({
        id: `${product.id}-${firstVariant.id}`,
        productId: product.id,
        name: product.name,
        variantName: firstVariant.name,
        price: finalPrice,
        image: product.image,
      });
    },
    [isLoggedIn, addToCart, navigation]
  );

  const handleIncrease = (product: Product) => {
    const variants =
      product.variants &&
      product.variants.length > 0
        ? product.variants
        : [
            {
              id: product.id,
              name: "Regular",
              price: product.price,
            },
          ];
    const firstVariant = variants[0];

    const existing = cartItems.find(
      i =>
        i.productId === product.id &&
        i.variantName === firstVariant.name
    );

    if (existing) {
      updateQuantity(
        existing.id,
        existing.quantity + 1
      );
    } else {
      handleAddToCartFromHome(product);
    }
  };

  const handleDecrease = (product: Product) => {
    const variants =
      product.variants &&
      product.variants.length > 0
        ? product.variants
        : [
            {
              id: product.id,
              name: "Regular",
              price: product.price,
            },
          ];
    const firstVariant = variants[0];

    const existing = cartItems.find(
      i =>
        i.productId === product.id &&
        i.variantName === firstVariant.name
    );

    if (existing) {
      updateQuantity(
        existing.id,
        existing.quantity - 1
      );
    }
  };

  const handleToggleFavouriteFromHome =
    useCallback(
      (product: Product) => {
        if (!isLoggedIn) {
          Alert.alert(
            "Login required",
            "Please login to save favourites.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Login",
                onPress: () =>
                  navigation.navigate("Login"),
              },
            ]
          );
          return;
        }
        // this only affects that product.id
        toggleFavourite(product.id);
      },
      [isLoggedIn, toggleFavourite, navigation]
    );

  const recentOrders = orders.slice(0, 3);

  if (showSkeleton || loadingProducts) {
    return <HomeSkeleton />;
  }

  const renderHeader = () => (
    <>
      {/* Greeting + profile */}
      <View style={styles.greetingHeader}>
        <TouchableOpacity
          style={styles.avatarCircle}
          onPress={() =>
            isLoggedIn
              ? navigation.navigate("Profile")
              : navigation.navigate("Login")
          }
        >
          <Icon
            name="person"
            size={22}
            color={
              isLoggedIn
                ? colors.primary
                : colors.textSecondary
            }
          />
        </TouchableOpacity>

        <View style={styles.greetingTextContainer}>
          <Text style={styles.greetingText}>
            {isLoggedIn
              ? `Hey ${
                  user?.name || "there"
                }, good morning!`
              : "Hey There, good morning!"}
          </Text>
          <View style={styles.locationRow}>
            <Icon
              name="location"
              size={12}
              color={colors.textSecondary}
            />
            <Text
              style={styles.greetingSubtext}
              numberOfLines={1}
            >
              {isLoggedIn
                ? user?.location.address
                : "Set delivery location"}
            </Text>
          </View>
        </View>

        {!isLoggedIn && (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() =>
              navigation.navigate("Login")
            }
          >
            <Text style={styles.loginButtonText}>
              Login
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Icon
            name="search"
            size={18}
            color={colors.textSecondary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for dishes or groceries"
            placeholderTextColor={colors.textLight}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          <Icon
            name="filter"
            size={18}
            color={colors.textSecondary}
          />
        </View>
      </View>

      {/* Error banner */}
      {productsError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>
            {productsError}
          </Text>
        </View>
      )}

      {/* Recent orders */}
      {isLoggedIn && recentOrders.length > 0 && (
        <View style={styles.recentOrdersSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              Recent Orders
            </Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("Orders")
              }
            >
              <Text style={styles.seeAllText}>
                See All
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.recentOrdersContainer}>
            {recentOrders.map(order => (
              <TouchableOpacity
                key={order.id}
                style={styles.recentOrderCard}
                onPress={() =>
                  navigation.navigate("Orders")
                }
              >
                <View
                  style={styles.recentOrderHeader}
                >
                  <Text
                    style={styles.recentOrderId}
                  >
                    #{order?.orderId ? order?.orderId.slice(-6) : ""}
                  </Text>
                  <View
                    style={[
                      styles.recentOrderBadge,
                      {
                        backgroundColor:
                          order.status ===
                          "DELIVERED"
                            ? "#E8F5E9"
                            : "#FFF3E0",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.recentOrderBadgeText,
                        {
                          color:
                            order.status ===
                            "DELIVERED"
                              ? colors.primary
                              : "#FF9800",
                        },
                      ]}
                    >
                      {order.status}
                    </Text>
                  </View>
                </View>
                <Text
                  style={styles.recentOrderItems}
                >
                  {order.items.length} item
                  {order.items.length > 1
                    ? "s"
                    : ""}
                </Text>
                <Text
                  style={styles.recentOrderTotal}
                >
                  ₹{order.total}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Brand banner */}
      <View style={styles.brandBanner}>
        <View style={styles.brandRow}>
          <Text
            style={[
              styles.brandText,
              styles.brandGreen,
            ]}
          >
            Order
          </Text>
          <Text
            style={[
              styles.brandText,
              styles.brandYellow,
            ]}
          >
            Hai
          </Text>
          <Text style={styles.brandEmoji}>🍽️</Text>
        </View>
        <Text style={styles.brandSubtext}>
          Unlock free deliveries, special offers &
          more!
        </Text>
      </View>

      {/* Quick actions */}
      <View style={styles.quickActions}>
        <View style={styles.quickActionCard}>
          <View style={styles.quickActionIcon}>
            <Text style={styles.quickActionEmoji}>
              🔥
            </Text>
          </View>
          <View>
            <Text style={styles.quickActionTitle}>
              Offers
            </Text>
            <Text
              style={styles.quickActionSubtitle}
            >
              Hot Deals
            </Text>
          </View>
        </View>
        <View style={styles.quickActionCard}>
          <View style={styles.quickActionIcon}>
            <Text style={styles.quickActionEmoji}>
              🛍️
            </Text>
          </View>
          <View>
            <Text style={styles.quickActionTitle}>
              Grocery
            </Text>
            <Text
              style={styles.quickActionSubtitle}
            >
              Fresh Daily
            </Text>
          </View>
        </View>
      </View>

      {/* Promo */}
      <View style={styles.promoBanner}>
        <View style={styles.promoContent}>
          <Text style={styles.promoTitle}>
            SOUTH INDIAN SPECIALS
          </Text>
          <Text style={styles.promoSubtitle}>
            Enjoy the season's offers
          </Text>
          <TouchableOpacity
            style={styles.promoButton}
          >
            <Text
              style={styles.promoButtonText}
            >
              ORDER NOW
            </Text>
          </TouchableOpacity>
        </View>
        <Image
          style={styles.promoImage}
          source={{
            uri: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=400",
          }}
        />
      </View>

      {/* Section header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          What's on your mind,{" "}
          {isLoggedIn ? user?.name : "Huh"}!!
        </Text>
      </View>

      {/* Categories */}
      <CategoryBar
        categories={["All", ...categories]}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.lightBackground}
      />

      <FlatList
        data={filteredProducts}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            isFavourite={favourites.includes(
              item.id
            )}
            cartQty={getItemQuantity(item.id)}
            onPress={() =>
              handleProductPress(item)
            }
            onAddToCart={() =>
              handleAddToCartFromHome(item)
            }
            onIncrease={() =>
              handleIncrease(item)
            }
            onDecrease={() =>
              handleDecrease(item)
            }
            onOrderNow={() =>
              handleProductPress(item)
            }
            onToggleFavourite={() =>
              handleToggleFavouriteFromHome(
                item
              )
            }
          />
        )}
        keyExtractor={(item, index) =>
          `${item.id}-${index}`
        }
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={
          styles.listContent
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>
              🍽️
            </Text>
            <Text style={styles.emptyTitle}>
              No items found
            </Text>
            <Text
              style={styles.emptySubtitle}
            >
              Try a different search or category
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
        >
          <Icon
            name="home"
            size={20}
            color={colors.primary}
          />
          <Text
            style={[
              styles.navText,
              styles.navTextActive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            navigation.navigate("Favourites")
          }
        >
          <Icon
            name="heart"
            size={20}
            color={colors.textLight}
          />
          <Text style={styles.navText}>
            Favourite
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            navigation.navigate("Orders")
          }
        >
          <Icon
            name="list"
            size={20}
            color={colors.textLight}
          />
          <Text style={styles.navText}>
            My Orders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
        >
          <Icon
            name="notifications"
            size={20}
            color={colors.textLight}
          />
          <Text style={styles.navText}>
            Notification
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            navigation.navigate("Cart")
          }
        >
          <View>
            <Icon
              name="cart"
              size={20}
              color={colors.textLight}
            />
            {getTotalItems() > 0 && (
              <View style={styles.cartBadge}>
                <Text
                  style={styles.cartBadgeText}
                >
                  {getTotalItems()}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.navText}>
            Cart
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightBackground,
  },
  greetingHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  greetingTextContainer: { flex: 1 },
  greetingText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  greetingSubtext: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  loginButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
  },
  searchSection: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },
  errorBanner: {
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 12,
    color: "#D32F2F",
  },
  recentOrdersSection: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  recentOrdersContainer: {
    flexDirection: "row",
    gap: 10,
  },
  recentOrderCard: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  recentOrderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recentOrderId: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  recentOrderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recentOrderBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  recentOrderItems: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  recentOrderTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  brandBanner: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  brandText: {
    fontSize: 22,
    fontWeight: "900",
  },
  brandGreen: { color: colors.primary },
  brandYellow: { color: "#FFB800" },
  brandEmoji: { fontSize: 22, marginLeft: 8 },
  brandSubtext: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: "center",
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  quickActionCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF8E7",
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionEmoji: { fontSize: 22 },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  quickActionSubtitle: {
    fontSize: 10,
    color: colors.textLight,
  },
  promoBanner: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    height: 120,
  },
  promoContent: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  promoTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.white,
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 10,
  },
  promoButton: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  promoButtonText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary,
  },
  promoImage: {
    width: 120,
    height: 120,
    resizeMode: "cover",
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.lightBackground,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 80,
  },
  row: {
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  navText: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 2,
    fontWeight: "600",
  },
  navTextActive: {
    color: colors.primary,
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: colors.white,
  },
  cartBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
});
