import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { AppTab } from "../types";

interface TabItem {
  key: AppTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: number;
}

interface BottomTabBarProps {
  tabs: TabItem[];
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
}

export function BottomTabBar({ tabs, activeTab, onChange }: BottomTabBarProps) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.container,
        {
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.background,
          paddingHorizontal: theme.spacing.m,
        },
      ]}
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            testID={`tab-${tab.key}`}
            accessibilityRole="button"
            accessibilityLabel={`Abrir aba ${tab.label}`}
            onPress={() => onChange(tab.key)}
            style={({ pressed }) => [
              styles.item,
              active && { backgroundColor: "transparent" },
              pressed && styles.pressed,
            ]}
          >
            <View>
              <Ionicons name={tab.icon} size={20} color={active ? theme.colors.primary : theme.colors.textMuted} />
              {!!tab.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge > 99 ? "99+" : tab.badge}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, { color: active ? theme.colors.primary : theme.colors.textMuted }]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 8,
  },
  item: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 999,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  pressed: { transform: [{ scale: 0.96 }] },
  label: { fontSize: 11, fontWeight: "600" },
  badge: { position: "absolute", top: -4, right: -6, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
});

