import React, { useState } from "react";
import { View, TextInput, Text, StyleSheet, TouchableOpacity, TextInputProps } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

interface CleanInputProps extends TextInputProps {
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
}

export function CleanInput({
  label,
  error,
  secureTextEntry,
  style,
  ...props
}: CleanInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = secureTextEntry !== undefined;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <View style={styles.inputContainer}>
        <TextInput
          {...props}
          secureTextEntry={isPassword && !showPassword}
          placeholderTextColor="#6B6B6B"
          style={[styles.input, style]}
          selectionColor="#6B6B6B"
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            {showPassword ? (
              <EyeOff size={20} color="#6B6B6B" />
            ) : (
              <Eye size={20} color="#6B6B6B" />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#27272A",
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#FFFFFF",
    outlineStyle: "none",
    outlineWidth: 0,
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  error: {
    fontSize: 14,
    color: "#E74C3C",
    marginTop: 6,
  },
});

