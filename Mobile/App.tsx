import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { RootNavigator } from "./src/navigation/RootNavigator";
import { BudgetProvider } from "./src/state/BudgetStore";
import { theme } from "./src/theme/theme";

import { registerForNotifications } from "./src/utils/registerNotifications";
import "./src/utils/notificationHandler";
import { navigationRef } from "./src/utils/notificationHandler";
import { supabase } from "./src/config/supabase";


export default function App() {

  useEffect(() => {
    // Clear any stale Supabase sessions on app start
    const clearStaleSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log("Clearing stale session on app start");
          await supabase.auth.signOut();
        }
      } catch (error) {
        console.error("Error clearing stale session:", error);
      }
    };

    clearStaleSession();
    registerForNotifications();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BudgetProvider>
          <NavigationContainer theme={theme.navigationTheme} ref={navigationRef}>
            <StatusBar style="light" />
            <RootNavigator />
          </NavigationContainer>
        </BudgetProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
