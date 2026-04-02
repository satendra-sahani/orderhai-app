// File: src/screens/WalletScreen.tsx
"use client";

import { useEffect, useState } from "react";
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
  Share,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { Icon } from "../components/Icon";
import { apiGetWallet, apiGetReferralCode, apiApplyReferral } from "../api";
import Clipboard from "@react-native-clipboard/clipboard";

interface Transaction {
  id?: string;
  _id?: string;
  type: string;
  amount: number;
  description?: string;
  createdAt: string;
}

interface WalletData {
  balance: number;
  transactions?: Transaction[];
}

export const WalletScreen = ({ navigation }: any) => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [applyCode, setApplyCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [walletData, referralData] = await Promise.all([
          apiGetWallet(),
          apiGetReferralCode(),
        ]);
        setWallet(walletData as WalletData);
        setReferralCode((referralData as any)?.code || "");
      } catch (err: any) {
        Alert.alert("Error", err.message || "Failed to load wallet data.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleCopyCode = () => {
    if (!referralCode) return;
    try {
      Clipboard.setString(referralCode);
      Alert.alert("Copied!", "Referral code copied to clipboard.");
    } catch {
      Alert.alert("Copied!", `Your code: ${referralCode}`);
    }
  };

  const handleShareCode = async () => {
    if (!referralCode) return;
    try {
      await Share.share({
        message: `Use my referral code ${referralCode} on Nandani and get cashback on your first order!`,
      });
    } catch {}
  };

  const handleApplyReferral = async () => {
    const code = applyCode.trim();
    if (!code) {
      setApplyError("Please enter a referral code.");
      return;
    }

    setApplying(true);
    setApplyError(null);
    try {
      await apiApplyReferral(code);
      Alert.alert("Success", "Referral code applied successfully!");
      setApplyCode("");
      // Refresh wallet
      const walletData = await apiGetWallet();
      setWallet(walletData as WalletData);
    } catch (err: any) {
      setApplyError(err.message || "Invalid referral code.");
    } finally {
      setApplying(false);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F8F8" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wallet & Referrals</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const transactions = wallet?.transactions || [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F8F8" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet & Referrals</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Balance card */}
        <View style={styles.balanceCard}>
          <Icon name="wallet" size={32} color={colors.white} />
          <Text style={styles.balanceLabel}>Wallet Balance</Text>
          <Text style={styles.balanceAmount}>
            ₹{(wallet?.balance || 0).toFixed(2)}
          </Text>
        </View>

        {/* Referral Code Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Referral Code</Text>
          <View style={styles.referralCodeCard}>
            <Text style={styles.referralCodeText}>
              {referralCode || "N/A"}
            </Text>
            <View style={styles.referralActions}>
              <TouchableOpacity
                style={styles.referralButton}
                onPress={handleCopyCode}
              >
                <Icon name="copy" size={18} color={colors.primary} />
                <Text style={styles.referralButtonText}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.referralButton}
                onPress={handleShareCode}
              >
                <Icon name="share-social" size={18} color={colors.primary} />
                <Text style={styles.referralButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Apply Referral Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apply Referral Code</Text>
          <View style={styles.applyRow}>
            <TextInput
              style={styles.applyInput}
              placeholder="Enter referral code"
              placeholderTextColor={colors.textLight}
              value={applyCode}
              onChangeText={setApplyCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.applyButton, applying && styles.buttonDisabled]}
              onPress={handleApplyReferral}
              disabled={applying}
            >
              {applying ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.applyButtonText}>Apply</Text>
              )}
            </TouchableOpacity>
          </View>
          {applyError && (
            <Text style={styles.errorText}>{applyError}</Text>
          )}
        </View>

        {/* Transaction History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {transactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet.</Text>
          ) : (
            transactions.map((txn, idx) => (
              <View
                key={txn.id || txn._id || idx.toString()}
                style={styles.transactionItem}
              >
                <View style={styles.transactionIconContainer}>
                  <Icon
                    name={
                      txn.type === "credit"
                        ? "arrow-down-circle"
                        : "arrow-up-circle"
                    }
                    size={22}
                    color={
                      txn.type === "credit" ? colors.success : colors.error
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.transactionDesc}>
                    {txn.description || txn.type}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatDate(txn.createdAt)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    {
                      color:
                        txn.type === "credit"
                          ? colors.success
                          : colors.error,
                    },
                  ]}
                >
                  {txn.type === "credit" ? "+" : "-"}₹{Math.abs(txn.amount)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceCard: {
    backgroundColor: colors.primary,
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "900",
    color: colors.white,
  },
  section: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
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
  referralCodeCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
  },
  referralCodeText: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: 4,
    marginBottom: 12,
  },
  referralActions: {
    flexDirection: "row",
    gap: 16,
  },
  referralButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  referralButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  applyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  applyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  applyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  applyButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.white,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 6,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    paddingVertical: 16,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: 12,
  },
  transactionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  transactionDesc: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  transactionDate: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: "700",
  },
});

export default WalletScreen;
