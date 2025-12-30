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
    Platform,
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
                    await logout();      // clears token + user + favourites
                    navigation.reset({
                        index: 0,
                        routes: [{ name: "Home" }],
                    });
                },
            },
        ]);
    };

    if (loadingMe) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar
                    barStyle="dark-content"
                    backgroundColor={colors.white}
                />
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                    >
                        <Icon
                            name="arrow-back"
                            size={22}
                            color={colors.text}
                        />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        My Profile
                    </Text>
                    <View style={{ width: 22 }} />
                </View>
                <View style={styles.center}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!me) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar
                    barStyle="dark-content"
                    backgroundColor={colors.white}
                />
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                    >
                        <Icon
                            name="arrow-back"
                            size={22}
                            color={colors.text}
                        />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        My Profile
                    </Text>
                    <View style={{ width: 22 }} />
                </View>
                <View style={styles.center}>
                    <Text style={styles.emptyText}>
                        Login to manage profile.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor={colors.white}
            />
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                >
                    <Icon
                        name="arrow-back"
                        size={22}
                        color={colors.text}
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Profile</Text>
                <View style={{ width: 22 }} />
            </View>

            <ScrollView style={styles.scroll}>
                {/* Profile section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Profile</Text>

                    <Text style={styles.label}>Name</Text>
                    <View style={styles.rowBetween}>
                        <TextInput
                            style={[styles.input, { flex: 1, marginRight: 8 }]}
                            value={nameInput}
                            onChangeText={setNameInput}
                            placeholder="Your name"
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

                    <TouchableOpacity
                        onPress={() =>
                            navigation.navigate("AddressManager")
                        }
                    >
                        <Text
                            style={[
                                styles.linkText,
                                { marginTop: 8, alignSelf: "flex-start" },
                            ]}
                        >
                            Manage addresses
                        </Text>
                    </TouchableOpacity>

                    <View style={{ marginTop: 16 }}>
                        <Text style={styles.label}>Phone</Text>
                        <Text style={styles.valueText}>
                            +91 {me.phone}
                        </Text>
                    </View>
                </View>

                {/* Addresses list */}
                <View style={styles.section}>
                    <View style={styles.rowBetween}>
                        <Text style={styles.sectionTitle}>
                            Addresses
                        </Text>
                        <TouchableOpacity
                            onPress={startAddAddress}
                        >
                            <Text style={styles.linkText}>
                                Add new
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {me.addresses.length === 0 ? (
                        <Text style={styles.emptyText}>
                            No addresses yet. Add one to get faster
                            checkout.
                        </Text>
                    ) : (
                        me.addresses.map(addr => (
                            <View
                                key={addr?._id}
                                style={styles.addressCard}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.addressLabel}>
                                        {addr.label}{" "}
                                        {addr.isDefault ? "(Default)" : ""}
                                    </Text>
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
                                            size={16}
                                            color={colors.text}
                                        />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.iconButton}
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
                                                size={16}
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
                    <Text style={styles.sectionTitle}>
                        {editing ? "Edit address" : "Add new address"}
                    </Text>

                    <Text style={styles.label}>Label</Text>
                    <TextInput
                        style={styles.input}
                        value={label}
                        onChangeText={setLabel}
                        placeholder="Home, Office"
                    />

                    <Text style={styles.label}>Line 1</Text>
                    <TextInput
                        style={styles.input}
                        value={line1}
                        onChangeText={setLine1}
                        placeholder="Flat / Building / Street"
                    />

                    <Text style={styles.label}>City</Text>
                    <TextInput
                        style={styles.input}
                        value={city}
                        onChangeText={setCity}
                        placeholder="City"
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
                            Set as default
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
                                    {editing ? "Update" : "Add address"}
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

                {/* Logout button */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                    >
                        <Icon
                            name="log-out"
                            size={18}
                            color={colors.white}
                        />
                        <Text style={styles.logoutButtonText}>
                            Logout
                        </Text>
                    </TouchableOpacity>
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
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: colors.text,
    },
    scroll: {
        flex: 1,
    },
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
    label: {
        fontSize: 13,
        fontWeight: "600",
        color: colors.textSecondary,
        marginBottom: 4,
    },
    valueText: {
        fontSize: 14,
        color: colors.text,
    },
    input: {
        borderWidth: 1,
        borderColor: "#E0E0E0",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        color: colors.text,
        marginBottom: 8,
    },
    rowBetween: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    saveButtonSmall: {
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
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
    linkText: {
        fontSize: 13,
        fontWeight: "600",
        color: colors.primary,
    },
    addressCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#EEE",
    },
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
    addressActions: {
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
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyText: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        paddingVertical: 12,
        backgroundColor: colors.error || "#E53935",
        gap: 8,
    },
    logoutButtonText: {
        fontSize: 14,
        fontWeight: "700",
        color: colors.white,
    },
});

export default ProfileScreen;
