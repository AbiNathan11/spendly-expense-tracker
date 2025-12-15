import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { Screen } from "../components/Screen";
import { theme } from "../theme/theme";
import { useBudget } from "../state/BudgetStore";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Expanded currency list
const currencies = [
  "USD", "EUR", "GBP", "JPY", "CAD",
  "AUD", "CHF", "CNY", "INR", "Rupees", "BRL",
  "ZAR", "MXN", "RUB", "KRW", "SGD"
];

export function ProfileSettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { state, updateProfile, updateAvatar, updateCurrency, logout } = useBudget();

  const [isEditing, setIsEditing] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const [name, setName] = useState(state.user.name);
  const [email, setEmail] = useState(state.user.email);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // Sync state when entering edit mode, or saving
  const handleEditToggle = () => {
    if (isEditing) {
      // Cancelled editing - reset fields
      setName(state.user.name);
      setEmail(state.user.email);
      setCurrencyOpen(false);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = () => {
    updateProfile(name.trim() || state.user.name, email.trim() || state.user.email);
    setIsEditing(false);
    setCurrencyOpen(false);
    setShowSuccessBanner(true);
    setTimeout(() => {
      setShowSuccessBanner(false);
    }, 3000);
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => {
          logout();
          navigation.reset({ index: 0, routes: [{ name: "Onboarding" }] });
        }
      }
    ]);
  };

  const pickImage = async () => {
    if (!isEditing) return;

    // Request permissions first? usually handled by expo automatically on access
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      updateAvatar(result.assets[0].uri);
    }
  };

  return (
    <Screen>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={isEditing ? handleSaveChanges : () => setIsEditing(true)}>
            <Text style={styles.headerAction}>{isEditing ? "Save" : "Edit"}</Text>
          </TouchableOpacity>
        </View>

        {/* Success Banner */}
        {showSuccessBanner && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.successText}>Profile updated successfully</Text>
          </View>
        )}

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} disabled={!isEditing} style={styles.avatarContainer}>
            {state.user.avatar ? (
              <Image source={{ uri: state.user.avatar }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{state.user.name.slice(0, 2).toUpperCase()}</Text>
              </View>
            )}

            {isEditing && (
              <View style={styles.editIconContainer}>
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          {/* Name */}
          <View style={styles.row}>
            <Text style={styles.label}>Full Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                autoCorrect={false}
              />
            ) : (
              <Text style={styles.value}>{state.user.name}</Text>
            )}
          </View>
          <View style={styles.divider} />

          {/* Email */}
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            ) : (
              <Text style={styles.value}>{state.user.email}</Text>
            )}
          </View>
        </View>

        {isEditing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>
            <View style={styles.row}>
              <Text style={styles.label}>New Password</Text>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Unchanged"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 8 }}>
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <Text style={[styles.label, { marginBottom: 12 }]}>Currency</Text>

          {isEditing ? (
            <View>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setCurrencyOpen(!currencyOpen)}
              >
                <Text style={styles.dropdownBtnText}>{state.currency}</Text>
                <Ionicons name={currencyOpen ? "chevron-up" : "chevron-down"} size={20} color={theme.colors.text} />
              </TouchableOpacity>

              {currencyOpen && (
                <View style={styles.dropdownList}>
                  {currencies.map(curr => (
                    <TouchableOpacity
                      key={curr}
                      style={[
                        styles.dropdownItem,
                        state.currency === curr && styles.dropdownItemActive
                      ]}
                      onPress={() => {
                        updateCurrency(curr);
                        setCurrencyOpen(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        state.currency === curr && styles.dropdownItemTextActive
                      ]}>{curr}</Text>

                      {state.currency === curr && (
                        <Ionicons name="checkmark" size={16} color={theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.currencyRowReadOnly}>
              <View style={styles.currencyBadge}>
                <Text style={styles.currencyBadgeText}>{state.currency}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />

        {/* Logout Button */}
        {!isEditing && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.text,
  },
  headerAction: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.primary,
    padding: 8,
    marginRight: -8,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.success,
    marginHorizontal: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  successText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImg: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1F2937",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  section: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    marginBottom: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "column",
    gap: 6,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  value: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.text,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.colors.text,
  },
  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownBtnText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: "600",
  },
  dropdownList: {
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 6,
  },
  dropdownItemActive: {
    backgroundColor: "#EFF6FF",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#4B5563",
  },
  dropdownItemTextActive: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
  currencyRowReadOnly: {
    flexDirection: "row",
  },
  currencyBadge: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  currencyBadgeText: {
    color: theme.colors.text,
    fontWeight: "500",
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
    backgroundColor: "#FEF2F2",
    marginHorizontal: 20,
    borderRadius: 12,
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "700",
  },
});
