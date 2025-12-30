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
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
        {!!product.image && (
          <Image
            source={{ uri: product.image }}
            style={styles.image}
          />
        )}

        {/* veg / non-veg */}
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

        {/* discount */}
        {product.sponsor && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              {product.sponsor.discountPercent}%
            </Text>
          </View>
        )}

        {/* favourite */}
        <TouchableOpacity
          style={styles.favButton}
          onPress={onToggleFavourite}
        >
          <Icon
            name={isFavourite ? "heart" : "heart-outline"}
            size={16}
            color={isFavourite ? "#FF4B4B" : colors.white}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        {product.unit && (
          <Text style={styles.unit}>{product.unit}</Text>
        )}

        <View style={styles.priceRow}>
          <View style={styles.priceLine}>
            <Text style={styles.price}>₹{discountedPrice}</Text>
            {product.sponsor && (
              <Text style={styles.originalPrice}>₹{basePrice}</Text>
            )}
          </View>

          {/* cart control: + / - / count */}
          {cartQty > 0 ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.primary,
                overflow: "hidden",
              }}
            >
              <TouchableOpacity
                style={styles.addIconButton}
                onPress={onDecrease}
              >
                <Icon
                  name="remove"
                  size={16}
                  color={colors.white}
                />
              </TouchableOpacity>
              <Text
                style={{
                  paddingHorizontal: 8,
                  fontSize: 12,
                  fontWeight: "700",
                  color: colors.text,
                }}
              >
                {cartQty}
              </Text>
              <TouchableOpacity
                style={styles.addIconButton}
                onPress={onIncrease}
              >
                <Icon
                  name="add"
                  size={16}
                  color={colors.white}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addIconButton}
              onPress={onAddToCart}
            >
              <Icon
                name="add"
                size={16}
                color={colors.white}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.ratingContainer}>
          <Icon name="star" size={12} color="#FFC107" />
          <Text style={styles.ratingText}>
            {product.rating?.toFixed(1) || "4.5"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.orderButton}
          onPress={onOrderNow}
        >
          <Text style={styles.orderButtonText}>
            Order Now
          </Text>
          <Icon
            name="arrow-forward"
            size={12}
            color={colors.white}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // keep all your existing styles block unchanged
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 4,
    marginBottom: 8,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    flex: 1,
    maxWidth: "48%",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1.1,
    backgroundColor: "#f5f5f5",
    position: "relative",
  },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
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
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  discountText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "900",
  },
  favButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 8 },
  name: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
    lineHeight: 16,
  },
  unit: {
    fontSize: 10,
    color: colors.textLight,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  priceLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
    flex: 1,
  },
  price: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  originalPrice: {
    fontSize: 10,
    color: "#999",
    textDecorationLine: "line-through",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  addIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  orderButton: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    paddingVertical: 6,
    backgroundColor: colors.primary,
  },
  orderButtonText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.white,
  },
});
