// File: src/screens/AddressManagerScreen.tsx

"use client";

import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    ScrollView,
    Alert,
    ActivityIndicator,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Icon } from "../components/Icon";
import { colors } from "../theme/colors";
import { API_BASE } from "../api";

type Address = {
    _id: string;
    label: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
    isDefault: boolean;
};

type MeResponse = {
    id: string;
    phone: string;
    name?: string;
    lastLoginAt?: string;
    addresses: Address[];
};

export const AddressManagerScreen = ({ navigation }: any) => {
    const [me, setMe] = useState<MeResponse | null>(null);
    const [loadingMe, setLoadingMe] = useState(true);

    // form state
    const [editing, setEditing] = useState<Address | null>(null);
    const [label, setLabel] = useState("");
    const [line1, setLine1] = useState("");
    const [city, setCity] = useState("");
    const [isDefault, setIsDefault] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const resetForm = () => {
        setEditing(null);
        setLabel("");
        setLine1("");
        setCity("");
        setIsDefault(false);
        setSaving(false);
    };

    const loadMe = async () => {
        setLoadingMe(true);
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                setMe(null);
                return;
            }
            const res = await fetch(`${API_BASE}/api/users/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                if (res.status === 401) {
                    await AsyncStorage.removeItem("token");
                    await AsyncStorage.removeItem("user");
                }
                return;
            }
            const data: MeResponse = await res.json();
            setMe({
                ...data,
                addresses: (data.addresses || []).map(a => ({
                    ...a,              // includes _id
                })),
            });
        } finally {
            setLoadingMe(false);
        }
    };

    useEffect(() => {
        loadMe();
    }, []);

    const startAdd = () => {
        resetForm();
    };

    const startEdit = (addr: Address) => {
        setEditing(addr);
        setLabel(addr.label);
        setLine1(addr.line1);
        setCity(addr.city);
        setIsDefault(addr.isDefault);
    };

    const saveAddress = async () => {
        const trimmedLabel = label.trim();
        const trimmedLine1 = line1.trim();
        const trimmedCity = city.trim();

        if (!trimmedLabel || !trimmedLine1 || !trimmedCity) {
            Alert.alert("Missing fields", "Fill label, address and city.");
            return;
        }

        const token = await AsyncStorage.getItem("token");
        if (!token) {
            Alert.alert("Not logged in", "Please login again.");
            return;
        }

        setSaving(true);

        const payload: any = {
            label: trimmedLabel,
            line1: trimmedLine1,
            city: trimmedCity,
            isDefault,
        };

        const isEdit = !!editing;
        const url = isEdit
            ? `${API_BASE}/api/users/addresses/${editing!._id}`
            : `${API_BASE}/api/users/addresses`;
        const method = isEdit ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) {
                Alert.alert(
                    "Error",
                    data?.message || "Failed to save address."
                );
                return;
            }

            // reload /me to refresh addresses
            await loadMe();
            resetForm();
        } catch {
            Alert.alert("Network error", "Unable to save address.");
        } finally {
            setSaving(false);
        }
    };

    const deleteAddress = async (addr: Address) => {
  const token = await AsyncStorage.getItem("token");
  if (!token) {
    Alert.alert("Not logged in", "Please login again.");
    return;
  }

  if (!addr._id) {
    Alert.alert("Error", "Address id missing, please reload and try again.");
    return;
  }

  Alert.alert(
    "Delete address",
    `Remove "${addr.label}" address?`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeletingId(addr._id);
          try {
            const res = await fetch(
              `${API_BASE}/api/users/addresses/${addr._id}`,
              {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (!res.ok) {
              const data = await res.json();
              Alert.alert(
                "Error",
                data?.message || "Failed to delete address."
              );
              setDeletingId(null);
              return;
            }

            await loadMe();
          } catch {
            Alert.alert(
              "Network error",
              "Unable to delete address."
            );
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]
  );
};


    const defaultAddress =
        me?.addresses.find(a => a.isDefault) || me?.addresses[0];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="chevron-left" size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Addresses</Text>
            </View>

            {loadingMe ? (
                <View style={styles.center}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            ) : !me ? (
                <View style={styles.center}>
                    <Text style={styles.emptyText}>
                        Login required to manage addresses.
                    </Text>
                </View>
            ) : (
                <>
                    <ScrollView style={styles.scroll}>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Saved Addresses</Text>
                            {me.addresses.length === 0 && (
                                <Text style={styles.emptyText}>
                                    No addresses yet. Add one to get faster checkout.
                                </Text>
                            )}
                            {me.addresses.map(addr => (
                                <View key={addr._id} style={styles.addressCard}>
                                    <View style={styles.addressInfo}>
                                        <Text style={styles.addressLabel}>
                                            {addr.label}{" "}
                                            {addr.isDefault ? "(Default)" : ""}
                                        </Text>
                                        <Text style={styles.addressLine}>
                                            {addr.line1}
                                            {addr.city ? `, ${addr.city}` : ""}
                                        </Text>
                                    </View>
                                    <View style={styles.actions}>
                                        <TouchableOpacity
                                            onPress={() => startEdit(addr)}
                                            style={styles.iconButton}
                                        >
                                            <Icon
                                                name="pencil"
                                                size={16}
                                                color={colors.text}
                                            />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => deleteAddress(addr)}
                                            style={styles.iconButton}
                                        >
                                            {deletingId === addr._id ? (
                                                <ActivityIndicator
                                                    size="small"
                                                    color={colors.danger || "#ff4444"}
                                                />
                                            ) : (
                                                <Icon
                                                    name="trash"
                                                    size={16}
                                                    color={colors.danger || "#ff4444"}
                                                />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                {editing ? "Edit Address" : "Add New Address"}
                            </Text>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Label</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Home, Work..."
                                    value={label}
                                    onChangeText={setLabel}
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Address</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Flat / Building / Street"
                                    value={line1}
                                    onChangeText={setLine1}
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>City</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="City"
                                    value={city}
                                    onChangeText={setCity}
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.checkboxRow}
                                onPress={() => setIsDefault(v => !v)}
                            >
                                <View
                                    style={[
                                        styles.checkbox,
                                        isDefault && styles.checkboxChecked,
                                    ]}
                                >
                                    {isDefault && (
                                        <Icon
                                            name="checkmark"
                                            size={14}
                                            color={colors.white}
                                        />
                                    )}
                                </View>
                                <Text style={styles.checkboxText}>
                                    Set as default address
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.formButtons}>
                                <TouchableOpacity
                                    style={[
                                        styles.saveButton,
                                        saving && styles.saveButtonDisabled,
                                    ]}
                                    onPress={saveAddress}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <ActivityIndicator color={colors.white} />
                                    ) : (
                                        <Text style={styles.saveButtonText}>
                                            {editing ? "Update" : "Add"} Address
                                        </Text>
                                    )}
                                </TouchableOpacity>

                                {editing && (
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={resetForm}
                                    >
                                        <Text style={styles.cancelButtonText}>
                                            Cancel
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </ScrollView>

                    {defaultAddress && (
                        <View style={styles.footer}>
                            <Text style={styles.footerTitle}>Using for delivery</Text>
                            <Text style={styles.footerText}>
                                {defaultAddress.label} • {defaultAddress.line1}
                                {defaultAddress.city ? `, ${defaultAddress.city}` : ""}
                            </Text>
                        </View>
                    )}
                </>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8F8F8" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: colors.white,
        gap: 16,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: colors.text,
    },
    scroll: { flex: 1 },
    section: {
        backgroundColor: colors.white,
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.text,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    addressCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#EEE",
    },
    addressInfo: { flex: 1 },
    addressLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: colors.text,
        marginBottom: 2,
    },
    addressLine: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    actions: {
        flexDirection: "row",
        gap: 8,
        marginLeft: 8,
    },
    iconButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#F2F2F2",
        alignItems: "center",
        justifyContent: "center",
    },
    inputGroup: {
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
        paddingVertical: 8,
        fontSize: 14,
        color: colors.text,
        backgroundColor: colors.white,
    },
    checkboxRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 6,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: "#CCC",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
    },
    checkboxChecked: {
        borderColor: colors.primary,
        backgroundColor: colors.primary,
    },
    checkboxText: {
        fontSize: 13,
        color: colors.text,
    },
    formButtons: {
        marginTop: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    saveButton: {
        flex: 1,
        backgroundColor: colors.primary,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: "700",
    },
    cancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E0E0E0",
    },
    cancelButtonText: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: "600",
    },
    footer: {
        backgroundColor: colors.white,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: "#E0E0E0",
    },
    footerTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: colors.textSecondary,
        marginBottom: 2,
    },
    footerText: {
        fontSize: 14,
        color: colors.text,
    },
});

export default AddressManagerScreen;
