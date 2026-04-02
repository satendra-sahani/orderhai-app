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

const NANDINI_LOGO = "https://www.kmfnandini.coop/_next/static/media/logo.00aae0f8.png";
const KMF_CORPO_LOGO = "https://www.kmfnandini.coop/_next/static/media/corpo-logo.e8b2acaf.jpg";

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
      {/* Top header bar with logos */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Image
            source={{ uri: NANDINI_LOGO }}
            style={styles.nandiniLogo}
            resizeMode="contain"
          />
          <Image
            source={{ uri: KMF_CORPO_LOGO }}
            style={styles.corpoLogo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.topBarRight}>
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
              size={20}
              color={
                isLoggedIn
                  ? colors.primary
                  : colors.textSecondary
              }
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Greeting + location */}
      <View style={styles.greetingHeader}>
        <View style={styles.greetingTextContainer}>
          <Text style={styles.greetingText}>
            {isLoggedIn
              ? `Hey ${user?.name || "there"}, good morning!`
              : "Hey There, good morning!"}
          </Text>
          <View style={styles.locationRow}>
            <Icon
              name="location"
              size={12}
              color={colors.accent}
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

        {/* Toll-free number */}
        <View style={styles.tollFreeChip}>
          <Icon name="call" size={11} color="#16A34A" />
          <Text style={styles.tollFreeText}>1800 425 8030</Text>
        </View>
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
            placeholder="Search for dairy products"
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

      {/* Hero banner */}
      <View style={styles.heroBanner}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>
            Farm-Fresh Dairy
          </Text>
          <Text style={styles.heroTitle}>
            Delivered Daily
          </Text>
          <Text style={styles.heroSubtitle}>
            Karnataka's most trusted dairy brand
          </Text>
          <TouchableOpacity style={styles.heroButton}>
            <Text style={styles.heroButtonText}>
              Shop Now
            </Text>
            <Icon name="arrow-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <Image
          source={{ uri: "https://kmf-website.s3.ap-south-1.amazonaws.com/1_milk_e6b56b2233.png" }}
          style={styles.heroImage}
          resizeMode="contain"
        />
      </View>

      {/* Trust badges */}
      <View style={styles.trustBadges}>
        {[
          { icon: "shield-checkmark", label: "100% Fresh", color: "#16A34A" },
          { icon: "car", label: "Farm to Door", color: colors.primary },
          { icon: "gift", label: "Free Delivery ≥₹199", color: colors.accent },
        ].map(badge => (
          <View key={badge.label} style={styles.trustBadge}>
            <Icon name={badge.icon} size={16} color={badge.color} />
            <Text style={styles.trustBadgeText}>{badge.label}</Text>
          </View>
        ))}
      </View>

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
                              ? "#16A34A"
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

      {/* Subscription banner */}
      <TouchableOpacity
        style={styles.subscriptionBanner}
        onPress={() =>
          navigation.navigate("CreateSubscription")
        }
      >
        <View style={styles.subscriptionBannerContent}>
          <View style={styles.subIconWrap}>
            <Icon
              name="repeat"
              size={20}
              color={colors.white}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.subscriptionBannerTitle}>
              Subscribe for daily milk delivery
            </Text>
            <Text style={styles.subscriptionBannerSubtext}>
              Never run out of essentials
            </Text>
          </View>
          <Icon
            name="arrow-forward"
            size={18}
            color={colors.white}
          />
        </View>
      </TouchableOpacity>

      {/* Quick actions — dairy specific */}
      <View style={styles.quickActions}>
        {[
          { emoji: "🥛", title: "Daily Milk", subtitle: "Fresh & Pure" },
          { emoji: "🍦", title: "Ice Cream", subtitle: "Cool Treats" },
          { emoji: "🧈", title: "Butter & Ghee", subtitle: "Farm Fresh" },
          { emoji: "🧀", title: "Cheese", subtitle: "Pure Dairy" },
        ].map(item => (
          <TouchableOpacity key={item.title} style={styles.quickActionCard}>
            <Text style={styles.quickActionEmoji}>{item.emoji}</Text>
            <Text style={styles.quickActionTitle}>{item.title}</Text>
            <Text style={styles.quickActionSubtitle}>{item.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Section header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          All Products
        </Text>
        <Text style={styles.productCount}>
          {filteredProducts.length} items
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
        backgroundColor={colors.white}
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
              🥛
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
  // ===== TOP BAR =====
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nandiniLogo: {
    width: 48,
    height: 40,
  },
  corpoLogo: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  loginButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
  },
  // ===== GREETING =====
  greetingHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
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
  tollFreeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tollFreeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#16A34A",
  },
  // ===== SEARCH =====
  searchSection: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
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
  // ===== HERO BANNER =====
  heroBanner: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
    height: 140,
  },
  heroContent: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.white,
    lineHeight: 22,
  },
  heroSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    marginBottom: 10,
  },
  heroButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  heroButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.primary,
  },
  heroImage: {
    width: 120,
    height: 140,
  },
  // ===== TRUST BADGES =====
  trustBadges: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  trustBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: colors.white,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  trustBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text,
  },
  // ===== RECENT ORDERS =====
  recentOrdersSection: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
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
    borderColor: "#E8E8E8",
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
  // ===== SUBSCRIPTION =====
  subscriptionBanner: {
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    overflow: "hidden",
  },
  subscriptionBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  subIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  subscriptionBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },
  subscriptionBannerSubtext: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  // ===== QUICK ACTIONS =====
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  quickActionCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  quickActionEmoji: { fontSize: 24, marginBottom: 4 },
  quickActionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  quickActionSubtitle: {
    fontSize: 9,
    color: colors.textLight,
    textAlign: "center",
    marginTop: 1,
  },
  // ===== SECTION HEADER =====
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.lightBackground,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productCount: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  // ===== LIST =====
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
  // ===== BOTTOM NAV =====
  bottomNav: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
    paddingVertical: 6,
    paddingHorizontal: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
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
    right: -6,
    backgroundColor: colors.error,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },
  cartBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
});
