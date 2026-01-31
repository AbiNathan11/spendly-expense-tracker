import * as Notifications from "expo-notifications";
import { NavigationContainerRef } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";
import React from "react";

// Global ref for navigation
export const navigationRef = React.createRef<NavigationContainerRef<RootStackParamList>>();

export function navigate(name: keyof RootStackParamList, params?: any) {
    if (navigationRef.current) {
        navigationRef.current.navigate(name as any, params);
    }
}

// Set up the listener
Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    if (data && data.billId) {
        // Delay slightly to ensure navigation is ready
        setTimeout(() => {
            navigate("BillDetail", { billId: data.billId });
        }, 500);
    }
});
