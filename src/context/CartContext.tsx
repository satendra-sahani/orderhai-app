// src/context/CartContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  apiGetCart,
  apiAddToCart,
  apiUpdateCartItem,
  apiRemoveCartItem,
  apiClearCart,
  apiPlaceOrder,
  type ApiCartItem,
  type ApiOrder,
} from "../api";

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  variantName?: string;
  price: number;
  quantity: number;
  image?: string;
};

interface CartContextType {
  cartItems: CartItem[];
  orders: ApiOrder[];
  addToCart: (
    item: Omit<CartItem, "quantity">
  ) => Promise<void>;
  updateQuantity: (
    id: string,
    quantity: number
  ) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  placeOrder: (params: {
    address: string;
    phone: string;
    name?: string;
    paymentMethod: "COD" | "ONLINE";
    notes?: string;
    location?: { lat: number; lng: number };
  }) => Promise<ApiOrder | null>;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  getItemQuantity: (
    productId: string,
    variantName?: string
  ) => number; // <<< added
}

const CartContext = createContext<
  CartContextType | undefined
>(undefined);

export const CartProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(
    []
  );
  const [orders, setOrders] = useState<ApiOrder[]>([]);

  const syncCartFromApi = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      setCartItems([]);
      return;
    }
    try {
      const data = await apiGetCart();
      const items: CartItem[] = (data.items || []).map(
        (i: ApiCartItem) => ({
          id: `${i.product}-${i.variantName || "default"}`,
          productId: i.product,
          name: i.name,
          variantName: i.variantName,
          price: i.price,
          quantity: i.qty,
          image: i.image,
        })
      );
      setCartItems(items);
    } catch {
      // keep local if API fails
    }
  };

  useEffect(() => {
    syncCartFromApi();
  }, []);

  const addToCart = async (
    item: Omit<CartItem, "quantity">
  ) => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;

    // optimistic local update
    setCartItems(prev => {
      const existing = prev.find(
        i => i.id === item.id
      );
      if (existing) {
        return prev.map(i =>
          i.id === item.id
            ? {
                ...i,
                quantity: i.quantity + 1,
              }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });

    try {
      await apiAddToCart({
        productId: item.productId,
        qty: 1,
        variantName: item.variantName,
      });
      await syncCartFromApi();
    } catch {
      // ignore; user still sees local state
    }
  };

  const updateQuantity = async (
    id: string,
    quantity: number
  ) => {
    const target = cartItems.find(i => i.id === id);
    if (!target) return;

    if (quantity <= 0) {
      await removeFromCart(id);
      return;
    }

    setCartItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity }
          : item
      )
    );

    try {
      await apiUpdateCartItem({
        productId: target.productId,
        qty: quantity,
        variantName: target.variantName,
      });
    } catch {
      // ignore
    }
  };

  const removeFromCart = async (id: string) => {
    const target = cartItems.find(i => i.id === id);
    if (!target) {
      setCartItems(prev =>
        prev.filter(item => item.id !== id)
      );
      return;
    }

    setCartItems(prev =>
      prev.filter(item => item.id !== id)
    );

    try {
      await apiRemoveCartItem({
        productId: target.productId,
        variantName: target.variantName,
      });
    } catch {
      // ignore
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    try {
      await apiClearCart();
    } catch {
      // ignore
    }
  };

  const getTotalPrice = () =>
    cartItems.reduce(
      (sum, item) =>
        sum + item.price * item.quantity,
      0
    );

  const getTotalItems = () =>
    cartItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

  const getItemQuantity = (
    productId: string,
    variantName?: string
  ) => {
    const item = cartItems.find(
      i =>
        i.productId === productId &&
        (variantName
          ? i.variantName === variantName
          : true)
    );
    return item ? item.quantity : 0;
  };

  const placeOrder: CartContextType["placeOrder"] =
    async ({
      address,
      phone,
      name,
      paymentMethod,
      notes,
      location,
    }) => {
      if (cartItems.length === 0) return null;

      const payloadItems: ApiCartItem[] =
        cartItems.map(i => ({
          product: i.productId,
          name: i.name,
          variantName: i.variantName,
          price: i.price,
          qty: i.quantity,
          image: i.image,
        }));

      try {
        const order = await apiPlaceOrder({
          items: payloadItems,
          paymentMethod,
          address,
          phone,
          name,
          notes,
          location,
        });
        setOrders(prev => [order, ...prev]);
        await clearCart();
        return order;
      } catch {
        return null;
      }
    };

  const value: CartContextType = {
    cartItems,
    orders,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    placeOrder,
    getTotalPrice,
    getTotalItems,
    getItemQuantity, // <<< added
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error(
      "useCart must be used within CartProvider"
    );
  }
  return context;
};
