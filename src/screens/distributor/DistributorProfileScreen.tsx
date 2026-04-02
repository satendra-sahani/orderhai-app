// src/screens/distributor/DistributorProfileScreen.tsx

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../../components/Icon";
import { colors } from "../../theme/colors";
import {
  apiGetDistributorProfile,
  apiUpdateDistributorProfile,
} from "../../api";
import { useUser } from "../../context/UserContext";

interface DistributorProfile {
  businessName?: string;
  gstNumber?: string;
  territory?: string;
  creditLimit?: number;
  paymentTerms?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export const DistributorProfileScreen = ({ navigation }: any) => {
  const { logout } = useUser();
  const [profile, setProfile] = useState<DistributorProfile>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editGst, setEditGst] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      const data = await apiGetDistributorProfile();
      const dp = data?.distributorProfile || {};
      const flat: DistributorProfile = {
        businessName: dp.businessName || "",
        gstNumber: dp.gstin || "",
        territory: dp.territory || "",
        creditLimit: dp.creditLimit || 0,
        paymentTerms: dp.paymentTerms || "COD",
        phone: data?.phone || "",
        email: data?.email || "",
      };
      setProfile(flat);
      setEditName(flat.businessName || "");
      setEditGst(flat.gstNumber || "");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await apiUpdateDistributorProfile({
        businessName: editName,
        gstin: editGst,
      });
      const dp = updated?.distributorProfile || {};
      setProfile((prev) => ({
        ...prev,
        businessName: dp.businessName ?? editName,
        gstNumber: dp.gstin ?? editGst,
      }));
      setEditing(false);
      Alert.alert("Success", "Profile updated successfully.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          if (logout) {
            logout();
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F8F8" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Business Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Icon */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Icon name="business-outline" size={40} color={colors.primary} />
          </View>
          <Text style={styles.businessTitle}>
            {profile.businessName || "Business Name"}
          </Text>
          {profile.territory && (
            <Text style={styles.territoryText}>{profile.territory}</Text>
          )}
        </View>

        {/* Business Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Information</Text>

          {editing ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Business Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter business name"
                  placeholderTextColor={colors.textLight}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>GSTIN</Text>
                <TextInput
                  style={styles.textInput}
                  value={editGst}
                  onChangeText={setEditGst}
                  placeholder="Enter GSTIN"
                  placeholderTextColor={colors.textLight}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.cancelEditButton}
                  onPress={() => {
                    setEditing(false);
                    setEditName(profile.businessName || "");
                    setEditGst(profile.gstNumber || "");
                  }}
                >
                  <Text style={styles.cancelEditText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Icon name="business-outline" size={20} color={colors.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Business Name</Text>
                  <Text style={styles.infoValue}>
                    {profile.businessName || "Not set"}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Icon name="document-outline" size={20} color={colors.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>GSTIN</Text>
                  <Text style={styles.infoValue}>
                    {profile.gstNumber || "Not set"}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Icon name="location-outline" size={20} color={colors.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Territory</Text>
                  <Text style={styles.infoValue}>
                    {profile.territory || "Not assigned"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditing(true)}
              >
                <Icon name="create-outline" size={18} color={colors.primary} />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Credit & Payment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Credit & Payment</Text>
          <View style={styles.infoRow}>
            <Icon name="card-outline" size={20} color={colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Credit Limit</Text>
              <Text style={styles.infoValue}>
                Rs.{" "}
                {profile.creditLimit
                  ? profile.creditLimit.toLocaleString("en-IN")
                  : "Not set"}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Icon name="time-outline" size={20} color={colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Payment Terms</Text>
              <Text style={styles.infoValue}>
                {profile.paymentTerms || "Not set"}
              </Text>
            </View>
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoRow}>
            <Icon name="call-outline" size={20} color={colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>
                {profile.phone || "Not set"}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Icon name="mail-outline" size={20} color={colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>
                {profile.email || "Not set"}
              </Text>
            </View>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Icon name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  businessTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  territoryText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 6,
    marginTop: 4,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  editActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  cancelEditButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  cancelEditText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.white,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
    gap: 8,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.error,
  },
});
