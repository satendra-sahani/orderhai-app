// src/data/adminDummyData.ts
// All dummy data for admin dashboard screens — Nandini dairy themed

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
export type PaymentMethod = 'COD' | 'ONLINE' | 'UPI';
export type DistributorStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED';
export type VehicleType = 'BIKE' | 'CYCLE' | 'AUTO';

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
  unit: string;
}

export interface AdminOrder {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  deliveryBoy?: string;
  address: string;
  paymentMethod: PaymentMethod;
}

export interface AdminProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  b2bPrice: number;
  unit: string;
  image: string;
  inStock: boolean;
  stockQty: number;
  description: string;
}

export interface AdminDistributor {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  area: string;
  gstin: string;
  status: DistributorStatus;
  creditLimit: number;
  creditUsed: number;
  totalOrders: number;
  joinedAt: string;
}

export interface AdminDeliveryBoy {
  id: string;
  name: string;
  phone: string;
  area: string;
  isAvailable: boolean;
  isOnline: boolean;
  activeOrders: number;
  totalDeliveries: number;
  rating: number;
  vehicleType: VehicleType;
}

export interface RevenueMonth {
  month: string;
  revenue: number;
  orders: number;
}

export interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  activeUsers: number;
  activeDeliveryBoys: number;
  pendingOrders: number;
  totalProducts: number;
}

// ─── Dashboard Stats ────────────────────────────────────────
export const DASHBOARD_STATS: DashboardStats = {
  totalOrders: 1847,
  todayOrders: 43,
  totalRevenue: 584200,
  todayRevenue: 12450,
  activeUsers: 562,
  activeDeliveryBoys: 8,
  pendingOrders: 12,
  totalProducts: 24,
};

// ─── S3 image base ──────────────────────────────────────────
const S3 = 'https://kmf-website.s3.ap-south-1.amazonaws.com/products';

