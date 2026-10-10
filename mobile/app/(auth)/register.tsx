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
import { applyServerErrors, getErrorMessage } from "../../utils/errors";
import { formResolver, RegisterForm, registerSchema } from "../../utils/validation";

const FIELDS = ["username", "email", "first_name", "last_name", "password", "password_confirm"] as const;

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<RegisterForm>({
    defaultValues: {
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      password_confirm: "",
    },
    resolver: formResolver<RegisterForm>(registerSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await register({
        username: values.username.trim(),
        email: values.email.trim(),
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        password: values.password,
        password_confirm: values.password_confirm,
      });
    } catch (e) {
      if (!applyServerErrors(e, setError, FIELDS)) {
        setFormError(getErrorMessage(e));
      }
    }
  });

  return (
    <Screen edges={["top", "bottom", "left", "right"]}>
      <KeyboardView>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create your account</Text>

          <FormInput control={control} name="username" label="Username" autoCapitalize="none" autoCorrect={false} />
          <FormInput
            control={control}
            name="email"
            label="Email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
          <FormInput control={control} name="first_name" label="First name (optional)" autoCapitalize="words" />
          <FormInput control={control} name="last_name" label="Last name (optional)" autoCapitalize="words" />
          <FormInput control={control} name="password" label="Password" secureTextEntry autoCapitalize="none" />
          <FormInput
            control={control}
            name="password_confirm"
            label="Confirm password"
            secureTextEntry
            autoCapitalize="none"
          />

          {formError ? <Text style={styles.error}>{formError}</Text> : null}

          <Button title="Sign up" onPress={onSubmit} loading={isSubmitting} />

          <Pressable style={styles.switch} onPress={() => router.replace("/login")}>
            <Text style={styles.switchText}>
              Already have an account? <Text style={styles.link}>Log in</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 28, fontWeight: "800", color: COLORS.text, marginBottom: 24 },
  error: { color: COLORS.danger, fontSize: 14, marginBottom: 12, textAlign: "center" },
  switch: { marginTop: 24, alignItems: "center" },
  switchText: { color: COLORS.muted, fontSize: 14 },
  link: { color: COLORS.primary, fontWeight: "700" },
});
