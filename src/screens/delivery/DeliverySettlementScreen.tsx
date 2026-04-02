// src/screens/delivery/DeliverySettlementScreen.tsx
"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "../../components/Icon";
import { colors } from "../../theme/colors";
import { apiGetSettlements } from "../../api";

const getSettlementStatusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case "PAID":
      return colors.success;
    case "PROCESSED":
      return colors.info;
    case "PENDING":
      return colors.warning;
    default:
      return colors.textLight;
  }
};

export const DeliverySettlementScreen = ({ navigation }: any) => {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSettlements = async () => {
    try {
      const data = await apiGetSettlements();
      const list = Array.isArray(data) ? data : (data as any)?.settlements ?? [];
      setSettlements(list);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load settlements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettlements();
  }, []);

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
    const statusColor = getSettlementStatusColor(status);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.periodText}>
              {item.period ||
                `${formatDate(item.startDate || item.createdAt)} - ${formatDate(
                  item.endDate || item.createdAt
                )}`}
            </Text>
            <Text style={styles.deliveriesText}>
              {item.deliveries || item.deliveryCount || 0} deliveries
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

        <View style={styles.cardFooter}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>
            Rs.{(item.amount || 0).toFixed(0)}
          </Text>
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
        <Text style={styles.headerTitle}>Settlements</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : settlements.length === 0 ? (
        <View style={styles.center}>
          <Icon name="receipt-outline" size={64} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No settlements yet</Text>
          <Text style={styles.emptySubtitle}>
            Your settlement history will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={settlements}
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
  },
  placeholder: {
    width: 40,
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
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  periodText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  deliveriesText: {
    fontSize: 12,
    color: colors.textSecondary,
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
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
});

export default DeliverySettlementScreen;