// ─── Orders ─────────────────────────────────────────────────
export const DUMMY_ORDERS: AdminOrder[] = [
  {
    id: 'o1', orderId: 'ND-2026-0001',
    customerName: 'Priya Sharma', customerPhone: '9876543210',
    items: [
      { name: 'Nandini Toned Milk', qty: 2, price: 27, unit: '500ml' },
      { name: 'Nandini Fresh Curd', qty: 1, price: 35, unit: '400g' },
    ],
    total: 89, status: 'PENDING', createdAt: '2026-03-21T08:30:00Z',
    address: '12, 4th Cross, Jayanagar, Bangalore', paymentMethod: 'UPI',
  },
  {
    id: 'o2', orderId: 'ND-2026-0002',
    customerName: 'Ravi Kumar', customerPhone: '9876543211',
    items: [
      { name: 'Nandini Pure Ghee', qty: 1, price: 520, unit: '1L' },
      { name: 'Nandini Paneer', qty: 2, price: 90, unit: '200g' },
    ],
    total: 700, status: 'CONFIRMED', createdAt: '2026-03-21T09:15:00Z',
    deliveryBoy: 'Manoj K', address: '45, MG Road, Bangalore', paymentMethod: 'ONLINE',
  },
  {
    id: 'o3', orderId: 'ND-2026-0003',
    customerName: 'Ananya Reddy', customerPhone: '9876543212',
    items: [
      { name: 'Nandini Good Life Milk', qty: 4, price: 60, unit: '1L' },
    ],
    total: 240, status: 'OUT_FOR_DELIVERY', createdAt: '2026-03-21T07:00:00Z',
    deliveryBoy: 'Suresh S', address: '78, HSR Layout, Bangalore', paymentMethod: 'COD',
  },
  {
    id: 'o4', orderId: 'ND-2026-0004',
    customerName: 'Kiran Gowda', customerPhone: '9876543213',
    items: [
      { name: 'Nandini Butter', qty: 3, price: 55, unit: '100g' },
      { name: 'Nandini Cheese Slices', qty: 1, price: 120, unit: '200g' },
    ],
    total: 285, status: 'DELIVERED', createdAt: '2026-03-20T16:30:00Z',
    deliveryBoy: 'Rajesh P', address: '23, Koramangala, Bangalore', paymentMethod: 'UPI',
  },
  {
    id: 'o5', orderId: 'ND-2026-0005',
    customerName: 'Meera Nair', customerPhone: '9876543214',
    items: [
      { name: 'Nandini Shrikhand', qty: 2, price: 45, unit: '100g' },
      { name: 'Nandini Lassi', qty: 3, price: 25, unit: '200ml' },
    ],
    total: 165, status: 'CANCELLED', createdAt: '2026-03-20T11:00:00Z',
    address: '56, Whitefield, Bangalore', paymentMethod: 'ONLINE',
  },
  {
    id: 'o6', orderId: 'ND-2026-0006',
    customerName: 'Sunil Patil', customerPhone: '9876543215',
    items: [
      { name: 'Nandini Toned Milk', qty: 6, price: 27, unit: '500ml' },
      { name: 'Nandini Buttermilk', qty: 4, price: 15, unit: '200ml' },
    ],
    total: 222, status: 'PENDING', createdAt: '2026-03-21T10:00:00Z',
    address: '90, Indiranagar, Bangalore', paymentMethod: 'COD',
  },
  {
    id: 'o7', orderId: 'ND-2026-0007',
    customerName: 'Deepa Hegde', customerPhone: '9876543216',
    items: [
      { name: 'Nandini Ice Cream Vanilla', qty: 2, price: 80, unit: '500ml' },
      { name: 'Nandini Ice Cream Mango', qty: 1, price: 90, unit: '500ml' },
    ],
    total: 250, status: 'CONFIRMED', createdAt: '2026-03-21T09:45:00Z',
    deliveryBoy: 'Anil R', address: '34, Basavanagudi, Bangalore', paymentMethod: 'UPI',
  },
  {
    id: 'o8', orderId: 'ND-2026-0008',
    customerName: 'Vikram Joshi', customerPhone: '9876543217',
    items: [
      { name: 'Nandini Curd', qty: 3, price: 35, unit: '400g' },
      { name: 'Nandini Peda', qty: 1, price: 180, unit: '250g' },
    ],
    total: 285, status: 'DELIVERED', createdAt: '2026-03-20T14:20:00Z',
    deliveryBoy: 'Manoj K', address: '67, RT Nagar, Bangalore', paymentMethod: 'ONLINE',
  },
  {
    id: 'o9', orderId: 'ND-2026-0009',
    customerName: 'Lakshmi Iyer', customerPhone: '9876543218',
    items: [
      { name: 'Nandini Good Life Milk', qty: 2, price: 60, unit: '1L' },
      { name: 'Nandini Fresh Cream', qty: 1, price: 65, unit: '200ml' },
    ],
    total: 185, status: 'OUT_FOR_DELIVERY', createdAt: '2026-03-21T08:00:00Z',
    deliveryBoy: 'Suresh S', address: '11, JP Nagar, Bangalore', paymentMethod: 'COD',
  },
  {
    id: 'o10', orderId: 'ND-2026-0010',
    customerName: 'Arun Murthy', customerPhone: '9876543219',
    items: [
      { name: 'Nandini Flavoured Milk Rose', qty: 5, price: 20, unit: '200ml' },
    ],
    total: 100, status: 'PENDING', createdAt: '2026-03-21T10:30:00Z',
    address: '89, Malleshwaram, Bangalore', paymentMethod: 'UPI',
  },
  {
    id: 'o11', orderId: 'ND-2026-0011',
    customerName: 'Sneha Rao', customerPhone: '9876543220',
    items: [
      { name: 'Nandini Paneer', qty: 3, price: 90, unit: '200g' },
      { name: 'Nandini Pure Ghee', qty: 1, price: 280, unit: '500ml' },
    ],
    total: 550, status: 'CONFIRMED', createdAt: '2026-03-21T07:30:00Z',
    deliveryBoy: 'Rajesh P', address: '45, Vijayanagar, Bangalore', paymentMethod: 'ONLINE',
  },
  {
    id: 'o12', orderId: 'ND-2026-0012',
    customerName: 'Mohan Das', customerPhone: '9876543221',
    items: [
      { name: 'Nandini Milk Powder', qty: 2, price: 350, unit: '500g' },
    ],
    total: 700, status: 'DELIVERED', createdAt: '2026-03-19T15:00:00Z',
    deliveryBoy: 'Anil R', address: '22, Banashankari, Bangalore', paymentMethod: 'COD',
  },
  {
    id: 'o13', orderId: 'ND-2026-0013',
    customerName: 'Kavitha Shetty', customerPhone: '9876543222',
    items: [
      { name: 'Nandini Cheese Block', qty: 1, price: 160, unit: '200g' },
      { name: 'Nandini Butter', qty: 2, price: 55, unit: '100g' },
      { name: 'Nandini Toned Milk', qty: 2, price: 27, unit: '500ml' },
    ],
    total: 324, status: 'PENDING', createdAt: '2026-03-21T11:00:00Z',
    address: '78, Yelahanka, Bangalore', paymentMethod: 'UPI',
  },
  {
    id: 'o14', orderId: 'ND-2026-0014',
    customerName: 'Ganesh Bhat', customerPhone: '9876543223',
    items: [
      { name: 'Nandini Mysore Pak', qty: 1, price: 220, unit: '250g' },
      { name: 'Nandini Shrikhand', qty: 2, price: 45, unit: '100g' },
    ],
    total: 310, status: 'DELIVERED', createdAt: '2026-03-19T12:00:00Z',
    deliveryBoy: 'Suresh S', address: '33, Sadashivanagar, Bangalore', paymentMethod: 'ONLINE',
  },
  {
    id: 'o15', orderId: 'ND-2026-0015',
    customerName: 'Pooja Kulkarni', customerPhone: '9876543224',
    items: [
      { name: 'Nandini Good Life Milk', qty: 3, price: 60, unit: '1L' },
      { name: 'Nandini Fresh Curd', qty: 2, price: 35, unit: '400g' },
      { name: 'Nandini Buttermilk', qty: 6, price: 15, unit: '200ml' },
    ],
    total: 340, status: 'CONFIRMED', createdAt: '2026-03-21T06:45:00Z',
    deliveryBoy: 'Manoj K', address: '55, Rajajinagar, Bangalore', paymentMethod: 'COD',
  },
];

