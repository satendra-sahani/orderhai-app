// src/screens/delivery/DeliveryLeaveScreen.tsx
"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "../../components/Icon";
import { colors } from "../../theme/colors";
import { apiRequestLeave, apiGetLeaveRequests } from "../../api";

const getLeaveStatusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case "APPROVED":
      return colors.success;
    case "REJECTED":
      return colors.error;
    case "PENDING":
      return colors.warning;
    default:
      return colors.textLight;
  }
};

export const DeliveryLeaveScreen = ({ navigation }: any) => {
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [dateInput, setDateInput] = useState("");
  const [reasonInput, setReasonInput] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadLeaveRequests = async () => {
    try {
      const data = await apiGetLeaveRequests();
      const list = Array.isArray(data) ? data : (data as any)?.leaves ?? [];
      setLeaveRequests(list);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load leave requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  const handleSubmitLeave = async () => {
    const trimmedDate = dateInput.trim();
    const trimmedReason = reasonInput.trim();

    if (!trimmedDate) {
      Alert.alert("Missing date", "Please enter a date (YYYY-MM-DD).");
      return;
    }
    if (!trimmedReason) {
      Alert.alert("Missing reason", "Please enter a reason for leave.");
      return;
    }

    // Basic date validation
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(trimmedDate)) {
      Alert.alert("Invalid date", "Please enter the date in YYYY-MM-DD format.");
      return;
    }

    setSubmitting(true);
    try {
      await apiRequestLeave(trimmedDate, trimmedReason);
      Alert.alert("Success", "Leave request submitted.");
      setDateInput("");
      setReasonInput("");
      setShowForm(false);
      await loadLeaveRequests();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const renderItem = ({ item }: { item: any }) => {
    const status = (item.status || "PENDING").toUpperCase();
    const statusColor = getLeaveStatusColor(status);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.leaveDate}>
              {formatDate(item.date || item.createdAt)}
            </Text>
            <Text style={styles.leaveReason} numberOfLines={2}>
              {item.reason || "No reason provided"}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${statusColor}20` },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
              {status}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave Management</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Icon
            name={showForm ? "close" : "add-circle-outline"}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Leave Request Form */}
      {showForm && (
        <View style={styles.formSection}>
          <Text style={styles.formTitle}>Request Leave</Text>

          <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={dateInput}
            onChangeText={setDateInput}
            placeholder="e.g. 2026-03-25"
            placeholderTextColor={colors.textLight}
          />

          <Text style={styles.label}>Reason</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={reasonInput}
            onChangeText={setReasonInput}
            placeholder="Enter reason for leave"
            placeholderTextColor={colors.textLight}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              submitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitLeave}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Submit Request</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : leaveRequests.length === 0 ? (
        <View style={styles.center}>
          <Icon name="calendar-outline" size={64} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No leave requests</Text>
          <Text style={styles.emptySubtitle}>
            Tap the + button to request a leave.
          </Text>
        </View>
      ) : (
        <FlatList
          data={leaveRequests}
          keyExtractor={(item, index) =>
            item._id || item.id || String(index)
          }
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
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
    fontWeight: "600",
    color: colors.text,
    flex: 1,
    textAlign: "center",
  },
  formSection: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 70,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  leaveDate: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  leaveReason: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default DeliveryLeaveScreen;
