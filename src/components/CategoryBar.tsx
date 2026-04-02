import { ScrollView, Text, TouchableOpacity, StyleSheet, View } from "react-native"
import { colors } from "../theme/colors"

interface CategoryBarProps {
  activeCategory: string
  onCategoryChange: (category: string) => void
  categories: string[]
}

const categoryIcons: Record<string, string> = {
  All: "🛒",
  Milk: "🥛",
  Curd: "🫙",
  "Butter & Ghee": "🧈",
  "Ice Cream": "🍦",
  Cheese: "🧀",
  Paneer: "🧊",
  Sweets: "🍮",
  Beverages: "🥤",
  "Milk Powder": "📦",
  Flavoured: "🍫",
  Shrikhand: "🍨",
  Lassi: "🥛",
  Peda: "🍬",
  Cream: "🍶",
  Buttermilk: "🫗",
  Dairy: "🥛",
  Grocery: "🛍️",
  "Personal Care": "🧴",
}

export const CategoryBar = ({ activeCategory, onCategoryChange, categories }: CategoryBarProps) => {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        {categories.map((category) => {
          const isActive = activeCategory === category
          return (
            <TouchableOpacity key={category} onPress={() => onCategoryChange(category)} style={styles.categoryItem}>
              <View style={[styles.iconCircle, isActive && styles.iconCircleActive]}>
                <Text style={styles.icon}>{categoryIcons[category] || "🍴"}</Text>
              </View>
              <Text
                style={[styles.categoryText, isActive && styles.categoryTextActive]}
                numberOfLines={1}
              >
                {category}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  contentContainer: {
    paddingHorizontal: 12,
    gap: 8,
  },
  categoryItem: {
    alignItems: "center",
    width: 72,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    borderWidth: 2,
    borderColor: "#eef0f2",
  },
  iconCircleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    fontSize: 26,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
    textAlign: "center",
  },
  categoryTextActive: {
    color: colors.primary,
    fontWeight: "800",
  },
  activeIndicator: {
    marginTop: 4,
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.accent,
  },
})
