import type React from "react"
import Ionicons from "react-native-vector-icons/Ionicons"

interface IconProps {
  name: string
  size?: number
  color?: string
}

export const Icon: React.FC<IconProps> = ({ name, size = 24, color = "#000" }) => {
  const getIonIconName = (iconName: string): string => {
    const iconMap: { [key: string]: string } = {
      // Navigation
      home: "home",
      cart: "cart",
      "cart-outline": "cart-outline",
      user: "person",
      person: "person",
      orders: "receipt",
      receipt: "receipt",

      // Actions
      search: "search",
      add: "add",
      "add-circle": "add-circle",
      remove: "remove",
      "remove-circle": "remove-circle",
      close: "close",
      back: "arrow-back",
      "arrow-back": "arrow-back",
      "arrow-forward": "arrow-forward",
      "chevron-down": "chevron-down",
      "chevron-up": "chevron-up",
      "chevron-back": "chevron-back",
      "chevron-forward": "chevron-forward",
      check: "checkmark",
      checkmark: "checkmark",
      "checkmark-circle": "checkmark-circle",

      // Food & Categories
      restaurant: "restaurant",
      pizza: "pizza",
      fast: "fast-food",
      "fast-food": "fast-food",

      // Location & Delivery
      location: "location",
      "location-outline": "location-outline",
      navigate: "navigate",
      bike: "bicycle",
      bicycle: "bicycle",

      // UI Elements
      heart: "heart",
      "heart-outline": "heart-outline",
      star: "star",
      "star-outline": "star-outline",
      notification: "notifications",
      notifications: "notifications",
      bell: "notifications",
      settings: "settings",
      menu: "menu",
      filter: "filter",
      time: "time",
      clock: "time",

      // Payment
      wallet: "wallet",
      card: "card",
      cash: "cash",

      // Other
      phone: "call",
      call: "call",
      message: "chatbubble",
      help: "help-circle",
      info: "information-circle",
      warning: "warning",
      success: "checkmark-circle",
      error: "close-circle",
      "trash-outline": "trash-outline",
      trash: "trash",
      "pencil-outline": "pencil-outline",
      pencil: "pencil",
      "ellipsis-vertical": "ellipsis-vertical",
      bag: "bag-handle",
      "bag-handle": "bag-handle",

      // Admin dashboard icons
      "shield-checkmark": "shield-checkmark",
      "shield-checkmark-outline": "shield-checkmark-outline",
      business: "business",
      "business-outline": "business-outline",
      people: "people",
      "people-outline": "people-outline",
      "stats-chart": "stats-chart",
      "stats-chart-outline": "stats-chart-outline",
      grid: "grid",
      "grid-outline": "grid-outline",
      "receipt-outline": "receipt-outline",
      "cash-outline": "cash-outline",
      "bicycle-outline": "bicycle-outline",
      "bar-chart": "bar-chart",
      "bar-chart-outline": "bar-chart-outline",
      "swap-horizontal": "swap-horizontal",
      eye: "eye",
      "eye-outline": "eye-outline",
      toggle: "toggle",
      "toggle-outline": "toggle-outline",
      "create-outline": "create-outline",
      "document-text-outline": "document-text-outline",
      "person-circle": "person-circle",
      "person-circle-outline": "person-circle-outline",
      "log-out": "log-out-outline",
      "log-out-outline": "log-out-outline",
      repeat: "repeat",
      "cube-outline": "cube-outline",
      cube: "cube",
      "trending-up": "trending-up",
      "trending-up-outline": "trending-up-outline",
      "checkmark-done": "checkmark-done",
      "close-circle-outline": "close-circle-outline",
      "time-outline": "time-outline",
      "car-outline": "car-outline",
      "pricetag": "pricetag",
      "pricetag-outline": "pricetag-outline",
    }

    return iconMap[iconName.toLowerCase()] || iconName
  }

  return <Ionicons name={getIonIconName(name)} size={size} color={color} />
}
