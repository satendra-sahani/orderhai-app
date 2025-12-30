import { ScrollView, Text, TouchableOpacity, StyleSheet, View } from "react-native"
import { colors } from "../theme/colors"

interface CategoryBarProps {
  activeCategory: string
  onCategoryChange: (category: string) => void
  categories: string[]
}

const categoryIcons: Record<string, string> = {
  All: "🛒",
  Vegetables: "🥬",
  Fruits: "🍎",
  Dairy: "🥛",
  "Meat & Fish": "🍖",
  "Women's Care": "💜",
  Grocery: "🛍️",
  "Fast Food": "🍔",
  Snacks: "🍿",
  Chinese: "🥡",
  Indian: "🍛",
  Rolls: "🌯",
  Beverages: "🥤",
  "Personal Care": "🧴",
}

export const CategoryBar = ({ activeCategory, onCategoryChange, categories }: CategoryBarProps) => {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        {categories.map((category) => (
          <TouchableOpacity key={category} onPress={() => onCategoryChange(category)} style={styles.categoryItem}>
            <View style={[styles.iconCircle, activeCategory === category && styles.iconCircleActive]}>
              <Text style={styles.icon}>{categoryIcons[category] || "🍴"}</Text>
            </View>
            <Text
              style={[styles.categoryText, activeCategory === category && styles.categoryTextActive]}
              numberOfLines={1}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8f8f8",
    paddingVertical: 12,
  },
  contentContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  categoryItem: {
    alignItems: "center",
    width: 70,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#f0f0f0",
  },
  iconCircleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  icon: {
    fontSize: 32,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    textAlign: "center",
  },
  categoryTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
})
