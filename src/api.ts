// src/api.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE = "https://orderhai-be.vercel.app";

// ---------- Core request helper ----------

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiMeResponse {
  id: string;
  phone: string;
  name?: string;
  addresses: ApiAddress[];
}

const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem("token");
  } catch {
    return null;
  }
};

async function request<T = any>(
  path: string,
  options: {
    method?: Method;
    body?: any;
    auth?: boolean;
  } = {}
): Promise<T> {
  const { method = "GET", body, auth = false } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || `Request failed: ${res.status}`);
  }

  return data as T;
}

// ---------- Types from API doc ----------

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export interface ApiUser {
  id: string;
  phone: string;
  name?: string;
  lastLoginAt?: string;
  addresses?: ApiAddress[];
}

export interface ApiAddress {
  _id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

export interface ApiProductVariant {
  _id: string;
  name: string;
  price: number;
}

export interface ApiSponsor {
  shopId: string;
  shopName: string;
  discountPercent: number;
  area: string;
}

export interface ApiProduct {
  _id: string;
  name: string;
  category: string;
  description?: string;
  image?: string;
  price: number;
  sellingPrice?: number;
  rating?: number;
  isVeg?: boolean;
  unit?: string;
  variants?: ApiProductVariant[];
  sponsor?: ApiSponsor;
}

export interface ApiCartItem {
  product: string; // product id
  name: string;
  variantName?: string;
  price: number;
  qty: number;
  image?: string;
}

export interface ApiCartResponse {
  items: ApiCartItem[];
}

export interface ApiOrder {
  id?: string;
  _id?: string;
  orderId: string;
  createdAt: string;
  items: ApiCartItem[];
  total: number;
  paymentMethod: "COD" | "ONLINE";
  address: string;
  phone?: string;
  name?: string;
  status: OrderStatus;
}

export type ApiOrdersResponse = ApiOrder[];

// ---------- Auth ----------

export const apiSendLoginOtp = (phone: string) =>
  request<{ message: string; success: boolean }>("/api/auth/login-otp", {
    method: "POST",
    body: { phone },
  });

export const apiVerifyLoginOtp = (phone: string, otp: string) =>
  request<{ token: string; user: ApiUser }>("/api/auth/verify-otp", {
    method: "POST",
    body: { phone, otp },
  });

// ---------- User profile ----------

export const apiGetMe = () => request<ApiUser>("/api/users/me", { auth: true });

export const apiUpdateMe = (body: { name?: string; phone?: string }) =>
  request<{ message: string; user: ApiUser }>("/api/users/me", {
    method: "PUT",
    auth: true,
    body,
  });

// ---------- Addresses ----------

export const apiAddAddress = (body: {
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}) =>
  request<{ message: string; address: ApiAddress }>("/api/users/addresses", {
    method: "POST",
    auth: true,
    body,
  });

export const apiUpdateAddress = (
  addressId: string,
  body: {
    label?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
    isDefault?: boolean;
  }
) =>
  request<{ message: string; address: ApiAddress }>(
    `/api/users/addresses/${addressId}`,
    {
      method: "PUT",
      auth: true,
      body,
    }
  );

export const apiDeleteAddress = (addressId: string) =>
  request<{ message: string }>(`/api/users/addresses/${addressId}`, {
    method: "DELETE",
    auth: true,
  });

// ---------- Products ----------

export const apiGetProducts = () => request<ApiProduct[]>("/api/products");

export const apiGetProduct = (productId: string) =>
  request<ApiProduct>(`/api/products/${productId}`);

// ---------- Cart ----------

export const apiGetCart = () =>
  request<ApiCartResponse>("/api/users/cart", {
    method: "GET",
    auth: true,
  });

export const apiAddToCart = (params: {
  productId: string;
  qty: number;
  variantName?: string;
}) =>
  request("/api/users/cart", {
    method: "POST",
    auth: true,
    body: params,
  });

export const apiUpdateCartItem = (params: {
  productId: string;
  qty: number;
  variantName?: string;
}) =>
  request(`/api/users/cart/${params.productId}`, {
    method: "PATCH",
    auth: true,
    body: { qty: params.qty, variantName: params.variantName },
  });

export const apiRemoveCartItem = (params: {
  productId: string;
  variantName?: string;
}) =>
  request(`/api/users/cart/${params.productId}`, {
    method: "DELETE",
    auth: true,
    body: { variantName: params.variantName },
  });

export const apiClearCart = () =>
  request("/api/users/cart", {
    method: "DELETE",
    auth: true,
  });

// ---------- Favorites ----------

export const apiGetFavorites = () =>
  request<ApiProduct[]>("/api/users/favorites", {
    method: "GET",
    auth: true,
  });

export const apiAddFavorite = (productId: string) =>
  request<{ message: string }>(`/api/users/favorites/${productId}`, {
    method: "POST",
    auth: true,
  });

export const apiRemoveFavorite = (productId: string) =>
  request<{ message: string }>(`/api/users/favorites/${productId}`, {
    method: "DELETE",
    auth: true,
  });

// ---------- Orders ----------

export const apiPlaceOrder = (body: {
  items: ApiCartItem[];
  paymentMethod: "COD" | "ONLINE";
  address: string;
  phone: string;
  name?: string;
  notes?: string;
  location?: { lat: number; lng: number };
}) =>
  request<ApiOrder>("/api/users/orders", {
    method: "POST",
    auth: true,
    body,
  });

export const apiGetOrders = () =>
  request<ApiOrdersResponse>("/api/users/orders", {
    method: "GET",
    auth: true,
  });

export const apiCancelOrder = (orderId: string) =>
  request<{ message: string; order: ApiOrder }>(
    `/api/users/orders/${orderId}/cancel`,
    {
      method: "POST",
      auth: true,
    }
  );

// Create a quick address from a free‑text string
export const apiCreateQuickAddress = (params: {
  line1: string;
  city?: string;
  isDefault?: boolean;
  latitude?: number;
  longitude?: number;
}) =>
  request<ApiAddress>("/api/users/addresses", {
    method: "POST",
    auth: true,
    body: params,
  });

  export const apiCreateAddress = (body: {
  label: string;
  line1: string;
  city: string;
  isDefault?: boolean;
  latitude?: number;
  longitude?: number;
}) =>
  request<ApiAddress>("/api/users/addresses", {
    method: "POST",
    auth: true,
    body,
  });