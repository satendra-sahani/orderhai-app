// File: src/screens/LoginScreen.tsx
"use client";

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  PermissionsAndroid,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Geolocation from "react-native-geolocation-service";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Icon } from "../components/Icon";
import { colors } from "../theme/colors";
import { useUser } from "../context/UserContext";
import {
  apiSendLoginOtp,
  apiVerifyLoginOtp,
  apiUpdateMe,
  apiAddAddress,
  apiGetMe,
} from "../api";

type LoginStep = "phone" | "otp" | "details" | "location";

export const LoginScreen = ({ navigation }: any) => {
  const { setUser } = useUser();

  const [step, setStep] = useState<LoginStep>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // address extra fields to match web API
  const [addressLabel, setAddressLabel] = useState("Office");
  const [addressCity, setAddressCity] = useState("Kushinagar");
  const [isDefaultAddress, setIsDefaultAddress] = useState(true);
  const [latitude, setLatitude] =
    useState<number | null>(26.721139);
  const [longitude, setLongitude] =
    useState<number | null>(83.8134792);
  const [gpsSet, setGpsSet] = useState(true);

  const suggestedLocations = [
    "Sector 18, Noida",
    "Connaught Place, Delhi",
    "MG Road, Bangalore",
    "Park Street, Kolkata",
    "Marine Drive, Mumbai",
  ];

  const getToken = () => AsyncStorage.getItem("token");

  // ---------- Auth APIs (using api.ts) ----------

  const sendOtp = async () => {
    const phone = phoneNumber.trim();
    if (!/^\d{10}$/.test(phone)) {
      setAuthError("Enter valid 10-digit phone number");
      return;
    }

    setAuthError(null);
    setIsLoading(true);
    try {
      await apiSendLoginOtp(phone);
      setStep("otp");
    } catch (e: any) {
      setAuthError(
        e.message || "Network error. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

 const verifyOtp = async () => {
  const phone = phoneNumber.trim();
  if (!/^\d{10}$/.test(phone)) {
    setAuthError("Enter valid 10-digit phone number");
    return;
  }
  if (!otp || otp.length !== 6) {
    setAuthError("Enter valid 6-digit OTP");
    return;
  }

  setAuthError(null);
  setIsLoading(true);
  try {
    // call shared api
    const data = await apiVerifyLoginOtp(phone, otp.trim());
    // data: { token, user }
    await AsyncStorage.setItem("token", data.token);
    await AsyncStorage.setItem("user", JSON.stringify(data.user));

    // decide: existing vs new user
    const u = data.user;
    const hasName = !!u.name && u.name.trim().length > 0;

    // we do NOT have addresses in this response, so fetch /me to see addresses
    let me: any = null;
    try {
      me = await apiGetMe();
    } catch {
      me = null;
    }

    const hasDefaultAddress =
      !!me &&
      Array.isArray(me.addresses) &&
      me.addresses.some((a: any) => a.isDefault);

    if (hasName && hasDefaultAddress) {
      // existing user with profile ready → go home directly
      const defaultAddr =
        me.addresses.find((a: any) => a.isDefault) ||
        me.addresses[0];

      const appUser = {
        id: u.id,
        name: u.name ?? "",
        phoneNumber: u.phone || `+91${phone}`,
        location: {
          address: defaultAddr?.line1 || "",
          city: defaultAddr?.city || "",
        },
      };

      setUser(appUser);
      navigation.replace("Home");
    } else if (!hasName) {
      // user has no name → go to name step
      setStep("details");
    } else {
      // user has name but no default address → go to location step
      setStep("location");
    }
  } catch (e: any) {
    setAuthError(e.message || "Network error. Please try again.");
  } finally {
    setIsLoading(false);
  }
};

  const updateNameOnServer = async (value: string) => {
    const token = await getToken();
    if (!token) return;
    try {
      const updated = await apiUpdateMe({ name: value });
      await AsyncStorage.setItem(
        "user",
        JSON.stringify(updated)
      );
    } catch {
      // ignore
    }
  };

  const saveAddressOnServer = async (fullAddress: string) => {
    const token = await getToken();
    if (!token) return null;

    const payload: any = {
      label: addressLabel || "Office",
      line1: fullAddress || "Hata",
      city: addressCity || "Kushinagar",
      isDefault: isDefaultAddress,
    };

    if (latitude != null && longitude != null) {
      payload.latitude = latitude;
      payload.longitude = longitude;
    }

    try {
      const data = await apiAddAddress(payload);
      return data;
    } catch {
      return null;
    }
  };

  // ---------- Step handlers ----------

  const handleContinuePhone = () => {
    if (isLoading) return;
    sendOtp();
  };

  const handleVerifyOtp = () => {
    if (isLoading) return;
    verifyOtp();
  };

  const handleSaveName = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setIsLoading(true);
    await updateNameOnServer(trimmed);
    setIsLoading(false);
    setStep("location");
  };

  const handleCompleteLogin = async () => {
    const finalLocation = (
      selectedLocation ||
      manualAddress ||
      "Hata"
    ).trim();
    if (!finalLocation) return;

    setIsLoading(true);
    await saveAddressOnServer(finalLocation);

    // fetch latest user (with name/address) from server
    let apiUser: any = null;
    try {
      apiUser = await apiGetMe();
    } catch {
      // fallback to local
      const local = await AsyncStorage.getItem("user");
      apiUser = local ? JSON.parse(local) : null;
    }
    setIsLoading(false);

    const newUser = {
      id: apiUser?.id || Date.now().toString(),
      name: apiUser?.name || name.trim(),
      phoneNumber:
        apiUser?.phone || `+91${phoneNumber}`,
      location: {
        address:
          apiUser?.addresses?.find(
            (a: any) => a.isDefault
          )?.line1 || finalLocation,
      },
    };
    setUser(newUser);
    navigation.replace("Home");
  };

  // ---------- Location ----------

  const requestLocationPermission = async () => {
    if (Platform.OS !== "android") return true;
    try {
      const granted =
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
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
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert(
        "Permission denied",
        "Please enable location permission in app settings to use current location."
      );
      return;
    }

    setIsLocating(true);

    Geolocation.getCurrentPosition(
      async position => {
        const { latitude: lat, longitude: lng } =
          position.coords;
        setLatitude(lat);
        setLongitude(lng);
        setGpsSet(true);

        let formattedAddress: string | null = null;

        try {
          const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
          const res = await fetch(url, {
            headers: {
              "User-Agent":
                "yourapp/1.0 (contact@example.com)",
            },
          });
          const data = await res.json();
          if (data?.display_name) {
            formattedAddress = data.display_name;
          }
        } catch {
          // ignore
        }

        if (formattedAddress) {
          setManualAddress(formattedAddress);
        }
        setSelectedLocation("");
        setIsLocating(false);
      },
      error => {
        setIsLocating(false);
        Alert.alert(
          "Location error",
          error.message || "Unable to get location."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  };

  // ---------- UI ----------

  const renderPhoneStep = () => (
    <>
      <View style={styles.brandSection}>
        <Text style={styles.brandName}>one</Text>
        <Text style={styles.brandTagline}>Mobile App</Text>
        <Text style={styles.brandDescription}>
          Unlimited Convenience
        </Text>
        <Text style={styles.brandSubtext}>
          Zeato, your all-in-one solution for seamless
          dining{"\n"}and grocery experiences.
        </Text>
      </View>

      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>
          Welcome! Ready to Order?
        </Text>
        <Text style={styles.welcomeSubtitle}>
          Log in or Sign up
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.countryCode}>+91</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter mobile number"
            placeholderTextColor={colors.textLight}
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            maxLength={10}
          />
        </View>

        {authError && (
          <Text style={styles.errorText}>{authError}</Text>
        )}

        <TouchableOpacity
          style={[
            styles.continueButton,
            (phoneNumber.length !== 10 || isLoading) &&
              styles.continueButtonDisabled,
          ]}
          onPress={handleContinuePhone}
          disabled={phoneNumber.length !== 10 || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator
              color={colors.white}
            />
          ) : (
            <Text style={styles.continueButtonText}>
              Continue
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By clicking, I accept the{" "}
          <Text style={styles.termsLink}>
            Terms of service
          </Text>{" "}
          and{" "}
          <Text style={styles.termsLink}>
            Privacy policy
          </Text>
        </Text>
      </View>
    </>
  );

  const renderOtpStep = () => (
    <>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          if (!isLoading) {
            setStep("phone");
            setOtp("");
            setAuthError(null);
          }
        }}
      >
        <Icon
          name="arrow-back"
          size={24}
          color={colors.white}
        />
      </TouchableOpacity>

      <View style={styles.brandSection}>
        <Text style={styles.stepTitle}>Verify OTP</Text>
        <Text style={styles.stepSubtitle}>
          Enter the 6-digit code sent to{"\n"}+91{" "}
          {phoneNumber}
        </Text>
      </View>

      <View style={styles.welcomeSection}>
        <View style={styles.inputContainer}>
          <Icon
            name="phone"
            size={20}
            color={colors.textLight}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter 6-digit OTP"
            placeholderTextColor={colors.textLight}
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
            maxLength={6}
          />
        </View>

        {authError && (
          <Text style={styles.errorText}>{authError}</Text>
        )}

        <TouchableOpacity
          style={[
            styles.continueButton,
            (otp.length !== 6 || isLoading) &&
              styles.continueButtonDisabled,
          ]}
          onPress={handleVerifyOtp}
          disabled={otp.length !== 6 || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator
              color={colors.white}
            />
          ) : (
            <Text style={styles.continueButtonText}>
              Verify & Continue
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendButton}
          disabled={isLoading}
          onPress={() => {
            setOtp("");
            setAuthError(null);
            setStep("phone");
          }}
        >
          <Text style={styles.resendText}>
            Didn't receive? Resend OTP
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderDetailsStep = () => (
    <>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setStep("otp")}
      >
        <Icon
          name="arrow-back"
          size={24}
          color={colors.white}
        />
      </TouchableOpacity>

      <View style={styles.brandSection}>
        <Text style={styles.stepTitle}>
          What's your name?
        </Text>
        <Text style={styles.stepSubtitle}>
          This will help us personalize your
          experience
        </Text>
      </View>

      <View style={styles.welcomeSection}>
        <View style={styles.inputContainer}>
          <Icon
            name="person"
            size={20}
            color={colors.textLight}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor={colors.textLight}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            (!name.trim() || isLoading) &&
              styles.continueButtonDisabled,
          ]}
          onPress={handleSaveName}
          disabled={!name.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator
              color={colors.white}
            />
          ) : (
            <Text style={styles.continueButtonText}>
              Continue
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  const renderLocationStep = () => {
    const finalEmpty =
      !selectedLocation && !manualAddress.trim();

    return (
      <>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep("details")}
        >
          <Icon
            name="arrow-back"
            size={24}
            color={colors.white}
          />
        </TouchableOpacity>

        <View style={styles.brandSection}>
          <Text style={styles.stepTitle}>
            Select your location
          </Text>
          <Text style={styles.stepSubtitle}>
            Choose or enter your delivery address
          </Text>
        </View>

        <View
          style={[
            styles.welcomeSection,
            styles.locationSection,
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={styles.detectLocationButton}
              onPress={handleUseCurrentLocation}
              disabled={isLocating}
            >
              <Icon
                name="navigate"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.detectLocationText}>
                {isLocating
                  ? "Detecting current location..."
                  : "Use Current Location"}
              </Text>
              {isLocating ? (
                <ActivityIndicator
                  size="small"
                  color={colors.textLight}
                />
              ) : (
                <Icon
                  name="arrow-forward"
                  size={20}
                  color={colors.textLight}
                />
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.manualAddressContainer}>
              <Text style={styles.manualAddressLabel}>
                Or enter manually
              </Text>
              <TextInput
                style={styles.manualAddressInput}
                placeholder="Enter your complete address"
                placeholderTextColor={colors.textLight}
                value={manualAddress}
                onChangeText={text => {
                  setManualAddress(text);
                  setSelectedLocation("");
                }}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.addNewSection}>
              <Text style={styles.addNewTitle}>
                Add new address
              </Text>

              <Text style={styles.labelText}>Label</Text>
              <TextInput
                style={styles.smallInput}
                value={addressLabel}
                onChangeText={setAddressLabel}
                placeholder="Home, Office"
              />

              <Text style={styles.labelText}>City</Text>
              <TextInput
                style={styles.smallInput}
                value={addressCity}
                onChangeText={setAddressCity}
                placeholder="City"
              />

              <Text style={styles.gpsStatusText}>
                {gpsSet
                  ? "GPS location set"
                  : "No GPS location set"}
              </Text>

              <TouchableOpacity
                style={styles.gpsButton}
                onPress={handleUseCurrentLocation}
                disabled={isLocating}
              >
                {isLocating ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.primary}
                  />
                ) : (
                  <>
                    <Icon
                      name="navigate"
                      size={18}
                      color={colors.primary}
                    />
                    <Text style={styles.gpsButtonText}>
                      Use GPS
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() =>
                  setIsDefaultAddress(v => !v)
                }
              >
                <View
                  style={[
                    styles.checkbox,
                    isDefaultAddress &&
                      styles.checkboxChecked,
                  ]}
                >
                  {isDefaultAddress && (
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
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.continueButton,
              (finalEmpty || isLoading) &&
                styles.continueButtonDisabled,
            ]}
            onPress={handleCompleteLogin}
            disabled={finalEmpty || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator
                color={colors.white}
              />
            ) : (
              <Text style={styles.continueButtonText}>
                Complete Setup
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primary}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === "ios" ? "padding" : undefined
        }
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>Z</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {step === "phone" && renderPhoneStep()}
          {step === "otp" && renderOtpStep()}
          {step === "details" && renderDetailsStep()}
          {step === "location" && renderLocationStep()}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  header: { paddingHorizontal: 16, paddingVertical: 20 },
  logoContainer: { alignItems: "flex-end" },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.primary,
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1, justifyContent: "space-between" },
  brandSection: { paddingHorizontal: 32, paddingTop: 40 },
  brandName: {
    fontSize: 72,
    fontWeight: "900",
    color: colors.white,
    marginBottom: 8,
  },
  brandTagline: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.white,
    marginBottom: 4,
  },
  brandDescription: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.white,
    marginBottom: 16,
  },
  brandSubtext: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 18,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.white,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 20,
  },
  welcomeSection: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  locationSection: { flex: 1 },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: colors.text,
  },
  continueButton: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  continueButtonDisabled: {
    backgroundColor: colors.textLight,
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.white,
  },
  termsText: {
    fontSize: 11,
    color: colors.textLight,
    textAlign: "center",
    lineHeight: 16,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: "700",
  },
  resendButton: { alignItems: "center", paddingVertical: 8 },
  resendText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  detectLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  detectLocationText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  dividerText: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: "600",
  },
  suggestedTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: colors.background,
    borderRadius: 10,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  locationItemSelected: {
    backgroundColor: "#E8F5E9",
    borderColor: colors.primary,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  locationTextSelected: {
    fontWeight: "600",
    color: colors.primary,
  },
  manualAddressContainer: { marginTop: 20 },
  manualAddressLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  manualAddressInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  errorText: {
    color: "#FF4444",
    fontSize: 12,
    marginBottom: 8,
  },
  addNewSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  addNewTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  labelText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  smallInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
    marginBottom: 8,
  },
  gpsStatusText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 6,
    marginBottom: 10,
  },
  gpsButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 12,
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
});

export default LoginScreen;
