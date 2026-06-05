import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

type Variant = "primary" | "secondary" | "outline";

interface AppButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  testID?: string;
  style?: ViewStyle;
}

export function AppButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  testID,
  style,
}: AppButtonProps) {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor:
            variant === "primary"
              ? theme.colors.primary
              : variant === "secondary"
              ? theme.colors.surfaceHighlight
              : theme.colors.background,
          borderWidth: variant === "outline" ? 1 : 0,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.full,
        },
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? theme.colors.primaryForeground : theme.colors.primary} />
      ) : (
        <Text
          style={[
            styles.textBase,
            {
              color:
                variant === "primary"
                  ? theme.colors.primaryForeground
                  : theme.colors.textMain,
              fontSize: theme.typography.body,
            },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.55 },
  pressed: { transform: [{ scale: 0.98 }] },
  textBase: { fontWeight: "600" },
});

