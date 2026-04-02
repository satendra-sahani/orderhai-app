// src/screens/delivery/DeliveryEarningsScreen.tsx
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
import { apiGetEarnings, apiGetEarningsHistory } from "../../api";

export const DeliveryEarningsScreen = ({ navigation }: any) => {
  const [earnings, setEarnings] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [earningsData, historyData] = await Promise.all([
        apiGetEarnings(),
        apiGetEarningsHistory(),
      ]);
      setEarnings(earningsData);
      const list = Array.isArray(historyData)
        ? historyData
        : (historyData as any)?.history ?? [];
      setHistory(list);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load earnings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const renderHistoryItem = ({ item }: { item: any }) => (
    <View style={styles.historyRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.historyDate}>
          {formatDate(item.date || item.createdAt)}
        </Text>
        <Text style={styles.historyDeliveries}>
          {item.deliveries || item.count || 0} deliveries
        </Text>
      </View>
      <Text style={styles.historyAmount}>
        Rs.{(item.amount || item.earned || 0).toFixed(0)}
      </Text>
    </View>
  );

  const EarningCard = ({
    label,
    amount,
    iconName,
    bgColor,
    textColor,
  }: {
    label: string;
    amount: number;
    iconName: string;
    bgColor: string;
    textColor: string;
  }) => (
    <View style={[styles.earningCard, { backgroundColor: bgColor }]}>
      <Icon name={iconName} size={22} color={textColor} />
      <Text style={[styles.earningLabel, { color: textColor }]}>{label}</Text>
      <Text style={[styles.earningAmount, { color: textColor }]}>
        Rs.{(amount || 0).toFixed(0)}
      </Text>
    </View>
  );

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
        <Text style={styles.headerTitle}>Earnings</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item, index) =>
            item._id || item.id || item.date || String(index)
          }
          renderItem={renderHistoryItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View>
              {/* Total Earnings */}
              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Total Earnings</Text>
                <Text style={styles.totalAmount}>
                  Rs.{(earnings?.total || earnings?.totalEarnings || 0).toFixed(0)}
                </Text>
              </View>

              {/* Summary Cards */}
              <View style={styles.cardsRow}>
                <EarningCard
                  label="Today"
                  amount={earnings?.today || earnings?.todayEarnings || 0}
                  iconName="today-outline"
                  bgColor={`${colors.success}15`}
                  textColor={colors.success}
                />
                <EarningCard
                  label="Pending"
                  amount={earnings?.pending || earnings?.pendingSettlement || 0}
                  iconName="hourglass-outline"
                  bgColor={`${colors.warning}15`}
                  textColor={colors.warning}
                />
              </View>

              {/* History Header */}
              <Text style={styles.historyTitle}>Last 30 Days</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No earnings history yet.</Text>
            </View>
          }
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
  },
  listContent: {
    padding: 16,
  },
  totalCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.primaryLight,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: colors.white,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  earningCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  earningLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  earningAmount: {
    fontSize: 22,
    fontWeight: "700",
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  historyDeliveries: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default DeliveryEarningsScreen;
