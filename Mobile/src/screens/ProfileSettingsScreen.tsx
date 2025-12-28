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
import { useBudget } from "../state/BudgetStore";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const currencies = [
  "USD", "EUR", "GBP", "JPY", "CAD",
  "AUD", "CHF", "CNY", "INR", "BRL",
  "ZAR", "MXN", "RUB", "KRW", "SGD"
];

const ui = {
  bg: "#F9FAFB",
  card: "#FFFFFF",
  text: "#223447",
  muted: "#6B7280",
  border: "#E5E7EB",
  accent: "#223447",
  red: "#EF4444",
  success: "#10B981",
};

export function ProfileSettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { state, updateProfile, updateAvatar, updateCurrency, logout } = useBudget();

  const [isEditing, setIsEditing] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const [name, setName] = useState(state.user.name);
  const [email, setEmail] = useState(state.user.email);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  const handleEditToggle = () => {
    if (isEditing) {
      setName(state.user.name);
      setEmail(state.user.email);
      setCurrencyOpen(false);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = async () => {
    const success = await updateProfile(name.trim() || state.user.name, email.trim() || state.user.email, state.currency, state.dailyLimit);

    if (success) {
      setIsEditing(false);
      setCurrencyOpen(false);
      setShowSuccessBanner(true);
      setTimeout(() => setShowSuccessBanner(false), 3000);
    } else {
      Alert.alert("Error", "Failed to update profile.");
    }
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
    <Screen padded={false} style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={ui.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Settings</Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={isEditing ? handleSaveChanges : () => setIsEditing(true)}
        >
          <Text style={styles.editBtnText}>{isEditing ? "Save" : "Edit"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {showSuccessBanner && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
            <Text style={styles.successText}>Changes saved successfully</Text>
          </View>
        )}

        <View style={styles.avatarSection}>
          <TouchableOpacity
            onPress={pickImage}
            disabled={!isEditing}
            style={[styles.avatarContainer, isEditing && styles.avatarEditing]}
          >
            {state.user.avatar ? (
              <Image source={{ uri: state.user.avatar }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{state.user.name.slice(0, 1).toUpperCase()}</Text>
              </View>
            )}
            {isEditing && (
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.userName}>{state.user.name}</Text>
          <Text style={styles.userEmail}>{state.user.email}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Personal Info</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Display Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Name"
              />
            ) : (
              <Text style={styles.readOnlyValue}>{state.user.name}</Text>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.readOnlyValue}>{state.user.email}</Text>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Preferences</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>App Currency</Text>
            {isEditing ? (
              <View>
                <TouchableOpacity
                  style={styles.currencySelector}
                  onPress={() => setCurrencyOpen(!currencyOpen)}
                >
                  <Text style={styles.selectedCurrency}>{state.currency}</Text>
                  <Ionicons name={currencyOpen ? "chevron-up" : "chevron-down"} size={18} color={ui.muted} />
                </TouchableOpacity>

                {currencyOpen && (
                  <View style={styles.currencyGrid}>
                    {currencies.map(curr => (
                      <TouchableOpacity
                        key={curr}
                        style={[
                          styles.currencyItem,
                          state.currency === curr && styles.currencyItemActive
                        ]}
                        onPress={() => {
                          updateCurrency(curr);
                          setCurrencyOpen(false);
                        }}
                      >
                        <Text style={[
                          styles.currencyText,
                          state.currency === curr && styles.currencyTextActive
                        ]}>{curr}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.currencyBadge}>
                <Text style={styles.currencyBadgeText}>{state.currency}</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color={ui.red} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionInfo}>Spendly v1.0.4 • Made with ❤️</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: ui.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ui.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: ui.border,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: ui.text,
  },
  editBtn: {
    backgroundColor: ui.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ui.success,
    padding: 12,
    borderRadius: 16,
    marginBottom: 20,
    gap: 8,
  },
  successText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: ui.card,
    padding: 4,
    borderWidth: 1,
    borderColor: ui.border,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarEditing: {
    borderColor: ui.accent,
    borderWidth: 2,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
    backgroundColor: ui.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 40,
    color: "#FFFFFF",
    fontWeight: "900",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: ui.accent,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: ui.bg,
  },
  userName: {
    fontSize: 22,
    fontWeight: "900",
    color: ui.text,
  },
  userEmail: {
    fontSize: 14,
    color: ui.muted,
    fontWeight: "600",
    marginTop: 2,
  },
  card: {
    backgroundColor: ui.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: ui.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 18,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: ui.text,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: ui.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: ui.bg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "700",
    color: ui.text,
    borderWidth: 1,
    borderColor: ui.border,
  },
  readOnlyValue: {
    fontSize: 16,
    fontWeight: "700",
    color: ui.text,
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: ui.border,
    marginVertical: 15,
    opacity: 0.5,
  },
  currencySelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: ui.bg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: ui.border,
  },
  selectedCurrency: {
    fontSize: 16,
    fontWeight: "700",
    color: ui.text,
  },
  currencyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  currencyItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: ui.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ui.border,
    minWidth: 55,
    alignItems: "center",
  },
  currencyItemActive: {
    backgroundColor: ui.accent,
    borderColor: ui.accent,
  },
  currencyText: {
    fontSize: 13,
    fontWeight: "700",
    color: ui.text,
  },
  currencyTextActive: {
    color: "#FFFFFF",
  },
  currencyBadge: {
    backgroundColor: ui.bg,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ui.border,
  },
  currencyBadgeText: {
    fontSize: 14,
    fontWeight: "800",
    color: ui.accent,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    paddingVertical: 16,
    borderRadius: 20,
    gap: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  logoutText: {
    color: ui.red,
    fontWeight: "900",
    fontSize: 16,
  },
  versionInfo: {
    textAlign: "center",
    color: ui.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 30,
    opacity: 0.7,
  },
});
