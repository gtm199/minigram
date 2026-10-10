import { ReactNode } from "react";
import { KeyboardAvoidingView, StyleProp, ViewStyle } from "react-native";

export function KeyboardView({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <KeyboardAvoidingView style={[{ flex: 1 }, style]} behavior="padding">
      {children}
    </KeyboardAvoidingView>
  );
}
