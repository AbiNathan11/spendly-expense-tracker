import { Ionicons } from "@expo/vector-icons";

export type IconName = keyof typeof Ionicons.glyphMap;

export function getEnvelopeIcon(name: string): IconName {
    const lower = name.toLowerCase();
    if (lower.includes("food") || lower.includes("groceries") || lower.includes("eat") || lower.includes("drink")) return "restaurant-outline";
    if (lower.includes("transport") || lower.includes("car") || lower.includes("bus") || lower.includes("fuel") || lower.includes("gas") || lower.includes("uber")) return "car-outline";
    if (lower.includes("entertainment") || lower.includes("movie") || lower.includes("fun") || lower.includes("game") || lower.includes("netflix")) return "film-outline";
    if (lower.includes("utilit") || lower.includes("bill") || lower.includes("light") || lower.includes("water") || lower.includes("wifi") || lower.includes("phone")) return "flash-outline";
    if (lower.includes("rent") || lower.includes("house") || lower.includes("home")) return "home-outline";
    if (lower.includes("shopping") || lower.includes("clothe") || lower.includes("gift")) return "cart-outline";
    if (lower.includes("health") || lower.includes("med") || lower.includes("doctor") || lower.includes("gym")) return "medical-outline";
    if (lower.includes("save") || lower.includes("invest") || lower.includes("bank")) return "wallet-outline";
    if (lower.includes("education") || lower.includes("book") || lower.includes("school") || lower.includes("course")) return "book-outline";
    if (lower.includes("personal") || lower.includes("self") || lower.includes("me")) return "person-outline";
    if (lower.includes("travel") || lower.includes("trip") || lower.includes("flight")) return "airplane-outline";
    return "pricetag-outline";
}

export function getTransactionIcon(title: string): IconName {
    const lower = title.toLowerCase();
    if (lower.includes("grocery") || lower.includes("market") || lower.includes("store") || lower.includes("food")) return "basket-outline";
    if (lower.includes("restaurant") || lower.includes("cafe") || lower.includes("coffee") || lower.includes("starbucks") || lower.includes("burger") || lower.includes("pizza")) return "restaurant-outline";
    if (lower.includes("uber") || lower.includes("lyft") || lower.includes("taxi") || lower.includes("bolt") || lower.includes("grab")) return "car-outline";
    if (lower.includes("gas") || lower.includes("fuel") || lower.includes("petrol") || lower.includes("diesel")) return "color-fill-outline";
    if (lower.includes("netflix") || lower.includes("spotify") || lower.includes("youtube") || lower.includes("prime") || lower.includes("disney")) return "play-circle-outline";
    if (lower.includes("amazon") || lower.includes("ebay") || lower.includes("shopping") || lower.includes("clothe") || lower.includes("buy")) return "cart-outline";
    if (lower.includes("rent") || lower.includes("mortgage") || lower.includes("landlord")) return "home-outline";
    if (lower.includes("bill") || lower.includes("electric") || lower.includes("water") || lower.includes("wifi") || lower.includes("internet") || lower.includes("mobile")) return "receipt-outline";
    if (lower.includes("gym") || lower.includes("fit") || lower.includes("health") || lower.includes("pharmacy") || lower.includes("med")) return "fitness-outline";
    if (lower.includes("atm") || lower.includes("cash") || lower.includes("withdraw") || lower.includes("salary") || lower.includes("refund")) return "cash-outline";
    if (lower.includes("transfer") || lower.includes("bank") || lower.includes("zelle") || lower.includes("venmo")) return "swap-horizontal-outline";
    return "card-outline";
}

export function getBillIcon(title: string): { bg: string; icon: IconName; color: string } {
    const lower = title.toLowerCase();

    if (lower.includes("netflix")) return { bg: "#000000", icon: "tv-outline", color: "#E50914" };
    if (lower.includes("spotify")) return { bg: "#22C55E", icon: "musical-notes-outline", color: "#FFFFFF" };
    if (lower.includes("apple") || lower.includes("icloud") || lower.includes("itunes")) return { bg: "#FFFFFF", icon: "logo-apple", color: "#000000" };
    if (lower.includes("google") || lower.includes("youtube") || lower.includes("drive")) return { bg: "#FFFFFF", icon: "logo-google", color: "#4285F4" };
    if (lower.includes("electric") || lower.includes("hydro") || lower.includes("power")) return { bg: "#FFFBEB", icon: "flash-outline", color: "#D97706" };
    if (lower.includes("water")) return { bg: "#EFF6FF", icon: "water-outline", color: "#2563EB" };
    if (lower.includes("wifi") || lower.includes("internet") || lower.includes("fiber")) return { bg: "#F5F3FF", icon: "wifi-outline", color: "#7C3AED" };
    if (lower.includes("phone") || lower.includes("mobile") || lower.includes("verizon") || lower.includes("at&t")) return { bg: "#ECFDF5", icon: "call-outline", color: "#059669" };
    if (lower.includes("rent") || lower.includes("mortgage") || lower.includes("apartment")) return { bg: "#F8FAFC", icon: "home-outline", color: "#475569" };
    if (lower.includes("insurance") || lower.includes("health") || lower.includes("car insurance")) return { bg: "#FEF2F2", icon: "shield-checkmark-outline", color: "#DC2626" };
    if (lower.includes("card") || lower.includes("credit") || lower.includes("visa") || lower.includes("mastercard")) return { bg: "#F1F5F9", icon: "card-outline", color: "#334155" };
    if (lower.includes("gym") || lower.includes("fitness") || lower.includes("club")) return { bg: "#F0FDFA", icon: "fitness-outline", color: "#0D9488" };

    return { bg: "#EAF2FF", icon: "receipt-outline", color: "#223447" };
}
