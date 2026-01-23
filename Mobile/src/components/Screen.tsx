import React from "react";
import { ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../theme/theme";

export function Screen(props: {
  children: React.ReactNode;
  padded?: boolean;
  scroll?: boolean;
  style?: ViewStyle | ViewStyle[];
  ignoreSafe?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const padded = props.padded ?? true;
  const bg = theme?.colors?.bg ?? "#F9FAFB";
  const padStyle: ViewStyle = !props.ignoreSafe ? {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  } : {};

  const content = (
    <View
      style={[
        styles.container,
        { backgroundColor: bg },
        padStyle,
        padded ? { paddingHorizontal: theme.spacing.md } : null,
        props.style,
      ]}
    >
      {props.children}
    </View>
  );

  if (props.scroll) {
    return (
      <ScrollView
        style={[styles.scroll, { backgroundColor: bg }]}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {content}
      </ScrollView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
});
