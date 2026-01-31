import React from "react";

import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { RootStackParamList } from "./types";
import { AppTabs } from "./AppTabs";

import { SplashScreen } from "../screens/SplashScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { AuthScreen } from "../screens/AuthScreen";
import { ForgotPasswordScreen } from "../screens/ForgotPasswordScreen";
import { VerifyOTPScreen } from "../screens/VerifyOTPScreen";
import { ResetPasswordScreen } from "../screens/ResetPasswordScreen";
import { EnvelopeDetailScreen } from "../screens/EnvelopeDetailScreen";
import { UpdateSpendingScreen } from "../screens/UpdateSpendingScreen";
import { BillDetailScreen } from "../screens/BillDetailScreen";
import { AddBillScreen } from "../screens/AddBillScreen";
import { AddEnvelopeScreen } from "../screens/AddEnvelopeScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { ProfileSettingsScreen } from "../screens/ProfileSettingsScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right", // nice default animation
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="AppTabs" component={AppTabs} />

      <Stack.Screen name="EnvelopeDetail" component={EnvelopeDetailScreen} />
      <Stack.Screen name="UpdateSpending" component={UpdateSpendingScreen} />
      <Stack.Screen name="BillDetail" component={BillDetailScreen} />
      <Stack.Screen name="AddBill" component={AddBillScreen} />
      <Stack.Screen name="AddEnvelope" component={AddEnvelopeScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
    </Stack.Navigator>
  );
}
