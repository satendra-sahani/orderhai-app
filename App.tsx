"use client"

import type React from "react"
import { useState } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { CartProvider } from "./src/context/CartContext"
import { UserProvider } from "./src/context/UserContext"
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

const Stack = createNativeStackNavigator()

function App(): React.JSX.Element {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <SafeAreaProvider>
      <UserProvider>
        <CartProvider>
          {showSplash ? (
            <SplashScreen onFinish={() => setShowSplash(false)} />
          ) : (
            <NavigationContainer>
              <Stack.Navigator
                screenOptions={{
                  headerShown: false,
                  animation: "slide_from_right",
                }}
                initialRouteName="Home"
              >
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                 <Stack.Screen
            name="AddressManager"
            component={AddressManagerScreen}
          />
                <Stack.Screen name="Cart" component={CartScreen} />
                <Stack.Screen name="Orders" component={OrdersScreen} />
                <Stack.Screen name="Restaurant" component={RestaurantScreen} />
                <Stack.Screen name="Favourites" component={FavouritesScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="AddressConfirm" component={AddressConfirmScreen} />
                <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          )}
        </CartProvider>
      </UserProvider>
    </SafeAreaProvider>
  )
}

export default App
