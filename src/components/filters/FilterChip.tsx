import React, { useMemo } from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { AppTheme, useTheme } from "../../theme";

interface FilterChipProps {
    label: string;
    isSelected: boolean;
    onPress: () => void;
    disabled?: boolean;
    icon?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({ label, isSelected, onPress, disabled, icon }) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <Pressable
            style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipSelected,
                pressed ? styles.chipPressed : null,
            ]}
            onPress={onPress}
            disabled={disabled}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${label}`}
            accessibilityHint="Double tap to toggle this filter"
            accessibilityState={{ selected: isSelected, disabled }}
        >
            {icon ? (
                <Text style={[styles.icon, isSelected && styles.textSelected]}>{icon}</Text>
            ) : null}
            <Text style={[styles.text, isSelected && styles.textSelected]}>
                {label}
            </Text>
        </Pressable>
    );
};
const createStyles = (theme: AppTheme) => StyleSheet.create({
    chip: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 10,
        minHeight: 44,
        borderRadius: 18,
        backgroundColor: theme.colors.chipBackground,
        borderWidth: theme.isHighContrast ? 2 : 1,
        borderColor: theme.colors.chipBorder,
    },

    chipPressed: {
        opacity: 0.94,
    },

    chipSelected: {
        backgroundColor: theme.colors.accent,
    },

    text: {
        fontSize: 13,
        color: theme.colors.chipText,
        fontWeight: "600",
    },

    icon: {
        marginRight: 6,
        fontSize: 13,
        color: theme.colors.chipText,
    },

    textSelected: {
        color: theme.colors.accentText,
    },
});