// ─── Products ───────────────────────────────────────────────
export const DUMMY_PRODUCTS: AdminProduct[] = [
  { id: 'p1', name: 'Nandini Toned Milk', category: 'Milk', price: 27, b2bPrice: 22, unit: '500ml', image: `${S3}/nandini_toned_milk.jpg`, inStock: true, stockQty: 500, description: 'Fresh toned milk with 3% fat content' },
  { id: 'p2', name: 'Nandini Good Life Milk', category: 'Milk', price: 60, b2bPrice: 50, unit: '1L', image: `${S3}/nandini_goodlife.jpg`, inStock: true, stockQty: 350, description: 'Premium full cream milk' },
  { id: 'p3', name: 'Nandini Homogenised Milk', category: 'Milk', price: 30, b2bPrice: 25, unit: '500ml', image: `${S3}/nandini_homogenised.jpg`, inStock: true, stockQty: 420, description: 'Homogenised standardised milk' },
  { id: 'p4', name: 'Nandini Fresh Curd', category: 'Curd', price: 35, b2bPrice: 28, unit: '400g', image: `${S3}/nandini_curd.jpg`, inStock: true, stockQty: 280, description: 'Thick and creamy set curd' },
  { id: 'p5', name: 'Nandini Slim Curd', category: 'Curd', price: 30, b2bPrice: 24, unit: '400g', image: `${S3}/nandini_slim_curd.jpg`, inStock: true, stockQty: 150, description: 'Low fat curd for health conscious' },
  { id: 'p6', name: 'Nandini Pure Ghee', category: 'Ghee', price: 520, b2bPrice: 480, unit: '1L', image: `${S3}/nandini_ghee.jpg`, inStock: true, stockQty: 120, description: 'Pure cow ghee, aromatic and rich' },
  { id: 'p7', name: 'Nandini Pure Ghee', category: 'Ghee', price: 280, b2bPrice: 255, unit: '500ml', image: `${S3}/nandini_ghee_500.jpg`, inStock: true, stockQty: 200, description: 'Pure cow ghee, aromatic and rich' },
  { id: 'p8', name: 'Nandini Butter', category: 'Butter', price: 55, b2bPrice: 45, unit: '100g', image: `${S3}/nandini_butter.jpg`, inStock: true, stockQty: 300, description: 'Pasteurised table butter' },
  { id: 'p9', name: 'Nandini Paneer', category: 'Paneer', price: 90, b2bPrice: 75, unit: '200g', image: `${S3}/nandini_paneer.jpg`, inStock: true, stockQty: 180, description: 'Fresh soft paneer' },
  { id: 'p10', name: 'Nandini Cheese Slices', category: 'Cheese', price: 120, b2bPrice: 100, unit: '200g', image: `${S3}/nandini_cheese.jpg`, inStock: true, stockQty: 90, description: 'Processed cheese slices' },
  { id: 'p11', name: 'Nandini Cheese Block', category: 'Cheese', price: 160, b2bPrice: 135, unit: '200g', image: `${S3}/nandini_cheese_block.jpg`, inStock: false, stockQty: 0, description: 'Cooking cheese block' },
  { id: 'p12', name: 'Nandini Buttermilk', category: 'Beverages', price: 15, b2bPrice: 12, unit: '200ml', image: `${S3}/nandini_buttermilk.jpg`, inStock: true, stockQty: 600, description: 'Spiced masala buttermilk' },
  { id: 'p13', name: 'Nandini Lassi', category: 'Beverages', price: 25, b2bPrice: 20, unit: '200ml', image: `${S3}/nandini_lassi.jpg`, inStock: true, stockQty: 400, description: 'Sweet punjabi lassi' },
  { id: 'p14', name: 'Nandini Flavoured Milk Rose', category: 'Beverages', price: 20, b2bPrice: 16, unit: '200ml', image: `${S3}/nandini_rose_milk.jpg`, inStock: true, stockQty: 350, description: 'Rose flavoured cold milk' },
  { id: 'p15', name: 'Nandini Fresh Cream', category: 'Cream', price: 65, b2bPrice: 55, unit: '200ml', image: `${S3}/nandini_cream.jpg`, inStock: true, stockQty: 150, description: 'Fresh dairy cream' },
  { id: 'p16', name: 'Nandini Shrikhand', category: 'Sweets', price: 45, b2bPrice: 38, unit: '100g', image: `${S3}/nandini_shrikhand.jpg`, inStock: true, stockQty: 100, description: 'Saffron flavoured shrikhand' },
  { id: 'p17', name: 'Nandini Peda', category: 'Sweets', price: 180, b2bPrice: 155, unit: '250g', image: `${S3}/nandini_peda.jpg`, inStock: true, stockQty: 80, description: 'Traditional milk peda' },
  { id: 'p18', name: 'Nandini Mysore Pak', category: 'Sweets', price: 220, b2bPrice: 195, unit: '250g', image: `${S3}/nandini_mysore_pak.jpg`, inStock: true, stockQty: 60, description: 'Authentic Mysore Pak sweet' },
  { id: 'p19', name: 'Nandini Ice Cream Vanilla', category: 'Ice Cream', price: 80, b2bPrice: 65, unit: '500ml', image: `${S3}/nandini_ice_cream_vanilla.jpg`, inStock: true, stockQty: 200, description: 'Creamy vanilla ice cream' },
  { id: 'p20', name: 'Nandini Ice Cream Mango', category: 'Ice Cream', price: 90, b2bPrice: 75, unit: '500ml', image: `${S3}/nandini_ice_cream_mango.jpg`, inStock: false, stockQty: 0, description: 'Rich mango ice cream' },
  { id: 'p21', name: 'Nandini Milk Powder', category: 'Milk Powder', price: 350, b2bPrice: 310, unit: '500g', image: `${S3}/nandini_milk_powder.jpg`, inStock: true, stockQty: 100, description: 'Spray dried milk powder' },
];

