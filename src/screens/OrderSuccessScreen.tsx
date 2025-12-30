"use client"

import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useEffect, useRef } from "react"
import { Icon } from "../components/Icon"
import { colors } from "../theme/colors"

export const OrderSuccessScreen = ({ navigation, route }: any) => {
  const { orderId, total } = route.params
  const scaleAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.successCircle}>
            <Icon name="checkmark" size={60} color={colors.white} />
          </View>
        </Animated.View>

        <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
          <Text style={styles.title}>Order Placed Successfully!</Text>
          <Text style={styles.subtitle}>Your order has been confirmed and will be delivered soon</Text>

          <View style={styles.orderDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Order ID</Text>
              <Text style={styles.detailValue}>#{orderId}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Amount</Text>
              <Text style={styles.detailValue}>₹ {total}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Delivery Time</Text>
              <Text style={styles.detailValue}>30-40 mins</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.trackButton}
              onPress={() => {
                navigation.replace("Orders")
              }}
            >
              <Icon name="location" size={20} color={colors.white} />
              <Text style={styles.trackButtonText}>Track Order</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.homeButton}
              onPress={() => {
                navigation.replace("Home")
              }}
            >
              <Text style={styles.homeButtonText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  iconContainer: {
    marginBottom: 32,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  textContainer: {
    alignItems: "center",
    width: "100%",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  orderDetails: {
    width: "100%",
    backgroundColor: "#F8F8F8",
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "800",
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  trackButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  trackButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.white,
  },
  homeButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
  },
})
