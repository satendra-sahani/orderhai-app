// File: src/screens/ProductDetailScreen.tsx
"use client";

import { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { Icon } from "../components/Icon";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
import { useUser } from "../context/UserContext";
import { colors } from "../theme/colors";
import type { ApiProduct } from "../api";

export const ProductDetailScreen = ({ route, navigation }: any) => {
  const product = route.params.product as ApiProduct;

  const { addToCart } = useCart();
  const { favourites, toggleFavourite } = useUser();

  const variants =
    product.variants && product.variants.length > 0
      ? product.variants
      : [
          {
            _id: product._id,
            name: "Regular",
            price: product.sellingPrice ?? product.price,
          },
        ];

  const [selectedVariant, setSelectedVariant] = useState(
    variants[0]
  );

  const getDiscountedPrice = (price: number) => {
    if (product.sponsor) {
      return Math.round(
        price * (1 - product.sponsor.discountPercent / 100)
      );
    }
    return price;
  };

  const handleAddToCart = () => {
    const finalPrice = getDiscountedPrice(selectedVariant.price);
    addToCart({
      id: `${product._id}-${selectedVariant._id || selectedVariant.name}`,
      productId: product._id,
      name: product.name,
      variantName: selectedVariant.name,
      price: finalPrice,
      image: product.image,
    });
  };

  const handleOrderNow = () => {
    handleAddToCart();
    navigation.navigate("Cart");
  };

  const finalPrice = getDiscountedPrice(selectedVariant.price);
  const isVeg = product?.isVeg !== false;
  const isLiked = favourites.includes(product._id);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primary}
      />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity
          onPress={() => toggleFavourite(product._id)}
          style={styles.iconButton}
        >
          <Icon
            name={isLiked ? "heart" : "heart-outline"}
            size={22}
            color={isLiked ? "#FF4D67" : colors.white}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Product image */}
        <View style={styles.imageContainer}>
          {product.image ? (
            <Image
              source={{ uri: product.image }}
              style={styles.image}
            />
          ) : null}

          {/* Veg / non-veg */}
          <View style={styles.vegIndicatorContainer}>
            <View
              style={[
                styles.vegIndicator,
                isVeg ? styles.vegBorder : styles.nonVegBorder,
              ]}
            >
              <View
                style={[
                  styles.vegDot,
                  isVeg
                    ? styles.vegDotColor
                    : styles.nonVegDotColor,
                ]}
              />
            </View>
          </View>

          {/* Discount badge */}
          {product.sponsor && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {product.sponsor.discountPercent}% OFF
              </Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.productName}>{product.name}</Text>

          <View style={styles.metaRow}>
            <View style={styles.ratingContainer}>
              <Icon
                name="star"
                size={14}
                color="#FFC107"
              />
              <Text style={styles.ratingText}>
                {product.rating ?? 4.5}
              </Text>
            </View>
            {product.unit && (
              <Text style={styles.unit}>{product.unit}</Text>
            )}
          </View>

          {product.description ? (
            <Text style={styles.description}>
              {product.description}
            </Text>
          ) : null}

          {product.sponsor && (
            <View style={styles.sponsorCard}>
              <Icon
                name="restaurant"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.sponsorText}>
                By {product.sponsor.shopName} •{" "}
                {product.sponsor.area}
              </Text>
            </View>
          )}

          {/* Variants */}
          <View style={styles.variantSection}>
            <Text style={styles.variantTitle}>
              Select Quantity
            </Text>
            {variants.map(variant => {
              const discounted = getDiscountedPrice(
                variant.price
              );
              const isSelected =
                selectedVariant._id === variant._id;

              return (
                <TouchableOpacity
                  key={variant._id}
                  onPress={() => setSelectedVariant(variant)}
                  style={[
                    styles.variantOption,
                    isSelected &&
                      styles.variantOptionSelected,
                  ]}
                >
                  <View style={styles.variantLeft}>
                    <View
                      style={[
                        styles.radio,
                        isSelected && styles.radioSelected,
                      ]}
                    >
                      {isSelected && (
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: colors.primary,
                          }}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.variantName,
                        isSelected &&
                          styles.variantNameSelected,
                      ]}
                    >
                      {variant.name}
                    </Text>
                  </View>

                  <View style={styles.variantRight}>
                    <View style={styles.priceRow}>
                      {product.sponsor && (
                        <Text style={styles.originalPrice}>
                          ₹{variant.price}
                        </Text>
                      )}
                      <Text style={styles.variantPrice}>
                        ₹{discounted}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Bottom bar with Add to Cart + Order Now */}
      <View style={styles.bottomBar}>
        <View style={styles.priceSection}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>₹{finalPrice}</Text>
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleAddToCart}
          >
            <Text style={styles.secondaryButtonText}>
              Add to Cart
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleOrderNow}
          >
            <Icon
              name="bag-handle"
              size={16}
              color={colors.white}
            />
            <Text style={styles.primaryButtonText}>
              Order Now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.primary,
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
    color: colors.white,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: colors.white,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  vegIndicatorContainer: {
    position: "absolute",
    top: 16,
    left: 16,
  },
  vegIndicator: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2.5,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  vegBorder: {
    borderColor: colors.success,
  },
  nonVegBorder: {
    borderColor: colors.error,
  },
  vegDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  vegDotColor: {
    backgroundColor: colors.success,
  },
  nonVegDotColor: {
    backgroundColor: colors.error,
  },
  discountBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  discountText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
  },
  infoContainer: {
    padding: 16,
    backgroundColor: colors.white,
    marginTop: 8,
  },
  productName: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF8E7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  unit: {
    fontSize: 13,
    color: colors.textLight,
    fontWeight: "600",
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  sponsorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  sponsorText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  variantSection: {
    marginTop: 8,
  },
  variantTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 14,
  },
  variantOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderWidth: 2,
    borderColor: "#f0f0f0",
    borderRadius: 12,
    marginBottom: 10,
  },
  variantOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  variantLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  radioSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  variantName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  variantNameSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  variantRight: {
    alignItems: "flex-end",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  originalPrice: {
    fontSize: 13,
    color: "#999",
    textDecorationLine: "line-through",
  },
  variantPrice: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.primary,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    elevation: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  priceSection: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.text,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.white,
  },
});

export default ProductDetailScreen;
