// src/screens/admin/AdminProductsScreen.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  FlatList,
  TextInput,
  Modal,
  Switch,
  Image,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "../../components/Icon";
import { colors } from "../../theme/colors";
import {
  DUMMY_PRODUCTS,
  PRODUCT_CATEGORIES,
  type AdminProduct,
} from "../../data/adminDummyData";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - CARD_GAP) / 2;

const EMPTY_PRODUCT: Omit<AdminProduct, "id"> = {
  name: "",
  category: "Milk",
  price: 0,
  b2bPrice: 0,
  unit: "",
  image: "",
  inStock: true,
  stockQty: 0,
  description: "",
};

export const AdminProductsScreen = ({ navigation }: any) => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [formData, setFormData] = useState<Omit<AdminProduct, "id">>(EMPTY_PRODUCT);
  const [imageError, setImageError] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setProducts([...DUMMY_PRODUCTS]);
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleToggleStock = useCallback(
    (productId: string) => {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, inStock: !p.inStock, stockQty: p.inStock ? 0 : p.stockQty || 1 }
            : p
        )
      );
    },
    []
  );

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({ ...EMPTY_PRODUCT });
    setModalVisible(true);
  };

  const handleOpenEditModal = (product: AdminProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price,
      b2bPrice: product.b2bPrice,
      unit: product.unit,
      image: product.image,
      inStock: product.inStock,
      stockQty: product.stockQty,
      description: product.description,
    });
    setModalVisible(true);
  };

  const handleSaveProduct = () => {
    if (!formData.name.trim()) {
      Alert.alert("Validation", "Product name is required.");
      return;
    }
    if (formData.price <= 0) {
      Alert.alert("Validation", "Price must be greater than zero.");
      return;
    }

    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id ? { ...p, ...formData } : p
        )
      );
    } else {
      const newProduct: AdminProduct = {
        id: `p_new_${Date.now()}`,
        ...formData,
      };
      setProducts((prev) => [newProduct, ...prev]);
    }
    setModalVisible(false);
    setEditingProduct(null);
    setFormData({ ...EMPTY_PRODUCT });
  };

  const handleCancelModal = () => {
    setModalVisible(false);
    setEditingProduct(null);
    setFormData({ ...EMPTY_PRODUCT });
  };

  const renderCategoryChip = (category: string) => {
    const isActive = selectedCategory === category;
    return (
      <TouchableOpacity
        key={category}
        style={[
          styles.categoryChip,
          isActive ? styles.categoryChipActive : styles.categoryChipInactive,
        ]}
        onPress={() => setSelectedCategory(category)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.categoryChipText,
            isActive
              ? styles.categoryChipTextActive
              : styles.categoryChipTextInactive,
          ]}
        >
          {category}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderProductCard = ({ item }: { item: AdminProduct }) => {
    const hasImageError = imageError[item.id];
    const showPlaceholder = !item.image || hasImageError;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => handleOpenEditModal(item)}
        activeOpacity={0.8}
      >
        <View style={styles.productImageContainer}>
          {showPlaceholder ? (
            <View style={styles.productImagePlaceholder}>
              <Icon name="cube-outline" size={32} color={colors.textLight} />
            </View>
          ) : (
            <Image
              source={{ uri: item.image }}
              style={styles.productImage}
              resizeMode="cover"
              onError={() =>
                setImageError((prev) => ({ ...prev, [item.id]: true }))
              }
            />
          )}
          <View
            style={[
              styles.stockBadge,
              item.inStock ? styles.stockBadgeInStock : styles.stockBadgeOutOfStock,
            ]}
          >
            <Text
              style={[
                styles.stockBadgeText,
                item.inStock
                  ? styles.stockBadgeTextInStock
                  : styles.stockBadgeTextOutOfStock,
              ]}
            >
              {item.inStock ? "In Stock" : "Out of Stock"}
            </Text>
          </View>
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>{"\u20B9"}{item.price}</Text>
            <Text style={styles.productB2BPrice}>B2B {"\u20B9"}{item.b2bPrice}</Text>
          </View>
          <Text style={styles.productUnit}>{item.unit}</Text>
          <TouchableOpacity
            style={styles.toggleStockButton}
            onPress={() => handleToggleStock(item.id)}
            activeOpacity={0.6}
          >
            <Icon
              name={item.inStock ? "toggle" : "toggle-outline"}
              size={24}
              color={item.inStock ? colors.success : colors.textLight}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderModalCategoryChip = (category: string) => {
    if (category === "All") return null;
    const isActive = formData.category === category;
    return (
      <TouchableOpacity
        key={category}
        style={[
          styles.modalCategoryChip,
          isActive
            ? styles.modalCategoryChipActive
            : styles.modalCategoryChipInactive,
        ]}
        onPress={() => setFormData((prev) => ({ ...prev, category }))}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.modalCategoryChipText,
            isActive
              ? styles.modalCategoryChipTextActive
              : styles.modalCategoryChipTextInactive,
          ]}
        >
          {category}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBackButton}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Products</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{filteredProducts.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Icon name="search" size={20} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Icon name="close" size={20} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {PRODUCT_CATEGORIES.map(renderCategoryChip)}
        </ScrollView>
      </View>

      {/* Product Grid */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="cube-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleOpenAddModal}
        activeOpacity={0.8}
      >
        <Icon name="add" size={28} color={colors.white} />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingProduct ? "Edit Product" : "Add Product"}
                </Text>
                <TouchableOpacity onPress={handleCancelModal}>
                  <Icon name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Name */}
              <Text style={styles.formLabel}>Product Name</Text>
              <TextInput
                style={styles.formInput}
                value={formData.name}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, name: text }))
                }
                placeholder="Enter product name"
                placeholderTextColor={colors.textLight}
              />

              {/* Price */}
              <Text style={styles.formLabel}>Price ({"\u20B9"})</Text>
              <TextInput
                style={styles.formInput}
                value={formData.price > 0 ? String(formData.price) : ""}
                onChangeText={(text) =>
                  setFormData((prev) => ({
                    ...prev,
                    price: parseFloat(text) || 0,
                  }))
                }
                placeholder="0"
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
              />

              {/* B2B Price */}
              <Text style={styles.formLabel}>B2B Price ({"\u20B9"})</Text>
              <TextInput
                style={styles.formInput}
                value={formData.b2bPrice > 0 ? String(formData.b2bPrice) : ""}
                onChangeText={(text) =>
                  setFormData((prev) => ({
                    ...prev,
                    b2bPrice: parseFloat(text) || 0,
                  }))
                }
                placeholder="0"
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
              />

              {/* Unit */}
              <Text style={styles.formLabel}>Unit</Text>
              <TextInput
                style={styles.formInput}
                value={formData.unit}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, unit: text }))
                }
                placeholder="e.g. 500ml, 1L, 200g"
                placeholderTextColor={colors.textLight}
              />

              {/* Description */}
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={formData.description}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, description: text }))
                }
                placeholder="Enter product description"
                placeholderTextColor={colors.textLight}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Category Picker */}
              <Text style={styles.formLabel}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.modalCategoryScroll}
                contentContainerStyle={styles.modalCategoryScrollContent}
              >
                {PRODUCT_CATEGORIES.map(renderModalCategoryChip)}
              </ScrollView>

              {/* Stock Toggle */}
              <View style={styles.formStockRow}>
                <Text style={styles.formLabel}>In Stock</Text>
                <Switch
                  value={formData.inStock}
                  onValueChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      inStock: val,
                      stockQty: val ? prev.stockQty || 1 : 0,
                    }))
                  }
                  trackColor={{
                    false: colors.border,
                    true: colors.success,
                  }}
                  thumbColor={colors.white}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelModal}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveProduct}
                  activeOpacity={0.7}
                >
                  <Text style={styles.saveButtonText}>
                    {editingProduct ? "Update" : "Save"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: colors.white,
  },
  headerBadge: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: "center",
  },
  headerBadgeText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },

  // Search
  searchContainer: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    paddingVertical: 0,
  },

  // Categories
  categoryContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 14,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 0,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryChipInactive: {
    backgroundColor: colors.primaryLight,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  categoryChipTextActive: {
    color: colors.white,
  },
  categoryChipTextInactive: {
    color: colors.primary,
  },

  // Grid
  gridContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
    backgroundColor: colors.white,
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: CARD_GAP,
  },

  // Product Card
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    elevation: 2,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  productImageContainer: {
    width: "100%",
    height: CARD_WIDTH * 0.7,
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  productImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  stockBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stockBadgeInStock: {
    backgroundColor: "rgba(12, 131, 31, 0.15)",
  },
  stockBadgeOutOfStock: {
    backgroundColor: "rgba(244, 67, 54, 0.15)",
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  stockBadgeTextInStock: {
    color: colors.success,
  },
  stockBadgeTextOutOfStock: {
    color: colors.error,
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 18,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 4,
    gap: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  productB2BPrice: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  productUnit: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  toggleStockButton: {
    alignSelf: "flex-end",
    marginTop: 4,
    padding: 2,
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textLight,
    marginTop: 12,
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 28,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },

  // Form
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.lightBackground,
  },
  formTextArea: {
    height: 80,
    textAlignVertical: "top",
  },

  // Modal Category Chips
  modalCategoryScroll: {
    marginTop: 4,
  },
  modalCategoryScrollContent: {
    gap: 8,
  },
  modalCategoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    marginRight: 0,
  },
  modalCategoryChipActive: {
    backgroundColor: colors.primary,
  },
  modalCategoryChipInactive: {
    backgroundColor: colors.primaryLight,
  },
  modalCategoryChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  modalCategoryChipTextActive: {
    color: colors.white,
  },
  modalCategoryChipTextInactive: {
    color: colors.primary,
  },

  // Stock Row
  formStockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 4,
  },

  // Action Buttons
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
});
