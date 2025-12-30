// components/ProductDetailSkeleton.tsx
"use client"

import React from "react"
import { View, StyleSheet, ScrollView } from "react-native"
import { Skeleton } from "../Skeleton"
import { colors } from "../../theme/colors"

export const ProductDetailSkeleton = () => {
  return (
    <View style={styles.container}>
      <Skeleton width="100%" height={260} radius={0} />

      <ScrollView style={styles.infoContainer}>
        <Skeleton width="70%" height={20} />
        <View style={{ height: 8 }} />
        <Skeleton width="40%" height={14} />
        <View style={{ height: 12 }} />
        <Skeleton width="100%" height={10} />
        <View style={{ height: 6 }} />
        <Skeleton width="90%" height={10} />
        <View style={{ height: 6 }} />
        <Skeleton width="80%" height={10} />

        <View style={{ height: 20 }} />
        <Skeleton width="50%" height={16} />
        <View style={{ height: 10 }} />
        {Array.from({ length: 3 }).map((_, idx) => (
          <View key={idx} style={{ marginBottom: 10 }}>
            <Skeleton width="100%" height={54} radius={12} />
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Skeleton width={90} height={22} />
        <Skeleton width={140} height={40} radius={12} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  infoContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.white,
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
})
