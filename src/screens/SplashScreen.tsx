"use client"

import { useEffect, useRef } from "react"
import { View, Text, Image, StyleSheet, Animated, Dimensions } from "react-native"
import { colors } from "../theme/colors"

const { width } = Dimensions.get("window")

export const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const logoScale = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
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

  return (
    <View style={styles.container}>
      {/* Green grass strip at top */}
      <View style={styles.greenStrip} />

      <View style={styles.centerContent}>
        <Animated.View
          style={[
            styles.logoContainer,
            { transform: [{ scale: logoScale }] },
          ]}
        >
          <Image
            source={{ uri: "https://www.kmfnandini.coop/_next/static/media/logo.00aae0f8.png" }}
            style={styles.logoImage}
            resizeMode="contain"
          />
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
          <Text style={styles.title}>Nandini</Text>
          <Text style={styles.tagline}>Karnataka's Own Dairy Brand</Text>
          <Text style={styles.subtitle}>Fresh Dairy Delivered Daily</Text>

          <View style={styles.dotsContainer}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </Animated.View>
      </View>

      {/* Bottom info */}
      <Animated.View style={[styles.bottomInfo, { opacity: fadeAnim }]}>
        <Image
          source={{ uri: "https://www.kmfnandini.coop/_next/static/media/corpo-logo.e8b2acaf.jpg" }}
          style={styles.corpoLogo}
          resizeMode="contain"
        />
        <Text style={styles.bottomText}>Karnataka Milk Federation</Text>
      </Animated.View>

      {/* Green grass strip at bottom */}
      <View style={styles.greenStrip} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  greenStrip: {
    height: 4,
    backgroundColor: "#4CAF50",
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    width: 140,
    height: 140,
    backgroundColor: colors.white,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  textContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 40,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: 2,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: "#F39C12",
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
    marginBottom: 28,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  dotActive: {
    backgroundColor: "#F39C12",
    width: 24,
  },
  bottomInfo: {
    alignItems: "center",
    paddingBottom: 20,
    gap: 6,
  },
  corpoLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  bottomText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
  },
})
