import { useRouter } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { Button } from "../../components/Button";
import { FormInput } from "../../components/FormInput";
import { KeyboardView } from "../../components/KeyboardView";
import { Screen } from "../../components/Screen";
import { useAuth } from "../../hooks/useAuth";
import { COLORS } from "../../utils/constants";
import { getErrorMessage } from "../../utils/errors";
import { formResolver, LoginForm, loginSchema } from "../../utils/validation";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginForm>({
    defaultValues: { identifier: "", password: "" },
    resolver: formResolver<LoginForm>(loginSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login(values.identifier.trim(), values.password);
    } catch (e) {
      setFormError(getErrorMessage(e, "Invalid username or password"));
    }
  });

  return (
    <Screen edges={["top", "bottom", "left", "right"]}>
      <KeyboardView>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.logo}>MiniGram</Text>
          <Text style={styles.subtitle}>Log in to see photos from people you follow.</Text>

          <FormInput
            control={control}
            name="identifier"
            label="Username or email"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <FormInput control={control} name="password" label="Password" secureTextEntry autoCapitalize="none" />

          {formError ? <Text style={styles.error}>{formError}</Text> : null}

          <Button title="Log in" onPress={onSubmit} loading={isSubmitting} />

          <Pressable style={styles.switch} onPress={() => router.push("/register")}>
            <Text style={styles.switchText}>
              Don't have an account? <Text style={styles.link}>Sign up</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: "center", padding: 24 },
  logo: { fontSize: 36, fontWeight: "800", color: COLORS.text, textAlign: "center" },
  subtitle: { fontSize: 15, color: COLORS.muted, textAlign: "center", marginTop: 8, marginBottom: 32 },
  error: { color: COLORS.danger, fontSize: 14, marginBottom: 12, textAlign: "center" },
  switch: { marginTop: 24, alignItems: "center" },
  switchText: { color: COLORS.muted, fontSize: 14 },
  link: { color: COLORS.primary, fontWeight: "700" },
});
