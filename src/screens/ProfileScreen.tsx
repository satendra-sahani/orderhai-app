// File: src/screens/ProfileScreen.tsx
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
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { colors } from "../theme/colors";
import { Icon } from "../components/Icon";
import { useUser } from "../context/UserContext";
import { API_BASE } from "../api";

type Address = {
    id: string;
    label: string;
    line1: string;
    city: string;
    isDefault: boolean;
    latitude?: number;
    longitude?: number;
    _id?: string;
};

type MeResponse = {
    id: string;
    phone: string;
    name?: string;
    addresses: Address[];
    _id?: string;
};

export const ProfileScreen = ({ navigation }: any) => {
    const { user, setUser, logout } = useUser();

    const [me, setMe] = useState<MeResponse | null>(null);
    const [loadingMe, setLoadingMe] = useState(true);

    const [nameInput, setNameInput] = useState(user?.name || "");
    const [savingName, setSavingName] = useState(false);

    const [editing, setEditing] = useState<Address | null>(null);
    const [label, setLabel] = useState("Home");
    const [line1, setLine1] = useState("");
    const [city, setCity] = useState("");
    const [isDefault, setIsDefault] = useState(false);
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [savingAddress, setSavingAddress] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const resetAddressForm = () => {
        setEditing(null);
        setLabel("Home");
        setLine1("");
        setCity("");
        setIsDefault(false);
        setLatitude(null);
        setLongitude(null);
        setSavingAddress(false);
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
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                if (res.status === 401) {
                    await AsyncStorage.removeItem("token");
                    await AsyncStorage.removeItem("user");
                }
                return;
            }

            const data = (await res.json()) as MeResponse;
            setMe(data);
            setNameInput(data.name || "");
        } finally {
            setLoadingMe(false);
        }
    };

    useEffect(() => {
        loadMe();
    }, []);

    const saveName = async () => {
        const trimmed = nameInput.trim();
        if (!trimmed) return;

        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        setSavingName(true);
        try {
            const res = await fetch(`${API_BASE}/api/users/me`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name: trimmed }),
            });
            const data = await res.json();
            if (!res.ok) {
                Alert.alert("Error", data?.message || "Failed to update name");
                return;
            }
            setMe(prev => (prev ? { ...prev, name: trimmed } : prev));
            setUser(
                user ? { ...user, name: trimmed } : (user as any)
            );
            await AsyncStorage.setItem("user", JSON.stringify(data));
        } catch {
            Alert.alert(
                "Error",
                "Network error while updating name."
            );
        } finally {
            setSavingName(false);
        }
    };

    const startAddAddress = () => {
        resetAddressForm();
    };

    const startEditAddress = (addr: Address) => {
        setEditing(addr);
        setLabel(addr.label);
        setLine1(addr.line1);
        setCity(addr.city);
        setIsDefault(addr.isDefault);
        setLatitude(addr.latitude ?? null);
        setLongitude(addr.longitude ?? null);
    };

    const saveAddress = async () => {
        const trimmedLabel = label.trim();
        const trimmedLine1 = line1.trim();
        const trimmedCity = city.trim();

        if (!trimmedLabel || !trimmedLine1 || !trimmedCity) {
            Alert.alert(
                "Missing",
                "Fill label, line1 and city."
            );
            return;
        }

        const token = await AsyncStorage.getItem("token");
        if (!token) {
            Alert.alert(
                "Not logged in",
                "Please login again."
            );
            return;
        }

        setSavingAddress(true);

        const payload: any = {
            label: trimmedLabel,
            line1: trimmedLine1,
            city: trimmedCity,
            isDefault,
        };

        if (latitude != null && longitude != null) {
            payload.latitude = latitude;
            payload.longitude = longitude;
        }

        const isEdit = !!editing;
        const idForUrl = isEdit ? editing._id : undefined;

        if (isEdit && !idForUrl) {
            Alert.alert(
                "Error",
                "Address id missing, please reload and try again."
            );
            setSavingAddress(false);
            return;
        }

        const url = isEdit
            ? `${API_BASE}/api/users/addresses/${idForUrl}`
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

            await loadMe();
            resetAddressForm();

            // sync default address into UserContext.location
            if (isDefault && user) {
                setUser({
                    ...user,
                    location: {
                        address: trimmedLine1,
                    },
                });
            }
        } catch {
            Alert.alert(
                "Error",
                "Network error while saving address."
            );
        } finally {
            setSavingAddress(false);
        }
    };

    const deleteAddress = async (addr: Address) => {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        if (!addr._id) {
            Alert.alert("Error", "Address id missing, please reload and try again.");
            return;
        }

        Alert.alert("Delete address", `Delete "${addr.label}"?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    setDeletingId(addr._id ?? null);
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
                            "Error",
                            "Network error while deleting address."
                        );
                    } finally {
                        setDeletingId(null);
                    }
                },
            },
        ]);
    };


    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                style: "destructive",
                onPress: async () => {
                    await logout();
                    navigation.reset({
                        index: 0,
                        routes: [{ name: "Home" }],
                    });
                },
            },
        ]);
    };

    // ─── Loading state ───
    if (loadingMe) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
                <View style={styles.headerBranded}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-back" size={20} color={colors.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitleWhite}>My Profile</Text>
                    <View style={{ width: 36 }} />
                </View>
                <View style={styles.center}>
                    <ActivityIndicator color={colors.primary} size="large" />
                    <Text style={styles.loadingText}>Loading profile...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // ─── Not logged in ───
    if (!me) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
                <View style={styles.headerBranded}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-back" size={20} color={colors.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitleWhite}>My Profile</Text>
                    <View style={{ width: 36 }} />
                </View>
                <View style={styles.center}>
                    <Image
                        source={{ uri: "https://www.kmfnandini.coop/_next/static/media/logo.00aae0f8.png" }}
                        style={styles.emptyLogo}
                        resizeMode="contain"
                    />
                    <Text style={styles.emptyTitle}>Welcome to Nandini</Text>
                    <Text style={styles.emptyText}>Login to manage your profile and orders.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const initials = (me.name || me.phone || "U").charAt(0).toUpperCase();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

            {/* Branded header with profile avatar */}
            <View style={styles.profileHeader}>
                <View style={styles.profileHeaderTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-back" size={20} color={colors.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitleWhite}>My Profile</Text>
                    <View style={{ width: 36 }} />
                </View>

                {/* Avatar + Info */}
                <View style={styles.profileInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={styles.profileMeta}>
                        <Text style={styles.profileName}>{me.name || "Nandini Customer"}</Text>
                        <Text style={styles.profilePhone}>+91 {me.phone}</Text>
                    </View>
                </View>

                {/* Stats row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Icon name="location" size={16} color={colors.accent} />
                        <Text style={styles.statValue}>{me.addresses.length}</Text>
                        <Text style={styles.statLabel}>Addresses</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Icon name="shield-checkmark" size={16} color="#4CAF50" />
                        <Text style={styles.statValue}>Verified</Text>
                        <Text style={styles.statLabel}>Account</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Profile section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIconCircle}>
                            <Icon name="person" size={16} color={colors.primary} />
                        </View>
                        <Text style={styles.sectionTitle}>Personal Details</Text>
                    </View>

                    <Text style={styles.label}>Name</Text>
                    <View style={styles.rowBetween}>
                        <TextInput
                            style={[styles.input, { flex: 1, marginRight: 8 }]}
                            value={nameInput}
                            onChangeText={setNameInput}
                            placeholder="Your name"
                            placeholderTextColor="#bbb"
                        />
                        <TouchableOpacity
                            style={[
                                styles.saveButtonSmall,
                                savingName && styles.saveButtonDisabled,
                            ]}
                            onPress={saveName}
                            disabled={savingName}
                        >
                            {savingName ? (
                                <ActivityIndicator
                                    size="small"
                                    color={colors.white}
                                />
                            ) : (
                                <Text style={styles.saveButtonText}>
                                    Save
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={{ marginTop: 12 }}>
                        <Text style={styles.label}>Phone</Text>
                        <View style={styles.phoneDisplay}>
                            <Icon name="call" size={14} color={colors.primary} />
                            <Text style={styles.valueText}>+91 {me.phone}</Text>
                        </View>
                    </View>
                </View>

                {/* Addresses list */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIconCircle}>
                            <Icon name="location" size={16} color={colors.primary} />
                        </View>
                        <Text style={[styles.sectionTitle, { flex: 1 }]}>Saved Addresses</Text>
                        <TouchableOpacity onPress={startAddAddress} style={styles.addNewBtn}>
                            <Icon name="add" size={14} color={colors.primary} />
                            <Text style={styles.addNewText}>Add new</Text>
                        </TouchableOpacity>
                    </View>

                    {me.addresses.length === 0 ? (
                        <View style={styles.emptyAddresses}>
                            <Icon name="location-outline" size={32} color="#ddd" />
                            <Text style={styles.emptyAddressText}>
                                No addresses yet. Add one for faster checkout.
                            </Text>
                        </View>
                    ) : (
                        me.addresses.map(addr => (
                            <View
                                key={addr?._id}
                                style={styles.addressCard}
                            >
                                <View style={styles.addressIconWrap}>
                                    <Icon
                                        name={addr.label === "Home" ? "home" : addr.label === "Office" ? "business" : "location"}
                                        size={16}
                                        color={colors.primary}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={styles.addressLabelRow}>
                                        <Text style={styles.addressLabel}>
                                            {addr.label}
                                        </Text>
                                        {addr.isDefault && (
                                            <View style={styles.defaultBadge}>
                                                <Text style={styles.defaultBadgeText}>Default</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.addressLine}>
                                        {addr.line1}
                                        {addr.city ? `, ${addr.city}` : ""}
                                    </Text>
                                </View>
                                <View style={styles.addressActions}>
                                    <TouchableOpacity
                                        style={styles.iconButton}
                                        onPress={() => startEditAddress(addr)}
                                    >
                                        <Icon
                                            name="pencil"
                                            size={14}
                                            color={colors.primary}
                                        />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.iconButton, styles.deleteButton]}
                                        onPress={() => deleteAddress(addr)}
                                    >
                                        {deletingId === addr.id ? (
                                            <ActivityIndicator
                                                size="small"
                                                color="#ff4444"
                                            />
                                        ) : (
                                            <Icon
                                                name="trash"
                                                size={14}
                                                color="#ff4444"
                                            />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* Add/Edit address form */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIconCircle}>
                            <Icon name={editing ? "pencil" : "add-circle"} size={16} color={colors.primary} />
                        </View>
                        <Text style={styles.sectionTitle}>
                            {editing ? "Edit Address" : "New Address"}
                        </Text>
                    </View>

                    <Text style={styles.label}>Label</Text>
                    <View style={styles.labelChips}>
                        {["Home", "Office", "Other"].map(l => (
                            <TouchableOpacity
                                key={l}
                                style={[styles.labelChip, label === l && styles.labelChipActive]}
                                onPress={() => setLabel(l)}
                            >
                                <Text style={[styles.labelChipText, label === l && styles.labelChipTextActive]}>{l}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Address Line</Text>
                    <TextInput
                        style={styles.input}
                        value={line1}
                        onChangeText={setLine1}
                        placeholder="Flat / Building / Street"
                        placeholderTextColor="#bbb"
                    />

                    <Text style={styles.label}>City</Text>
                    <TextInput
                        style={styles.input}
                        value={city}
                        onChangeText={setCity}
                        placeholder="City"
                        placeholderTextColor="#bbb"
                    />

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
                            Set as default delivery address
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.formButtons}>
                        <TouchableOpacity
                            style={[
                                styles.saveButton,
                                savingAddress &&
                                styles.saveButtonDisabled,
                            ]}
                            onPress={saveAddress}
                            disabled={savingAddress}
                        >
                            {savingAddress ? (
                                <ActivityIndicator color={colors.white} />
                            ) : (
                                <Text style={styles.saveButtonText}>
                                    {editing ? "Update Address" : "Save Address"}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {editing && (
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={resetAddressForm}
                            >
                                <Text style={styles.cancelButtonText}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Quick Links */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIconCircle}>
                            <Icon name="grid" size={16} color={colors.primary} />
                        </View>
                        <Text style={styles.sectionTitle}>Quick Links</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate("Subscription")}
                    >
                        <View style={styles.menuIconContainer}>
                            <Icon name="repeat" size={18} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.menuItemText}>My Subscriptions</Text>
                            <Text style={styles.menuItemSub}>Daily milk & curd delivery</Text>
                        </View>
                        <Icon name="chevron-forward" size={18} color={colors.textLight} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate("Wallet")}
                    >
                        <View style={styles.menuIconContainer}>
                            <Icon name="wallet" size={18} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.menuItemText}>Wallet & Referrals</Text>
                            <Text style={styles.menuItemSub}>Earn rewards on every order</Text>
                        </View>
                        <Icon name="chevron-forward" size={18} color={colors.textLight} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate("AddressManager")}
                    >
                        <View style={styles.menuIconContainer}>
                            <Icon name="location" size={18} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.menuItemText}>Manage Addresses</Text>
                            <Text style={styles.menuItemSub}>Edit delivery locations</Text>
                        </View>
                        <Icon name="chevron-forward" size={18} color={colors.textLight} />
                    </TouchableOpacity>
                </View>

                {/* Nandini support info */}
                <View style={styles.supportSection}>
                    <Image
                        source={{ uri: "https://www.kmfnandini.coop/_next/static/media/logo.00aae0f8.png" }}
                        style={styles.supportLogo}
                        resizeMode="contain"
                    />
                    <Text style={styles.supportTitle}>Need Help?</Text>
                    <Text style={styles.supportText}>Toll Free: 1800 425 8030</Text>
                    <Text style={styles.supportHours}>Mon–Sat, 8 AM – 8 PM</Text>
                </View>

                {/* Logout button */}
                <View style={styles.logoutSection}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                    >
                        <Icon
                            name="log-out"
                            size={18}
                            color={colors.error || "#E53935"}
                        />
                        <Text style={styles.logoutButtonText}>
                            Logout
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f4f5f7",
    },
    // Branded header
    headerBranded: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: colors.primary,
        gap: 12,
    },
    headerTitleWhite: {
        flex: 1,
        fontSize: 17,
        fontWeight: "700",
        color: colors.white,
        textAlign: "center",
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.15)",
        alignItems: "center",
        justifyContent: "center",
    },
    // Profile header with avatar
    profileHeader: {
        backgroundColor: colors.primary,
        paddingBottom: 20,
    },
    profileHeaderTop: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    profileInfo: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        marginTop: 4,
        gap: 16,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.accent,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 3,
        borderColor: "rgba(255,255,255,0.3)",
    },
    avatarText: {
        fontSize: 26,
        fontWeight: "900",
        color: colors.white,
    },
    profileMeta: {
        flex: 1,
    },
    profileName: {
        fontSize: 18,
        fontWeight: "800",
        color: colors.white,
        marginBottom: 2,
    },
    profilePhone: {
        fontSize: 13,
        color: "rgba(255,255,255,0.7)",
        fontWeight: "500",
    },
    // Stats
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 16,
        marginHorizontal: 20,
        backgroundColor: "rgba(255,255,255,0.12)",
        borderRadius: 12,
        paddingVertical: 12,
    },
    statItem: {
        flex: 1,
        alignItems: "center",
        gap: 2,
    },
    statValue: {
        fontSize: 14,
        fontWeight: "800",
        color: colors.white,
    },
    statLabel: {
        fontSize: 10,
        color: "rgba(255,255,255,0.6)",
        fontWeight: "500",
    },
    statDivider: {
        width: 1,
        height: 28,
        backgroundColor: "rgba(255,255,255,0.2)",
    },
    // Scroll
    scroll: {
        flex: 1,
    },
    // Sections
    section: {
        backgroundColor: colors.white,
        marginTop: 10,
        marginHorizontal: 12,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14,
        gap: 10,
    },
    sectionIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primaryLight,
        alignItems: "center",
        justifyContent: "center",
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: colors.text,
    },
    label: {
        fontSize: 12,
        fontWeight: "600",
        color: colors.textSecondary,
        marginBottom: 4,
        marginTop: 8,
    },
    valueText: {
        fontSize: 14,
        color: colors.text,
        fontWeight: "600",
    },
    phoneDisplay: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#f8f9fa",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: "#e8eaed",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: colors.text,
        marginBottom: 6,
        backgroundColor: "#fafbfc",
    },
    rowBetween: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    saveButtonSmall: {
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    saveButton: {
        flex: 1,
        backgroundColor: colors.primary,
        paddingVertical: 13,
        borderRadius: 12,
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
    // Add new button
    addNewBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: colors.primaryLight,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    addNewText: {
        fontSize: 12,
        fontWeight: "700",
        color: colors.primary,
    },
    // Empty addresses
    emptyAddresses: {
        alignItems: "center",
        paddingVertical: 24,
        gap: 8,
    },
    emptyAddressText: {
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: "center",
    },
    // Address cards
    addressCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f2f3f5",
        gap: 10,
    },
    addressIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primaryLight,
        alignItems: "center",
        justifyContent: "center",
    },
    addressLabelRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 2,
    },
    addressLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: colors.text,
    },
    defaultBadge: {
        backgroundColor: "#E8F5E9",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    defaultBadgeText: {
        fontSize: 9,
        fontWeight: "700",
        color: "#4CAF50",
        letterSpacing: 0.3,
    },
    addressLine: {
        fontSize: 12,
        color: colors.textSecondary,
        lineHeight: 16,
    },
    addressActions: {
        flexDirection: "row",
        gap: 6,
    },
    iconButton: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: colors.primaryLight,
        alignItems: "center",
        justifyContent: "center",
    },
    deleteButton: {
        backgroundColor: "#FFF0F0",
    },
    // Label chips
    labelChips: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 8,
        marginTop: 4,
    },
    labelChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e0e0e0",
        backgroundColor: "#fafbfc",
    },
    labelChipActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
    },
    labelChipText: {
        fontSize: 12,
        fontWeight: "600",
        color: colors.textSecondary,
    },
    labelChipTextActive: {
        color: colors.primary,
        fontWeight: "700",
    },
    // Checkbox
    checkboxRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
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
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E0E0E0",
    },
    cancelButtonText: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: "600",
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    loadingText: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 4,
    },
    emptyLogo: {
        width: 80,
        height: 80,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.text,
    },
    emptyText: {
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: "center",
        paddingHorizontal: 40,
    },
    // Menu items
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f2f3f5",
        gap: 12,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.primaryLight,
        alignItems: "center",
        justifyContent: "center",
    },
    menuItemText: {
        fontSize: 14,
        fontWeight: "700",
        color: colors.text,
    },
    menuItemSub: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 1,
    },
    // Support section
    supportSection: {
        alignItems: "center",
        marginTop: 10,
        marginHorizontal: 12,
        borderRadius: 16,
        backgroundColor: colors.primaryLight,
        paddingVertical: 20,
        gap: 4,
    },
    supportLogo: {
        width: 48,
        height: 48,
        marginBottom: 6,
    },
    supportTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: colors.primary,
    },
    supportText: {
        fontSize: 13,
        fontWeight: "600",
        color: colors.text,
    },
    supportHours: {
        fontSize: 11,
        color: colors.textSecondary,
    },
    // Logout
    logoutSection: {
        marginTop: 10,
        marginHorizontal: 12,
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        paddingVertical: 13,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: "#ffcdd2",
        gap: 8,
    },
    logoutButtonText: {
        fontSize: 14,
        fontWeight: "700",
        color: colors.error || "#E53935",
    },
});

export default ProfileScreen;