// ─── Distributors ───────────────────────────────────────────
export const DUMMY_DISTRIBUTORS: AdminDistributor[] = [
  { id: 'd1', businessName: 'KR Dairy Distributors', ownerName: 'Krishna Rao', phone: '9845012345', email: 'krish@krdairy.in', area: 'Jayanagar', gstin: '29AABCU9603R1Z1', status: 'ACTIVE', creditLimit: 200000, creditUsed: 85000, totalOrders: 156, joinedAt: '2025-06-15' },
  { id: 'd2', businessName: 'Bangalore Fresh Stores', ownerName: 'Ramesh Gowda', phone: '9845012346', email: 'ramesh@bfs.in', area: 'Koramangala', gstin: '29AADCB1234R1Z2', status: 'ACTIVE', creditLimit: 150000, creditUsed: 42000, totalOrders: 98, joinedAt: '2025-08-20' },
  { id: 'd3', businessName: 'South City Milk Agency', ownerName: 'Venkat Reddy', phone: '9845012347', email: 'venkat@scma.in', area: 'HSR Layout', gstin: '29AAFCS5678R1Z3', status: 'PENDING', creditLimit: 0, creditUsed: 0, totalOrders: 0, joinedAt: '2026-03-18' },
  { id: 'd4', businessName: 'Namma Dairy Hub', ownerName: 'Suresh Patil', phone: '9845012348', email: 'suresh@nammadairy.in', area: 'Indiranagar', gstin: '29AABCN9012R1Z4', status: 'ACTIVE', creditLimit: 300000, creditUsed: 175000, totalOrders: 234, joinedAt: '2025-03-10' },
  { id: 'd5', businessName: 'Green Valley Enterprises', ownerName: 'Anand Kumar', phone: '9845012349', email: 'anand@greenvalley.in', area: 'Whitefield', gstin: '29AADCG3456R1Z5', status: 'SUSPENDED', creditLimit: 100000, creditUsed: 98000, totalOrders: 67, joinedAt: '2025-11-05' },
  { id: 'd6', businessName: 'Metro Dairy Partners', ownerName: 'Prakash Shetty', phone: '9845012350', email: 'prakash@metro.in', area: 'Malleshwaram', gstin: '29AAFCM7890R1Z6', status: 'ACTIVE', creditLimit: 250000, creditUsed: 120000, totalOrders: 189, joinedAt: '2025-04-22' },
  { id: 'd7', businessName: 'Fresh Morning Supplies', ownerName: 'Divya Hegde', phone: '9845012351', email: 'divya@freshmorning.in', area: 'Yelahanka', gstin: '29AABCF1234R1Z7', status: 'PENDING', creditLimit: 0, creditUsed: 0, totalOrders: 0, joinedAt: '2026-03-20' },
  { id: 'd8', businessName: 'JP Nagar Milk Centre', ownerName: 'Mahesh Bhat', phone: '9845012352', email: 'mahesh@jpmc.in', area: 'JP Nagar', gstin: '29AADCJ5678R1Z8', status: 'ACTIVE', creditLimit: 180000, creditUsed: 65000, totalOrders: 112, joinedAt: '2025-07-14' },
];

