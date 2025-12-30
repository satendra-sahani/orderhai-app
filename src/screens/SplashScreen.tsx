"use client"

import { useEffect, useRef } from "react"
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native"
import { colors } from "../theme/colors"

const { width } = Dimensions.get("window")

export const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const logoScale = useRef(new Animated.Value(0)).current
  const logoRotate = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start()

    const timer = setTimeout(() => {
      onFinish()
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [{ scale: logoScale }, { rotate: spin }],
          },
        ]}
      >
        <Text style={styles.logoIcon}>🛒</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.title}>OrderHai</Text>
        <Text style={styles.tagline}>Your daily needs delivered</Text>
        <View style={styles.dotsContainer}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    width: 120,
    height: 120,
    backgroundColor: colors.white,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 60,
  },
  textContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: 2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
    marginBottom: 30,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
})
