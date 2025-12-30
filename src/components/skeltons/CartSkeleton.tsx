// components/CartSkeleton.tsx
"use client"

import React from "react"
import { View, StyleSheet, ScrollView } from "react-native"
import { Skeleton } from "../Skeleton"
import { colors } from "../../theme/colors"

export const CartSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Delivery section */}
      <View style={styles.section}>
        <Skeleton width="60%" height={12} />
        <View style={{ height: 8 }} />
        <Skeleton width="80%" height={14} />
        <View style={{ height: 10 }} />
        <Skeleton width="40%" height={10} />
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Items */}
        <View style={styles.section}>
          <Skeleton width="40%" height={14} />
          <View style={{ height: 12 }} />
          {Array.from({ length: 3 }).map((_, idx) => (
            <View key={idx} style={styles.itemRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Skeleton width="70%" height={12} />
                <View style={{ height: 6 }} />
                <Skeleton width="40%" height={10} />
                <View style={{ height: 6 }} />
                <Skeleton width="50%" height={10} />
              </View>
              <Skeleton width={70} height={26} radius={6} />
            </View>
          ))}
        </View>

        {/* Bill */}
        <View style={styles.section}>
          <Skeleton width="50%" height={14} />
          <View style={{ height: 10 }} />
          {Array.from({ length: 3 }).map((_, idx) => (
            <View key={idx} style={styles.billRow}>
              <Skeleton width="40%" height={10} />
              <Skeleton width="20%" height={10} />
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Skeleton width={120} height={24} />
        <Skeleton width={140} height={40} radius={12} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8F8" },
  section: {
    backgroundColor: colors.white,
    padding: 16,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
})
