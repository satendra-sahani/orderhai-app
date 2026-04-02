// File: src/screens/ComplaintScreen.tsx
"use client";

import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { Icon } from "../components/Icon";
import { apiCreateComplaint } from "../api";

type ComplaintType = "QUALITY" | "DELIVERY" | "PAYMENT" | "OTHER";

const COMPLAINT_TYPES: { key: ComplaintType; label: string; icon: string }[] = [
  { key: "QUALITY", label: "Quality Issue", icon: "alert-circle" },
  { key: "DELIVERY", label: "Delivery Issue", icon: "car" },
  { key: "PAYMENT", label: "Payment Issue", icon: "card" },
  { key: "OTHER", label: "Other", icon: "help-circle" },
];

export const ComplaintScreen = ({ route, navigation }: any) => {
  const { orderId } = route.params || {};

  const [type, setType] = useState<ComplaintType | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!type) {
      Alert.alert("Required", "Please select a complaint type.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Required", "Please describe your issue.");
      return;
    }
    if (!orderId) {
      Alert.alert("Error", "Order information is missing.");
      return;
    }

    setSubmitting(true);
    try {
      await apiCreateComplaint({
        orderId,
        type,
        description: description.trim(),
      });
      Alert.alert(
        "Complaint Filed",
        "Your complaint has been submitted. We will look into it and get back to you shortly.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to submit complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F8F8" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Issue</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Order Info */}
        <View style={styles.section}>
          <View style={styles.orderInfoRow}>
            <Icon name="receipt" size={18} color={colors.primary} />
            <Text style={styles.orderInfoText}>
              Order #{orderId || "N/A"}
            </Text>
          </View>
        </View>

        {/* Complaint Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What went wrong?</Text>
          {COMPLAINT_TYPES.map((ct) => (
            <TouchableOpacity
              key={ct.key}
              style={[
                styles.typeCard,
                type === ct.key && styles.typeCardSelected,
              ]}
              onPress={() => setType(ct.key)}
            >
              <View
                style={[
                  styles.typeIconContainer,
                  type === ct.key && styles.typeIconContainerSelected,
                ]}
              >
                <Icon
                  name={ct.icon}
                  size={20}
                  color={type === ct.key ? colors.white : colors.textSecondary}
                />
              </View>
              <Text
                style={[
                  styles.typeLabel,
                  type === ct.key && styles.typeLabelSelected,
                ]}
              >
                {ct.label}
              </Text>
              {type === ct.key && (
                <Icon
                  name="checkmark-circle"
                  size={20}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Describe the issue</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Tell us what happened..."
            placeholderTextColor={colors.textLight}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
          <Text style={styles.charCount}>
            {description.length}/500
          </Text>
        </View>
      </ScrollView>

      {/* Submit button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!type || !description.trim() || submitting) &&
              styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!type || !description.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Icon name="send" size={18} color={colors.white} />
              <Text style={styles.submitButtonText}>Submit Complaint</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  section: {
    backgroundColor: colors.white,
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  orderInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  orderInfoText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  typeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  typeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  typeIconContainerSelected: {
    backgroundColor: colors.primary,
  },
  typeLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  typeLabelSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 120,
  },
  charCount: {
    fontSize: 11,
    color: colors.textLight,
    textAlign: "right",
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default ComplaintScreen;
