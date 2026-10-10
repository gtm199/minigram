import { useForm } from "react-hook-form";
import { Alert, StyleSheet, Text, View } from "react-native";

import { changePassword } from "../services/authService";
import { COLORS } from "../utils/constants";
import { applyServerErrors, getErrorMessage } from "../utils/errors";
import { ChangePasswordForm, changePasswordSchema, formResolver } from "../utils/validation";
import { Button } from "./Button";
import { FormInput } from "./FormInput";

export function ChangePasswordSection() {
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { isSubmitting },
  } = useForm<ChangePasswordForm>({
    defaultValues: { old_password: "", new_password: "", new_password_confirm: "" },
    resolver: formResolver<ChangePasswordForm>(changePasswordSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await changePassword(values.old_password, values.new_password, values.new_password_confirm);
      reset();
      Alert.alert("Password changed successfully");
    } catch (e) {
      const handled = applyServerErrors(e, setError, [
        "old_password",
        "new_password",
        "new_password_confirm",
      ]);
      if (!handled) Alert.alert("Couldn't change password", getErrorMessage(e));
    }
  });

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Change password</Text>
      <FormInput control={control} name="old_password" label="Current password" secureTextEntry autoCapitalize="none" />
      <FormInput control={control} name="new_password" label="New password" secureTextEntry autoCapitalize="none" />
      <FormInput
        control={control}
        name="new_password_confirm"
        label="Confirm new password"
        secureTextEntry
        autoCapitalize="none"
      />
      <Button title="Update password" onPress={onSubmit} loading={isSubmitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 32 },
  title: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginBottom: 12 },
});
