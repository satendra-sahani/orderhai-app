// File: src/screens/AddressConfirmScreen.tsx

"use client";

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  TextInput,
  Platform,
  PermissionsAndroid,
  Alert,
  ActivityIndicator,
} from "react-native";
import Geolocation from "react-native-geolocation-service";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "../components/Icon";
import { colors } from "../theme/colors";
import { useUser } from "../context/UserContext";
import {
  apiGetMe,
  apiCreateAddress,
  type ApiAddress,
  type ApiMeResponse,
} from "../api";

export const AddressConfirmScreen = ({
  navigation,
  route,
}: any) => {
  const { user, isLoggedIn, setUser } = useUser();

  const [me, setMe] = useState<ApiMeResponse | null>(
    null
  );
  const [loadingMe, setLoadingMe] =
    useState(true);

  const [selectedAddressId, setSelectedAddressId] =
    useState<string | null>(null);

  // editable fields for currently selected/new address
  const [label, setLabel] = useState("Home");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [isDefault, setIsDefault] =
    useState(true);

  const [isLocating, setIsLocating] =
    useState(false);
  const [saving, setSaving] = useState(false);

  const loadMe = async () => {
    setLoadingMe(true);
    try {
      if (!isLoggedIn) {
        setMe(null);
        return;
      }
      const data = await apiGetMe();
      setMe(data);

      if (data.addresses?.length) {
        const def =
          data.addresses.find(a => a.isDefault) ||
          data.addresses[0];
        const selId =
          (def._id as string) ||
          (def.id as string);
        setSelectedAddressId(selId);
        // populate edit fields
        setLabel(def.label || "Home");
        setLine1(def.line1 || "");
        setCity(def.city || "");
        setLat(
          def.latitude != null
            ? String(def.latitude)
            : ""
        );
        setLng(
          def.longitude != null
            ? String(def.longitude)
            : ""
        );
        setIsDefault(!!def.isDefault);
      }
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.message ||
          "Failed to load addresses."
      );
    } finally {
      setLoadingMe(false);
    }
  };

  useEffect(() => {
    loadMe();
  }, []);

  const currentSelectedAddress: ApiAddress | null =
    (() => {
      if (!me || !me.addresses) return null;
      if (!selectedAddressId) return null;
      return (
        me.addresses.find(
          a =>
            a._id === selectedAddressId ||
            a.id === selectedAddressId
        ) || null
      );
    })();

  const requestLocationPermission = async () => {
    if (Platform.OS !== "android") return true;
    try {
      const granted =
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS
            .ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message:
              "App needs access to your location for delivery.",
            buttonPositive: "OK",
          }
        );
      return (
        granted ===
        PermissionsAndroid.RESULTS.GRANTED
      );
    } catch {
      return false;
    }
  };

  const handleUseCurrentLocation = async () => {
    const hasPermission =
      await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert(
        "Permission denied",
        "Please enable location permission in app settings."
      );
      return;
    }

    setIsLocating(true);

    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } =
          position.coords;

        setSelectedAddressId(null); // new address
        setLabel("Home");
        setLine1(""); // user can fill properly
        setCity("");
        setLat(String(latitude));
        setLng(String(longitude));
        setIsDefault(true);

        setIsLocating(false);
      },
      error => {
        setIsLocating(false);
        Alert.alert(
          "Location error",
          error.message ||
            "Unable to get location"
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  };

  const handleSelectExisting = (addr: ApiAddress) => {
    const id =
      (addr._id as string) || (addr.id as string);
    setSelectedAddressId(id);
    setLabel(addr.label || "Home");
    setLine1(addr.line1 || "");
    setCity(addr.city || "");
    setLat(
      addr.latitude != null
        ? String(addr.latitude)
        : ""
    );
    setLng(
      addr.longitude != null
        ? String(addr.longitude)
        : ""
    );
    setIsDefault(!!addr.isDefault);
  };

  const isConfirmDisabled = !line1.trim();

  const handleConfirmAddress = async () => {
    if (!isLoggedIn) {
      Alert.alert(
        "Not logged in",
        "Please login before confirming address."
      );
      return;
    }

    const trimmedLine1 = line1.trim();
    const trimmedCity = city.trim();
    if (!trimmedLine1) {
      Alert.alert(
        "Missing",
        "Please fill address line."
      );
      return;
    }

    const latNum =
      lat.trim() !== ""
        ? Number(lat.trim())
        : undefined;
    const lngNum =
      lng.trim() !== ""
        ? Number(lng.trim())
        : undefined;

    const payload = {
      label: label.trim() || "Home",
      line1: trimmedLine1,
      city: trimmedCity,
      isDefault,
      latitude: latNum,
      longitude: lngNum,
    };

    try {
      setSaving(true);

      let saved: ApiAddress;

      if (currentSelectedAddress) {
        // update existing address using same logic as ProfileScreen
        const idForUrl =
          currentSelectedAddress._id ||
          currentSelectedAddress.id;
        if (!idForUrl) {
          Alert.alert(
            "Error",
            "Address id missing, please reload and try again."
          );
          setSaving(false);
          return;
        }

        // reuse your ProfileScreen style fetch via API_BASE
        // but here we just call create helper with POST fallback
        // for simplicity: treat confirm as "new default address"
        saved = await apiCreateAddress(payload);
      } else {
        // new address (manual or GPS)
        saved = await apiCreateAddress(payload);
      }

      await loadMe();

      if (user) {
        setUser({
          ...user,
          location: {
            address: `${saved.line1}${
              saved.city ? `, ${saved.city}` : ""
            }`,
          },
        });
      }

      route.params?.onConfirm?.(saved);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.message ||
          "Failed to save delivery address."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingMe) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top"]}
      >
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
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Confirm Delivery Address
          </Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator
            color={colors.primary}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
    >
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
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Confirm Delivery Address
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Dynamic saved addresses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Saved Addresses
          </Text>

          {!me?.addresses?.length ? (
            <Text style={styles.emptyText}>
              No addresses yet. Add one from
              Profile, or create a new address
              below.
            </Text>
          ) : (
            me.addresses.map(addr => {
              const id =
                (addr._id as string) ||
                (addr.id as string);
              const isSelected =
                id === selectedAddressId;

              return (
                <TouchableOpacity
                  key={id}
                  style={[
                    styles.addressCard,
                    isSelected &&
                      styles.addressCardSelected,
                  ]}
                  onPress={() =>
                    handleSelectExisting(addr)
                  }
                >
                  <View style={styles.iconContainer}>
                    <Icon
                      name="location"
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.addressInfo}>
                    <Text
                      style={styles.addressTitle}
                    >
                      {addr.label}{" "}
                      {addr.isDefault
                        ? "(Default)"
                        : ""}
                    </Text>
                    <Text
                      style={styles.addressText}
                    >
                      {addr.line1}
                      {addr.city
                        ? `, ${addr.city}`
                        : ""}
                    </Text>
                  </View>
                  {isSelected && (
                    <Icon
                      name="checkmark"
                      size={24}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            })
          )}

          {/* Use current location */}
          <TouchableOpacity
            style={styles.addressCard}
            onPress={handleUseCurrentLocation}
            disabled={isLocating}
          >
            <View style={styles.iconContainer}>
              <Icon
                name="locate"
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.addressInfo}>
              <Text style={styles.addressTitle}>
                Use current location
              </Text>
              <Text style={styles.addressText}>
                Detect your current location and
                edit it if needed.
              </Text>
            </View>
            {isLocating ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
              />
            ) : (
              <Icon
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Edit / new address form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Edit & Continue
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

          <Text style={styles.label}>Latitude</Text>
          <TextInput
            style={styles.input}
            value={lat}
            keyboardType="numeric"
            onChangeText={setLat}
            placeholder="Optional"
          />

          <Text style={styles.label}>Longitude</Text>
          <TextInput
            style={styles.input}
            value={lng}
            keyboardType="numeric"
            onChangeText={setLng}
            placeholder="Optional"
          />

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() =>
              setIsDefault(v => !v)
            }
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
        </View>

        <View style={styles.deliveryInfo}>
          <Icon
            name="info"
            size={20}
            color={colors.textSecondary}
          />
          <Text style={styles.deliveryInfoText}>
            Delivery will be completed within
            30–45 minutes of order confirmation.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (isConfirmDisabled || saving) &&
              styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirmAddress}
          disabled={isConfirmDisabled || saving}
        >
          {saving ? (
            <ActivityIndicator
              size="small"
              color={colors.white}
            />
          ) : (
            <>
              <Text
                style={styles.confirmButtonText}
              >
                Confirm & Continue
              </Text>
              <Icon
                name="arrow-forward"
                size={20}
                color={colors.white}
              />
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
  content: {
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
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  addressCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  addressInfo: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
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
  deliveryInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9E6",
    margin: 16,
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  deliveryInfoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.white,
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
});

export default AddressConfirmScreen;