// ─── Delivery Boys ──────────────────────────────────────────
export const DUMMY_DELIVERY_BOYS: AdminDeliveryBoy[] = [
  { id: 'db1', name: 'Manoj Kumar', phone: '9900112233', area: 'Jayanagar / JP Nagar', isAvailable: true, isOnline: true, activeOrders: 2, totalDeliveries: 456, rating: 4.8, vehicleType: 'BIKE' },
  { id: 'db2', name: 'Suresh Shankar', phone: '9900112234', area: 'HSR Layout / Koramangala', isAvailable: true, isOnline: true, activeOrders: 1, totalDeliveries: 389, rating: 4.6, vehicleType: 'BIKE' },
  { id: 'db3', name: 'Rajesh Prasad', phone: '9900112235', area: 'Koramangala / Indiranagar', isAvailable: true, isOnline: true, activeOrders: 3, totalDeliveries: 512, rating: 4.9, vehicleType: 'BIKE' },
  { id: 'db4', name: 'Anil Ramesh', phone: '9900112236', area: 'Basavanagudi / Malleshwaram', isAvailable: false, isOnline: true, activeOrders: 2, totalDeliveries: 287, rating: 4.5, vehicleType: 'BIKE' },
  { id: 'db5', name: 'Ravi Naik', phone: '9900112237', area: 'Whitefield / Marathahalli', isAvailable: true, isOnline: false, activeOrders: 0, totalDeliveries: 198, rating: 4.3, vehicleType: 'CYCLE' },
  { id: 'db6', name: 'Prashanth Gowda', phone: '9900112238', area: 'Yelahanka / Hebbal', isAvailable: true, isOnline: true, activeOrders: 1, totalDeliveries: 334, rating: 4.7, vehicleType: 'BIKE' },
  { id: 'db7', name: 'Deepak Sagar', phone: '9900112239', area: 'RT Nagar / Sadashivanagar', isAvailable: false, isOnline: false, activeOrders: 0, totalDeliveries: 145, rating: 4.2, vehicleType: 'AUTO' },
  { id: 'db8', name: 'Vinay Kumar', phone: '9900112240', area: 'Vijayanagar / Rajajinagar', isAvailable: true, isOnline: true, activeOrders: 2, totalDeliveries: 421, rating: 4.8, vehicleType: 'BIKE' },
  { id: 'db9', name: 'Harish Yadav', phone: '9900112241', area: 'Banashankari / Girinagar', isAvailable: true, isOnline: true, activeOrders: 0, totalDeliveries: 267, rating: 4.4, vehicleType: 'BIKE' },
  { id: 'db10', name: 'Santosh Babu', phone: '9900112242', area: 'Electronic City / BTM', isAvailable: false, isOnline: false, activeOrders: 0, totalDeliveries: 89, rating: 4.1, vehicleType: 'CYCLE' },
];

