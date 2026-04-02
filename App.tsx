"use client"

import type React from "react"
import { useState } from "react"
import { View } from "react-native"

import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { CartProvider } from "./src/context/CartContext"
import { UserProvider, useUser } from "./src/context/UserContext"
import { SplashScreen } from "./src/screens/SplashScreen"
import { HomeScreen } from "./src/screens/HomeScreen"
import { ProductDetailScreen } from "./src/screens/ProductDetailScreen"
import { CartScreen } from "./src/screens/CartScreen"
import { OrdersScreen } from "./src/screens/OrdersScreen"
import { RestaurantScreen } from "./src/screens/RestaurantScreen"
import { FavouritesScreen } from "./src/screens/FavouritesScreen"
import { LoginScreen } from "./src/screens/LoginScreen"
import { AddressConfirmScreen } from "./src/screens/AddressConfirmScreen"
import { OrderSuccessScreen } from "./src/screens/OrderSuccessScreen"
import AddressManagerScreen from "./src/screens/AddressManagerScreen"
import { ProfileScreen } from "./src/screens/ProfileScreen"
import { SubscriptionScreen } from "./src/screens/SubscriptionScreen"
import { CreateSubscriptionScreen } from "./src/screens/CreateSubscriptionScreen"
import WalletScreen from "./src/screens/WalletScreen"
import { ComplaintScreen } from "./src/screens/ComplaintScreen"
import { OrderTrackingScreen } from "./src/screens/OrderTrackingScreen"

// ── Delivery screens ──
import { DeliveryHomeScreen } from "./src/screens/delivery/DeliveryHomeScreen"
import { DeliveryListScreen } from "./src/screens/delivery/DeliveryListScreen"
import { DeliveryDetailScreen } from "./src/screens/delivery/DeliveryDetailScreen"
import { DeliveryOtpScreen } from "./src/screens/delivery/DeliveryOtpScreen"
import { DeliveryEarningsScreen } from "./src/screens/delivery/DeliveryEarningsScreen"
import { DeliverySettlementScreen } from "./src/screens/delivery/DeliverySettlementScreen"
import { DeliveryLeaveScreen } from "./src/screens/delivery/DeliveryLeaveScreen"
import { DeliveryProfileScreen } from "./src/screens/delivery/DeliveryProfileScreen"

// ── Distributor screens ──
import { DistributorHomeScreen } from "./src/screens/distributor/DistributorHomeScreen"
import { DistributorCatalogScreen } from "./src/screens/distributor/DistributorCatalogScreen"
import { DistributorOrdersScreen } from "./src/screens/distributor/DistributorOrdersScreen"
import { DistributorInvoicesScreen } from "./src/screens/distributor/DistributorInvoicesScreen"
import { DistributorProfileScreen } from "./src/screens/distributor/DistributorProfileScreen"
import { DistributorAssignedOrdersScreen } from "./src/screens/distributor/DistributorAssignedOrdersScreen"

// ── Admin screens ──
import { AdminHomeScreen } from "./src/screens/admin/AdminHomeScreen"
import { AdminOrdersScreen } from "./src/screens/admin/AdminOrdersScreen"
import { AdminProductsScreen } from "./src/screens/admin/AdminProductsScreen"
import { AdminDistributorsScreen } from "./src/screens/admin/AdminDistributorsScreen"
import { AdminDeliveryBoysScreen } from "./src/screens/admin/AdminDeliveryBoysScreen"
import { AdminRevenueScreen } from "./src/screens/admin/AdminRevenueScreen"

const CustomerStack = createNativeStackNavigator()
const DeliveryStack = createNativeStackNavigator()
const DistributorStack = createNativeStackNavigator()
const AdminStack = createNativeStackNavigator()

