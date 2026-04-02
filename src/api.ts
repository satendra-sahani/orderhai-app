// src/api.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE = "http://192.168.1.13:5003";

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
  role?: string;
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

// ---------- Subscriptions ----------

export const apiCreateSubscription = (data: {
  productId: string;
  variantName?: string;
  qty: number;
  frequency: "daily" | "weekly" | "custom";
  daysOfWeek?: number[];
  addressId: string;
  startDate: string;
}) =>
  request("/api/subscriptions", {
    method: "POST",
    auth: true,
    body: data,
  });

export const apiGetSubscriptions = () =>
  request("/api/subscriptions", { auth: true });

export const apiUpdateSubscription = (
  id: string,
  data: {
    qty?: number;
    frequency?: "daily" | "weekly" | "custom";
    daysOfWeek?: number[];
    addressId?: string;
  }
) =>
  request(`/api/subscriptions/${id}`, {
    method: "PUT",
    auth: true,
    body: data,
  });

export const apiPauseSubscription = (id: string, pausedUntil: string) =>
  request(`/api/subscriptions/${id}/pause`, {
    method: "POST",
    auth: true,
    body: { pausedUntil },
  });

export const apiResumeSubscription = (id: string) =>
  request(`/api/subscriptions/${id}/resume`, {
    method: "POST",
    auth: true,
  });

export const apiCancelSubscription = (id: string) =>
  request(`/api/subscriptions/${id}`, {
    method: "DELETE",
    auth: true,
  });

// ---------- Coupons ----------

export const apiValidateCoupon = (code: string, cartTotal: number) =>
  request<{ valid: boolean; discount: number; message?: string }>(
    "/api/coupons/validate",
    {
      method: "POST",
      auth: true,
      body: { code, cartTotal },
    }
  );

// ---------- Wallet & Referral ----------

export const apiGetWallet = () =>
  request("/api/wallet", { auth: true });

export const apiGetReferralCode = () =>
  request<{ code: string }>("/api/referral", { auth: true });

export const apiApplyReferral = (code: string) =>
  request("/api/referral/apply", {
    method: "POST",
    auth: true,
    body: { code },
  });

// ---------- Complaints ----------

export const apiCreateComplaint = (data: {
  orderId: string;
  type: string;
  description: string;
  images?: string[];
}) =>
  request("/api/complaints", {
    method: "POST",
    auth: true,
    body: data,
  });

export const apiGetMyComplaints = () =>
  request("/api/complaints", { auth: true });

// ---------- Delivery Boy ----------

export const apiGetTodayAssignments = () =>
  request("/api/delivery/assignments/today", { auth: true });

export const apiStartAssignment = (id: string) =>
  request(`/api/delivery/assignments/${id}/start`, {
    method: "POST",
    auth: true,
  });

export const apiUpdateDeliveryStatus = (
  orderId: string,
  status: string
) =>
  request(`/api/delivery/orders/${orderId}/status`, {
    method: "PATCH",
    auth: true,
    body: { status },
  });

export const apiConfirmDelivery = (orderId: string, otp: string) =>
  request(`/api/delivery/orders/${orderId}/confirm`, {
    method: "POST",
    auth: true,
    body: { otp },
  });

export const apiUpdateLocation = (lat: number, lng: number) =>
  request("/api/delivery/location", {
    method: "POST",
    auth: true,
    body: { lat, lng },
  });

export const apiGetEarnings = () =>
  request("/api/delivery/earnings", { auth: true });

export const apiGetEarningsHistory = () =>
  request("/api/delivery/earnings/history", { auth: true });

export const apiGetSettlements = () =>
  request("/api/delivery/settlements", { auth: true });

export const apiRequestLeave = (date: string, reason: string) =>
  request("/api/delivery/leave", {
    method: "POST",
    auth: true,
    body: { date, reason },
  });

export const apiGetLeaveRequests = () =>
  request("/api/delivery/leave", { auth: true });

export const apiToggleAvailability = (isAvailable: boolean) =>
  request("/api/delivery/availability", {
    method: "POST",
    auth: true,
    body: { isAvailable },
  });

// ---------- Distributor ----------

export const apiGetDistributorProfile = () =>
  request("/api/distributor/profile", { auth: true });

export const apiUpdateDistributorProfile = (data: {
  businessName?: string;
  gstin?: string;
  name?: string;
}) =>
  request("/api/distributor/profile", {
    method: "PUT",
    auth: true,
    body: data,
  });

export const apiGetB2BProducts = (search?: string, category?: string) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (category) params.append("category", category);
  const qs = params.toString();
  return request(`/api/distributor/products${qs ? `?${qs}` : ""}`, {
    auth: true,
  });
};

export const apiCreateB2BOrder = (data: {
  items: { product: string; qty: number; variant?: string }[];
  address?: string;
  notes?: string;
}) =>
  request("/api/distributor/orders", {
    method: "POST",
    auth: true,
    body: data,
  });

export const apiGetDistributorOrders = () =>
  request("/api/distributor/orders", { auth: true });

export const apiGetDistributorInvoices = () =>
  request("/api/distributor/invoices", { auth: true });

export const apiGetCreditSummary = () =>
  request("/api/distributor/credit-summary", { auth: true });

export const apiRecordCreditPayment = (amount: number, razorpay_payment_id: string) =>
  request("/api/distributor/credit-payment", {
    method: "POST",
    auth: true,
    body: { amount, razorpay_payment_id },
  });

export const apiGetAssignedOrders = (status?: string) => {
  const qs = status ? `?status=${status}` : "";
  return request(`/api/distributor/assigned-orders${qs}`, { auth: true });
};

export const apiUpdateAssignedOrderStatus = (orderId: string, status: string) =>
  request(`/api/distributor/assigned-orders/${orderId}/status`, {
    method: "PATCH",
    auth: true,
    body: { status },
  });

// ---------- Delivery Slots ----------

export const apiGetAvailableSlots = (zone: string) =>
  request(`/api/slots?zone=${encodeURIComponent(zone)}`, { auth: true });

// ---------- Payment ----------

export const apiCreatePaymentOrder = (amount: number, receipt: string) =>
  request("/api/payments/create-order", {
    method: "POST",
    auth: true,
    body: { amount, receipt },
  });

export const apiVerifyPayment = (data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) =>
  request("/api/payments/verify", {
    method: "POST",
    auth: true,
    body: data,
  });