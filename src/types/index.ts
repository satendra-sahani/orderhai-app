export interface ProductVariant {
  id: string
  name: string
  price: number
}

export interface Sponsor {
  shopName: string
  area: string
  discountPercent: number
}

export interface Product {
  id: string
  name: string
  price: number
  image: string
  description: string
  rating: number
  isVeg: boolean
  category: string
  variants?: ProductVariant[]
  sponsor?: Sponsor
  unit?: string // Added unit field for kg, pcs, etc
  originalPrice?: number // Added originalPrice for discounted items
}

export interface CartItem {
  id: string
  productId: string
  name: string
  variantName: string
  price: number
  image: string
  quantity: number
  unit?: string // Added unit field to cart items
}

export interface Order {
  id: string
  items: CartItem[]
  total: number
  date: string
  status: "pending" | "delivered" | "cancelled"
}

export interface User {
  id: string
  name: string
  phoneNumber: string
  location: {
    address: string
    latitude?: number
    longitude?: number
  }
}
