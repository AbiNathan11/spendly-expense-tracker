import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";

import type { AppTabParamList } from "./types";

import { HomeScreen } from "../screens/HomeScreen";
import { EnvelopesScreen } from "../screens/EnvelopesScreen";
import { BillsScreen } from "../screens/BillsScreen";
import { ReportsScreen } from "../screens/ReportsScreen";

const ui = {
  bg: "#FFFFFF",
  border: "#E5E7EB",
  active: "#223447",
  inactive: "#6B7280",
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }): BottomTabNavigationOptions => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: ui.bg,
          borderTopColor: ui.border,
          height: 72,
          paddingTop: 8,
          paddingBottom: 20,
          paddingHorizontal: 20,
        },
        tabBarActiveTintColor: ui.active,
        tabBarInactiveTintColor: ui.inactive,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
          marginTop: 2,
        },
        tabBarIcon: ({ color, size }) => {
          const icon =
            route.name === "Home"
              ? "home"
              : route.name === "Envelopes"
                ? "wallet"
                : route.name === "Bills"
                  ? "calendar"
                  : "pie-chart";
          return <Ionicons name={icon as any} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Envelopes" component={EnvelopesScreen} />
      <Tab.Screen name="Bills" component={BillsScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
    </Tab.Navigator>
  );
}
