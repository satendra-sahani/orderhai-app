// File: src/screens/CreateSubscriptionScreen.tsx
"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { Icon } from "../components/Icon";
import { useUser } from "../context/UserContext";
import { apiGetProducts, apiCreateSubscription, type ApiProduct } from "../api";

type Frequency = "daily" | "alternate" | "weekly" | "custom";
type Slot = "morning" | "afternoon" | "evening";

const STEPS = [
  "Select Products",
  "Frequency",
  "Delivery Slot",
  "Confirm Address",
  "Review",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface SelectedProduct {
  product: ApiProduct;
  qty: number;
}

export const CreateSubscriptionScreen = ({ navigation }: any) => {
  const { user } = useUser();
  const [step, setStep] = useState(0);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Products
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);

  // Step 2: Frequency
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [customDays, setCustomDays] = useState<number[]>([]);

  // Step 3: Slot
  const [deliverySlot, setDeliverySlot] = useState<Slot>("morning");

  // Step 4: Address
  const address = user?.location?.address || "Set delivery location";

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await apiGetProducts();
        setProducts(data || []);
      } catch (err: any) {
        Alert.alert("Error", err.message || "Failed to load products.");
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);

  const toggleProduct = (product: ApiProduct) => {
    setSelectedProducts((prev) => {
      const exists = prev.find((sp) => sp.product._id === product._id);
      if (exists) {
        return prev.filter((sp) => sp.product._id !== product._id);
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateProductQty = (productId: string, delta: number) => {
    setSelectedProducts((prev) =>
      prev.map((sp) =>
        sp.product._id === productId
          ? { ...sp, qty: Math.max(1, sp.qty + delta) }
          : sp
      )
    );
  };

  const isProductSelected = (productId: string) =>
    selectedProducts.some((sp) => sp.product._id === productId);

  const toggleCustomDay = (dayIndex: number) => {
    setCustomDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return selectedProducts.length > 0;
      case 1:
        return frequency !== "custom" || customDays.length > 0;
      case 2:
        return true;
      case 3:
        return !!address;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    if (selectedProducts.length === 0) return;

    setSubmitting(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);

      for (const sp of selectedProducts) {
        await apiCreateSubscription({
          productId: sp.product._id,
          qty: sp.qty,
          frequency: frequency === "alternate" ? "custom" : frequency,
          daysOfWeek: frequency === "custom" ? customDays : undefined,
          addressId: "",
          startDate: startDate.toISOString(),
        });
      }

      Alert.alert("Success", "Subscription created successfully!", [
        {
          text: "OK",
          onPress: () => navigation.navigate("Subscription"),
        },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create subscription.");
    } finally {
      setSubmitting(false);
    }
  };

  const getSlotIcon = (slot: Slot) => {
    switch (slot) {
      case "morning":
        return "sunny";
      case "afternoon":
        return "partly-sunny";
      case "evening":
        return "moon";
    }
  };

  const getSlotTime = (slot: Slot) => {
    switch (slot) {
      case "morning":
        return "6 AM - 9 AM";
      case "afternoon":
        return "12 PM - 3 PM";
      case "evening":
        return "5 PM - 8 PM";
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((_, idx) => (
        <View key={idx} style={styles.stepDotRow}>
          <View
            style={[
              styles.stepDot,
              idx <= step ? styles.stepDotActive : styles.stepDotInactive,
            ]}
          >
            {idx < step ? (
              <Icon name="checkmark" size={12} color={colors.white} />
            ) : (
              <Text
                style={[
                  styles.stepDotText,
                  idx <= step
                    ? styles.stepDotTextActive
                    : styles.stepDotTextInactive,
                ]}
              >
                {idx + 1}
              </Text>
            )}
          </View>
          {idx < STEPS.length - 1 && (
            <View
              style={[
                styles.stepLine,
                idx < step ? styles.stepLineActive : styles.stepLineInactive,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep0 = () => (
    <View style={{ flex: 1 }}>
      <Text style={styles.stepTitle}>Select Products</Text>
      <Text style={styles.stepSubtitle}>
        Choose products for your subscription
      </Text>
      {loadingProducts ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            const selected = isProductSelected(item._id);
            const sp = selectedProducts.find(
              (s) => s.product._id === item._id
            );
            return (
              <TouchableOpacity
                style={[styles.productItem, selected && styles.productItemSelected]}
                onPress={() => toggleProduct(item)}
              >
                <View style={styles.checkboxOuter}>
                  <View
                    style={[
                      styles.checkbox,
                      selected && styles.checkboxChecked,
                    ]}
                  >
                    {selected && (
                      <Icon name="checkmark" size={14} color={colors.white} />
                    )}
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productPrice}>
                    ₹{item.sellingPrice ?? item.price}
                  </Text>
                </View>
                {selected && sp && (
                  <View style={styles.qtyContainer}>
                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => updateProductQty(item._id, -1)}
                    >
                      <Icon name="remove" size={14} color={colors.white} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{sp.qty}</Text>
                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => updateProductQty(item._id, 1)}
                    >
                      <Icon name="add" size={14} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}
    </View>
  );

  const renderStep1 = () => {
    const frequencies: { key: Frequency; label: string; desc: string }[] = [
      { key: "daily", label: "Daily", desc: "Every day delivery" },
      {
        key: "alternate",
        label: "Alternate Days",
        desc: "Every other day delivery",
      },
      { key: "weekly", label: "Weekly", desc: "Once a week delivery" },
      { key: "custom", label: "Custom", desc: "Pick specific days" },
    ];

    return (
      <ScrollView style={{ flex: 1 }}>
        <Text style={styles.stepTitle}>Choose Frequency</Text>
        <Text style={styles.stepSubtitle}>
          How often do you want delivery?
        </Text>

        {frequencies.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.radioCard,
              frequency === f.key && styles.radioCardSelected,
            ]}
            onPress={() => setFrequency(f.key)}
          >
            <View
              style={[
                styles.radio,
                frequency === f.key && styles.radioSelected,
              ]}
            >
              {frequency === f.key && <View style={styles.radioDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.radioLabel,
                  frequency === f.key && styles.radioLabelSelected,
                ]}
              >
                {f.label}
              </Text>
              <Text style={styles.radioDesc}>{f.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {frequency === "custom" && (
          <View style={styles.customDaysContainer}>
            <Text style={styles.customDaysTitle}>Select Days</Text>
            <View style={styles.daysRow}>
              {DAYS.map((day, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dayChip,
                    customDays.includes(idx) && styles.dayChipSelected,
                  ]}
                  onPress={() => toggleCustomDay(idx)}
                >
                  <Text
                    style={[
                      styles.dayChipText,
                      customDays.includes(idx) && styles.dayChipTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderStep2 = () => {
    const slots: Slot[] = ["morning", "afternoon", "evening"];

    return (
      <ScrollView style={{ flex: 1 }}>
        <Text style={styles.stepTitle}>Delivery Slot</Text>
        <Text style={styles.stepSubtitle}>
          Choose your preferred delivery time
        </Text>

        {slots.map((slot) => (
          <TouchableOpacity
            key={slot}
            style={[
              styles.slotCard,
              deliverySlot === slot && styles.slotCardSelected,
            ]}
            onPress={() => setDeliverySlot(slot)}
          >
            <View style={styles.slotIconContainer}>
              <Icon
                name={getSlotIcon(slot)}
                size={28}
                color={deliverySlot === slot ? colors.primary : colors.textLight}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.slotLabel,
                  deliverySlot === slot && styles.slotLabelSelected,
                ]}
              >
                {slot.charAt(0).toUpperCase() + slot.slice(1)}
              </Text>
              <Text style={styles.slotTime}>{getSlotTime(slot)}</Text>
            </View>
            {deliverySlot === slot && (
              <Icon name="checkmark-circle" size={22} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderStep3 = () => (
    <ScrollView style={{ flex: 1 }}>
      <Text style={styles.stepTitle}>Confirm Address</Text>
      <Text style={styles.stepSubtitle}>
        Delivery will be made to this address
      </Text>

      <View style={styles.addressCard}>
        <Icon name="location" size={22} color={colors.primary} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.addressLabel}>Delivery Address</Text>
          <Text style={styles.addressText}>{address}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.changeAddressButton}
        onPress={() => navigation.navigate("AddressManager")}
      >
        <Icon name="pencil" size={16} color={colors.primary} />
        <Text style={styles.changeAddressText}>Change Address</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep4 = () => (
    <ScrollView style={{ flex: 1 }}>
      <Text style={styles.stepTitle}>Review & Confirm</Text>
      <Text style={styles.stepSubtitle}>
        Review your subscription details
      </Text>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Products</Text>
        {selectedProducts.map((sp, idx) => (
          <View key={idx} style={styles.reviewItem}>
            <Text style={styles.reviewItemName}>
              {sp.product.name} x{sp.qty}
            </Text>
            <Text style={styles.reviewItemPrice}>
              ₹{(sp.product.sellingPrice ?? sp.product.price) * sp.qty}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Frequency</Text>
        <Text style={styles.reviewValue}>
          {frequency === "alternate"
            ? "Alternate Days"
            : frequency.charAt(0).toUpperCase() + frequency.slice(1)}
          {frequency === "custom" &&
            ` (${customDays.map((d) => DAYS[d]).join(", ")})`}
        </Text>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Delivery Slot</Text>
        <Text style={styles.reviewValue}>
          {deliverySlot.charAt(0).toUpperCase() + deliverySlot.slice(1)} (
          {getSlotTime(deliverySlot)})
        </Text>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Address</Text>
        <Text style={styles.reviewValue}>{address}</Text>
      </View>
    </ScrollView>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 0:
        return renderStep0();
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F8F8" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{STEPS[step]}</Text>
        <View style={{ width: 40 }} />
      </View>

      {renderStepIndicator()}

      <View style={styles.content}>{renderCurrentStep()}</View>

      {/* Bottom buttons */}
      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity style={styles.prevButton} onPress={handleBack}>
            <Text style={styles.prevButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        {step < STEPS.length - 1 ? (
          <TouchableOpacity
            style={[
              styles.nextButton,
              !canProceed() && styles.buttonDisabled,
            ]}
            onPress={handleNext}
            disabled={!canProceed()}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Icon name="arrow-forward" size={16} color={colors.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Create Subscription</Text>
            )}
          </TouchableOpacity>
        )}
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
    fontWeight: "700",
    color: colors.text,
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: colors.white,
  },
  stepDotRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepDotInactive: {
    backgroundColor: "#E0E0E0",
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: "700",
  },
  stepDotTextActive: {
    color: colors.white,
  },
  stepDotTextInactive: {
    color: colors.textSecondary,
  },
  stepLine: {
    width: 30,
    height: 2,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  stepLineInactive: {
    backgroundColor: "#E0E0E0",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  productItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  checkboxOuter: {},
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#CCC",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
    marginTop: 2,
  },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 6,
    overflow: "hidden",
  },
  qtyButton: {
    width: 26,
    height: 26,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    minWidth: 28,
    textAlign: "center",
  },
  radioCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.border,
    gap: 12,
  },
  radioCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CCC",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  radioLabelSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  radioDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  customDaysContainer: {
    marginTop: 16,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  customDaysTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F0F0",
  },
  dayChipSelected: {
    backgroundColor: colors.primary,
  },
  dayChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  dayChipTextSelected: {
    color: colors.white,
  },
  slotCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.border,
    gap: 14,
  },
  slotCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  slotIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  slotLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  slotLabelSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  slotTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  changeAddressButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 6,
  },
  changeAddressText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  reviewSection: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  reviewItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  reviewItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  reviewItemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  prevButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  prevButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  nextButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default CreateSubscriptionScreen;
