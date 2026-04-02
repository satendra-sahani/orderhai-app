// src/components/ProductCard.tsx
"use client";

import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Icon } from "./Icon";
import type { Product } from "../types";
import { colors } from "../theme/colors";

interface ProductCardProps {
  product: Product;
  isFavourite: boolean;
  cartQty?: number;
  onPress: () => void;
  onAddToCart: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
  onOrderNow: () => void;
  onToggleFavourite: () => void;
}

export const ProductCard = ({
  product,
  isFavourite,
  cartQty = 0,
  onPress,
  onAddToCart,
  onIncrease,
  onDecrease,
  onOrderNow,
  onToggleFavourite,
}: ProductCardProps) => {
  const basePrice =
    product.variants && product.variants.length > 0
      ? Math.min(...product.variants.map(v => v.price))
      : product.price;
  const discountedPrice = product.sponsor
    ? Math.round(
        basePrice *
          (1 - product.sponsor.discountPercent / 100)
      )
    : basePrice;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.92}
      onPress={onPress}
    >
      {/* Image area */}
      <View style={styles.imageContainer}>
        {!!product.image && (
          <Image
            source={{ uri: product.image }}
            style={styles.image}
          />
        )}

        {/* veg / non-veg indicator */}
        <View style={styles.vegIndicatorContainer}>
          <View
            style={[
              styles.vegIndicator,
              product.isVeg ? styles.vegBorder : styles.nonVegBorder,
            ]}
          >
            <View
              style={product.isVeg ? styles.vegDot : styles.nonVegDot}
            />
          </View>
        </View>

        {/* discount badge */}
        {product.sponsor && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              {product.sponsor.discountPercent}%
            </Text>
            <Text style={styles.discountOff}>OFF</Text>
          </View>
        )}

        {/* favourite */}
        <TouchableOpacity
          style={[styles.favButton, isFavourite && styles.favButtonActive]}
          onPress={onToggleFavourite}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon
            name={isFavourite ? "heart" : "heart-outline"}
            size={14}
            color={isFavourite ? "#FF4B4B" : "#999"}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Rating row */}
        {product.rating && (
          <View style={styles.ratingContainer}>
            <Icon name="star" size={10} color="#F39C12" />
            <Text style={styles.ratingText}>
              {product.rating.toFixed(1)}
            </Text>
          </View>
        )}

        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        {product.unit && (
          <Text style={styles.unit}>{product.unit}</Text>
        )}

        {/* Price + Cart controls */}
        <View style={styles.priceRow}>
          <View style={styles.priceColumn}>
            <Text style={styles.price}>₹{discountedPrice}</Text>
            {product.sponsor && (
              <Text style={styles.originalPrice}>₹{basePrice}</Text>
            )}
          </View>

          {/* Cart stepper */}
          {cartQty > 0 ? (
            <View style={styles.cartStepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={onDecrease}
              >
                <Icon name="remove" size={14} color={colors.white} />
              </TouchableOpacity>
              <Text style={styles.stepperQty}>{cartQty}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={onIncrease}
              >
                <Icon name="add" size={14} color={colors.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={onAddToCart}
            >
              <Icon name="add" size={14} color={colors.primary} />
              <Text style={styles.addButtonText}>ADD</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Order Now CTA */}
        <TouchableOpacity
          style={styles.orderButton}
          onPress={onOrderNow}
          activeOpacity={0.85}
        >
          <Text style={styles.orderButtonText}>Order Now</Text>
          <Icon name="arrow-forward" size={11} color={colors.white} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 4,
    marginBottom: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    flex: 1,
    maxWidth: "48%",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1.15,
    backgroundColor: "#fafbfc",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  vegIndicatorContainer: {
    position: "absolute",
    top: 8,
    left: 8,
  },
  vegIndicator: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1.5,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  vegBorder: { borderColor: colors.success },
  nonVegBorder: { borderColor: colors.error },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  nonVegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.error,
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: "center",
  },
  discountText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "900",
    lineHeight: 12,
  },
  discountOff: {
    color: colors.white,
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  favButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },
  favButtonActive: {
    backgroundColor: "#FFF0F0",
  },
  content: {
    padding: 10,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#F39C12",
  },
  name: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
    lineHeight: 16,
  },
  unit: {
    fontSize: 10,
    color: colors.textLight,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  priceColumn: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.text,
  },
  originalPrice: {
    fontSize: 11,
    color: "#bbb",
    textDecorationLine: "line-through",
  },
  // Cart stepper (when item in cart)
  cartStepper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: colors.primary,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperQty: {
    paddingHorizontal: 8,
    fontSize: 13,
    fontWeight: "800",
    color: colors.white,
  },
  // Add button (when not in cart)
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  addButtonText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  // Order Now button
  orderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    paddingVertical: 7,
    backgroundColor: colors.primary,
  },
  orderButtonText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: 0.3,
  },
});
