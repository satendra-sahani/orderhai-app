"use client"

import { useState } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Image, TextInput } from "react-native"
import Icon from "react-native-vector-icons/Ionicons"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors } from "../theme/colors"
import { useCart } from "../context/CartContext"

const menuItems = [
  {
    id: "1",
    name: "Garlic Noodles",
    price: 70,
    description: "Big garlic flavors and Asian sauce...",
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400",
    tag: "Bestseller",
    isVeg: true,
  },
  {
    id: "2",
    name: "Paneer Chicken Tikka",
    price: 70,
    description: "Spicy grilled paneer with herbs",
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400",
    tag: "Must Try",
    isVeg: false,
  },
]

export const RestaurantScreen = ({ navigation }: any) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("Starters")
  const { addToCart } = useCart()

  const handleAddItem = (item: any) => {
    addToCart({
      id: item.id,
      productId: item.id,
      name: item.name,
      variantName: "Regular",
      price: item.price,
      image: item.image,
    })
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Icon name="heart-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Restaurant Info */}
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName}>Anryas Hotel</Text>
          <View style={styles.infoRow}>
            <Icon name="star" size={14} color={colors.accent} />
            <Text style={styles.infoText}>4.4 (263 ratings)</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.infoText}>₹500 for two</Text>
          </View>
          <Text style={styles.cuisine}>South Indian, Snacks...</Text>

          <View style={styles.deliveryInfo}>
            <View style={styles.deliveryItem}>
              <Icon name="location" size={16} color={colors.primary} />
              <View>
                <Text style={styles.deliveryLabel}>Angnunal Road</Text>
              </View>
            </View>
            <View style={styles.deliveryItem}>
              <Icon name="time" size={16} color={colors.primary} />
              <View>
                <Text style={styles.deliveryLabel}>Delivery Time</Text>
                <Text style={styles.deliveryValue}>30-30 Minutes</Text>
              </View>
            </View>
            <View style={styles.deliveryItem}>
              <Icon name="bicycle" size={16} color={colors.primary} />
              <View>
                <Text style={styles.deliveryLabel}>Delivered By</Text>
                <Text style={styles.deliveryValue}>Restaurant</Text>
              </View>
            </View>
          </View>
        </View>

        {/* MENU Header */}
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>MENU</Text>
        </View>

        {/* Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Icon name="search-outline" size={18} color={colors.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search in menu"
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor={colors.textLight}
            />
            <Icon name="options-outline" size={18} color={colors.textLight} />
          </View>
        </View>

        {/* Tab Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "Starters" && styles.tabActive]}
            onPress={() => setActiveTab("Starters")}
          >
            <Text style={[styles.tabText, activeTab === "Starters" && styles.tabTextActive]}>Starters</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "Dosa-Veg" && styles.tabActive]}
            onPress={() => setActiveTab("Dosa-Veg")}
          >
            <Icon name="leaf-outline" size={14} color={colors.success} />
            <Text style={[styles.tabText, activeTab === "Dosa-Veg" && styles.tabTextActive]}>Dosa - Veg</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "Non-Veg" && styles.tabActive]}
            onPress={() => setActiveTab("Non-Veg")}
          >
            <Icon name="fish-outline" size={14} color={colors.error} />
            <Text style={[styles.tabText, activeTab === "Non-Veg" && styles.tabTextActive]}>Non - Veg</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Recommended Section */}
        <View style={styles.recommendedSection}>
          <Text style={styles.sectionTitle}>Recommended (4)</Text>

          {menuItems.map((item) => (
            <View key={item.id} style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={styles.vegIndicator}>
                  <View style={[styles.vegDot, item.isVeg ? styles.vegColor : styles.nonVegColor]} />
                </View>
                {item.tag && (
                  <View style={styles.tag}>
                    <Icon name="star" size={10} color={colors.accent} />
                    <Text style={styles.tagText}>{item.tag}</Text>
                  </View>
                )}
                <Text style={styles.menuItemName}>{item.name}</Text>
                <Text style={styles.menuItemPrice}>₹ 70</Text>
                <Text style={styles.menuItemDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>

              <View style={styles.menuItemRight}>
                <Image source={{ uri: item.image }} style={styles.menuItemImage} />
                <TouchableOpacity style={styles.addButton} onPress={() => handleAddItem(item)}>
                  <Text style={styles.addButtonText}>ADD</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Proceed to Cart Button */}
      <TouchableOpacity style={styles.proceedButton} onPress={() => navigation.navigate("Cart")}>
        <View style={styles.proceedLeft}>
          <Text style={styles.proceedItemCount}>1 Item</Text>
          <Text style={styles.proceedPrice}>₹ 25.60</Text>
        </View>
        <Text style={styles.proceedText}>Proceed to Cart</Text>
        <Icon name="arrow-forward" size={18} color={colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  restaurantInfo: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  dot: {
    color: colors.textLight,
  },
  cuisine: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 12,
  },
  deliveryInfo: {
    gap: 12,
  },
  deliveryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  deliveryLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  deliveryValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "700",
  },
  menuHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: 1,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },
  tabBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  recommendedSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  menuItemLeft: {
    flex: 1,
    paddingRight: 12,
  },
  vegIndicator: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: colors.success,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  vegColor: {
    backgroundColor: colors.success,
  },
  nonVegColor: {
    backgroundColor: colors.error,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: "700",
  },
  menuItemName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  menuItemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  menuItemDesc: {
    fontSize: 12,
    color: colors.textLight,
    lineHeight: 16,
  },
  menuItemRight: {
    alignItems: "center",
  },
  menuItemImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    marginBottom: 8,
  },
  addButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
  },
  proceedButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  proceedLeft: {},
  proceedItemCount: {
    fontSize: 11,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 2,
  },
  proceedPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.white,
  },
  proceedText: {
    flex: 1,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "800",
    color: colors.white,
  },
})
