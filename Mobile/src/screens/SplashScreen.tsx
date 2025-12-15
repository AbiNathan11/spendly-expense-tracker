import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View, Animated, Dimensions, TouchableWithoutFeedback } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { RootStackParamList } from "../navigation/types";
import { Screen } from "../components/Screen";

const { width } = Dimensions.get("window");

export function SplashScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      // Scale up with bounce
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      // Slide up
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      // Rotate icon
      Animated.timing(iconRotate, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After initial animation, start pulsing
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  const handlePress = () => {
    navigation.replace("Onboarding");
  };

  const iconRotateInterpolate = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Screen padded={false} style={styles.screen}>
      <TouchableWithoutFeedback onPress={handlePress}>
        <View style={{ flex: 1 }}>
          <LinearGradient
            colors={['#223447', '#223447']}
            style={styles.gradient}
          >
            <View style={styles.center}>
              {/* Animated Logo Container */}
              <Animated.View
                style={[
                  styles.logoContainer,
                  {
                    opacity: fadeAnim,
                    transform: [
                      { scale: scaleAnim },
                      { translateY: slideAnim },
                    ],
                  },
                ]}
              >
                {/* Row for Icon + Title */}
                <View style={styles.logoRow}>
                  {/* Animated Icon with Rotation */}
                  <Animated.View
                    style={{
                      marginRight: 8, // Reduced margin
                      transform: [
                        { rotate: iconRotateInterpolate },
                        { scale: pulseAnim },
                      ],
                    }}
                  >
                    <Ionicons name="wallet-outline" size={36} color="#F59E0B" />
                  </Animated.View>

                  {/* Title Text */}
                  <Text style={styles.logo}>Spendly</Text>
                </View>

                {/* Tagline */}
                <Text style={styles.tagline}>Smart Expense Tracker</Text>
              </Animated.View>
            </View>
          </LinearGradient>
        </View>
      </TouchableWithoutFeedback>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 100, // Shift content towards top
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  logo: {
    fontSize: 36,
    fontWeight: "700",
    color: "#F59E0B",
    letterSpacing: 1.5,
    textAlign: "center",
    textShadowColor: "rgba(245, 158, 11, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tagline: {
    fontSize: 14,
    fontWeight: "400",
    color: "#94A3B8",
    letterSpacing: 1,
    textAlign: "center",
    marginTop: 0,
  },
});
