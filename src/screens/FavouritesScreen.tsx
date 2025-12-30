// File: src/screens/FavouritesScreen.tsx
"use client";

import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../components/Icon";
import { colors } from "../theme/colors";
import { useUser } from "../context/UserContext";
import { useCart } from "../context/CartContext";
import { ProductCard } from "../components/ProductCard";
import { apiGetFavorites, type ApiProduct } from "../api";
import React from "react";

export const FavouritesScreen = ({ navigation }: any) => {
  const { favourites, toggleFavourite } = useUser();
  const { addToCart } = useCart();

  const [favProducts, setFavProducts] = React.useState<ApiProduct[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadFavs = async () => {
      try {
        setLoading(true);
        const data = await apiGetFavorites();
        setFavProducts(data);
      } catch {
        setFavProducts([]);
      } finally {
        setLoading(false);
      }
    };
    loadFavs();
  }, []);

  const handleAddToCart = (product: ApiProduct) => {
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
    const firstVariant = variants[0];

    const basePrice = firstVariant.price;
    const finalPrice = product.sponsor
      ? Math.round(
          basePrice *
            (1 - product.sponsor.discountPercent / 100)
        )
      : basePrice;

    addToCart({
      id: `${product._id}-${firstVariant._id || firstVariant.name}`,
      productId: product._id,
      name: product.name,
      variantName: firstVariant.name,
      price: finalPrice,
      image: product.image,
    });
  };

  const mappedProducts = favProducts.map(p => ({
    id: p._id,
    name: p.name,
    category: p.category,
    description: p.description || "",
    image: p.image || "",
    price: p.sellingPrice ?? p.price,
    rating: p.rating ?? 4.5,
    isVeg: p.isVeg ?? true,
    unit: p.unit || "",
    variants: p.variants?.map(v => ({
      id: v._id,
      name: v.name,
      price: v.price,
    })),
    sponsor: p.sponsor
      ? {
          shopId: p.sponsor.shopId,
          shopName: p.sponsor.shopName,
          discountPercent: p.sponsor.discountPercent,
          area: p.sponsor.area,
        }
      : undefined,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F8F8" />

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
        <Text style={styles.headerTitle}>Favourites</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>❤️</Text>
          <Text style={styles.emptyTitle}>Loading...</Text>
        </View>
      ) : mappedProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>❤️</Text>
          <Text style={styles.emptyTitle}>
            No favourites yet
          </Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart on a product to add it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={mappedProducts}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              isFavourite={favourites.includes(item.id)}
              onPress={() => navigation.navigate("ProductDetail", {
                product: {
                  _id: item.id,
                  name: item.name,
                  category: item.category,
                  description: item.description,
                  image: item.image,
                  price: item.price,
                  sellingPrice: item.price,
                  rating: item.rating,
                  isVeg: item.isVeg,
                  unit: item.unit,
                  variants: item.variants?.map(v => ({
                    _id: v.id,
                    name: v.name,
                    price: v.price,
                  })),
                  sponsor: item.sponsor
                    ? {
                      shopId: item.sponsor.shopId,
                      shopName: item.sponsor.shopName,
                      discountPercent: item.sponsor.discountPercent,
                      area: item.sponsor.area,
                    }
                    : undefined,
                } as ApiProduct,
              })}
              onAddToCart={() => handleAddToCart(
                {
                  _id: item.id,
                  name: item.name,
                  category: item.category,
                  description: item.description,
                  image: item.image,
                  price: item.price,
                  sellingPrice: item.price,
                  rating: item.rating,
                  isVeg: item.isVeg,
                  unit: item.unit,
                  variants: item.variants?.map(v => ({
                    _id: v.id,
                    name: v.name,
                    price: v.price,
                  })),
                  sponsor: item.sponsor
                    ? {
                      shopId: item.sponsor.shopId,
                      shopName: item.sponsor.shopName,
                      discountPercent: item.sponsor.discountPercent,
                      area: item.sponsor.area,
                    }
                    : undefined,
                } as ApiProduct
              )}
              onOrderNow={() => navigation.navigate("ProductDetail", {
                product: {
                  _id: item.id,
                  name: item.name,
                  category: item.category,
                  description: item.description,
                  image: item.image,
                  price: item.price,
                  sellingPrice: item.price,
                  rating: item.rating,
                  isVeg: item.isVeg,
                  unit: item.unit,
                  variants: item.variants?.map(v => ({
                    _id: v.id,
                    name: v.name,
                    price: v.price,
                  })),
                  sponsor: item.sponsor
                    ? {
                      shopId: item.sponsor.shopId,
                      shopName: item.sponsor.shopName,
                      discountPercent: item.sponsor.discountPercent,
                      area: item.sponsor.area,
                    }
                    : undefined,
                } as ApiProduct,
              })}
              onToggleFavourite={() => toggleFavourite(item.id)} onIncrease={function (): void {
                throw new Error("Function not implemented.");
              } } onDecrease={function (): void {
                throw new Error("Function not implemented.");
              } }            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightBackground,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
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
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 24,
  },
});

export default FavouritesScreen;