// ─── Revenue Data ───────────────────────────────────────────
export const MONTHLY_REVENUE: RevenueMonth[] = [
  { month: 'Oct', revenue: 78500, orders: 234 },
  { month: 'Nov', revenue: 92300, orders: 278 },
  { month: 'Dec', revenue: 105800, orders: 312 },
  { month: 'Jan', revenue: 98400, orders: 295 },
  { month: 'Feb', revenue: 112600, orders: 341 },
  { month: 'Mar', revenue: 96600, orders: 287 },
];

// ─── Status Colors ──────────────────────────────────────────
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: '#F39C12',
  CONFIRMED: '#2196F3',
  OUT_FOR_DELIVERY: '#9C27B0',
  DELIVERED: '#4CAF50',
  CANCELLED: '#F44336',
};

export const DISTRIBUTOR_STATUS_COLORS: Record<DistributorStatus, string> = {
  ACTIVE: '#4CAF50',
  PENDING: '#F39C12',
  SUSPENDED: '#F44336',
};

// ─── Product Categories ─────────────────────────────────────
export const PRODUCT_CATEGORIES = ['All', 'Milk', 'Curd', 'Ghee', 'Butter', 'Paneer', 'Cheese', 'Beverages', 'Cream', 'Sweets', 'Ice Cream', 'Milk Powder'];
