// components/HomeSkeleton.tsx
"use client"

import React from "react"
import { View, StyleSheet, ScrollView } from "react-native"
import { Skeleton } from "../Skeleton"
import { colors } from "../../theme/colors"

export const HomeSkeleton = () => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Greeting header */}
      <View style={styles.headerRow}>
        <Skeleton width={40} height={40} radius={20} />
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Skeleton width="80%" height={14} />
          <View style={{ height: 4 }} />
          <Skeleton width="60%" height={10} />
        </View>
        <Skeleton width={70} height={28} radius={8} />
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <Skeleton width="100%" height={44} radius={8} />
      </View>

      {/* Category pill row */}
      <View style={styles.categoryRow}>
        <Skeleton width={70} height={30} radius={16} />
        <Skeleton width={70} height={30} radius={16} />
        <Skeleton width={70} height={30} radius={16} />
      </View>

      {/* Product cards grid */}
      <View style={styles.grid}>
        {Array.from({ length: 6 }).map((_, idx) => (
          <View key={idx} style={styles.card}>
            <Skeleton width="100%" height={110} radius={12} />
            <View style={{ padding: 8 }}>
              <Skeleton width="80%" height={12} />
              <View style={{ height: 4 }} />
              <Skeleton width="40%" height={10} />
              <View style={{ height: 8 }} />
              <Skeleton width="60%" height={12} />
              <View style={{ height: 8 }} />
              <Skeleton width="50%" height={24} radius={12} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightBackground,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  searchSection: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
  },
  card: {
    width: "50%",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
})