function CustomerNavigator(): React.JSX.Element {
  return (
    <CustomerStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
      initialRouteName="Home"
    >
      <CustomerStack.Screen name="Home" component={HomeScreen} />
      <CustomerStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <CustomerStack.Screen name="Profile" component={ProfileScreen} />
      <CustomerStack.Screen name="AddressManager" component={AddressManagerScreen} />
      <CustomerStack.Screen name="Cart" component={CartScreen} />
      <CustomerStack.Screen name="Orders" component={OrdersScreen} />
      <CustomerStack.Screen name="Restaurant" component={RestaurantScreen} />
      <CustomerStack.Screen name="Favourites" component={FavouritesScreen} />
      <CustomerStack.Screen name="Login" component={LoginScreen} />
      <CustomerStack.Screen name="AddressConfirm" component={AddressConfirmScreen} />
      <CustomerStack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
      <CustomerStack.Screen name="Subscription" component={SubscriptionScreen} />
      <CustomerStack.Screen name="CreateSubscription" component={CreateSubscriptionScreen} />
      <CustomerStack.Screen name="Wallet" component={WalletScreen} />
      <CustomerStack.Screen name="Complaint" component={ComplaintScreen} />
      <CustomerStack.Screen name="OrderTracking" component={OrderTrackingScreen} />
    </CustomerStack.Navigator>
  )
}

function DeliveryNavigator(): React.JSX.Element {
  return (
    <DeliveryStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
      initialRouteName="DeliveryHome"
    >
      <DeliveryStack.Screen name="DeliveryHome" component={DeliveryHomeScreen} />
      <DeliveryStack.Screen name="DeliveryList" component={DeliveryListScreen} />
      <DeliveryStack.Screen name="DeliveryDetail" component={DeliveryDetailScreen} />
      <DeliveryStack.Screen name="DeliveryOtp" component={DeliveryOtpScreen} />
      <DeliveryStack.Screen name="DeliveryEarnings" component={DeliveryEarningsScreen} />
      <DeliveryStack.Screen name="DeliverySettlement" component={DeliverySettlementScreen} />
      <DeliveryStack.Screen name="DeliveryLeave" component={DeliveryLeaveScreen} />
      <DeliveryStack.Screen name="DeliveryProfile" component={DeliveryProfileScreen} />
    </DeliveryStack.Navigator>
  )
}

function DistributorNavigator(): React.JSX.Element {
  return (
    <DistributorStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
      initialRouteName="DistributorHome"
    >
      <DistributorStack.Screen name="DistributorHome" component={DistributorHomeScreen} />
      <DistributorStack.Screen name="DistributorCatalog" component={DistributorCatalogScreen} />
      <DistributorStack.Screen name="DistributorOrders" component={DistributorOrdersScreen} />
      <DistributorStack.Screen name="DistributorInvoices" component={DistributorInvoicesScreen} />
      <DistributorStack.Screen name="DistributorProfile" component={DistributorProfileScreen} />
      <DistributorStack.Screen name="DistributorAssignedOrders" component={DistributorAssignedOrdersScreen} />
    </DistributorStack.Navigator>
  )
}

function AdminNavigator(): React.JSX.Element {
  return (
    <AdminStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
      initialRouteName="AdminHome"
    >
      <AdminStack.Screen name="AdminHome" component={AdminHomeScreen} />
      <AdminStack.Screen name="AdminOrders" component={AdminOrdersScreen} />
      <AdminStack.Screen name="AdminProducts" component={AdminProductsScreen} />
      <AdminStack.Screen name="AdminDistributors" component={AdminDistributorsScreen} />
      <AdminStack.Screen name="AdminDeliveryBoys" component={AdminDeliveryBoysScreen} />
      <AdminStack.Screen name="AdminRevenue" component={AdminRevenueScreen} />
    </AdminStack.Navigator>
  )
}

function RoleBasedNavigator(): React.JSX.Element {
  const { role, isLoggedIn } = useUser()

  if (!isLoggedIn) {
    // Guests browse as customer (with Login screen available)
    return <CustomerNavigator />
  }

  if (role === "admin") {
    return <AdminNavigator />
  }
  if (role === "delivery_boy") {
    return <DeliveryNavigator />
  }
  if (role === "distributor") {
    return <DistributorNavigator />
  }
  return <CustomerNavigator />
}

const DEMO_EXPIRY = new Date("2026-04-10T23:59:59")

function App(): React.JSX.Element {
  const [showSplash, setShowSplash] = useState(true)

  if (new Date() > DEMO_EXPIRY) {
    return <View style={{ flex: 1, backgroundColor: "#000" }} />
  }

  return (
    <SafeAreaProvider>
      <UserProvider>
        <CartProvider>
          {showSplash ? (
            <SplashScreen onFinish={() => setShowSplash(false)} />
          ) : (
            <NavigationContainer>
              <RoleBasedNavigator />
            </NavigationContainer>
          )}
        </CartProvider>
      </UserProvider>
    </SafeAreaProvider>
  )
}

export default App
