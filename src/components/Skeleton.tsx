// components/Skeleton.tsx
"use client"

import React from "react"
import { View, StyleSheet, ViewStyle } from "react-native"
import { colors } from "../theme/colors"

type Props = {
  width?: number | `${number}%`
  height?: number
  radius?: number
  style?: ViewStyle
}

export const Skeleton = ({ width = "100%", height = 16, radius = 8, style }: Props) => {
  return (
    <View
      style={[
        styles.base,
        {
          width: typeof width === "number" || (typeof width === "string" && width.endsWith("%")) ? width : undefined,
          height,
          borderRadius: radius,
        },
        style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: "#E6E9ED",
    overflow: "hidden",
  },
})
