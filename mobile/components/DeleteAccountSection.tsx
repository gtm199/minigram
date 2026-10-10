import { useForm } from "react-hook-form";
import { Alert, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../hooks/useAuth";
import { COLORS } from "../utils/constants";
import { applyServerErrors, getErrorMessage } from "../utils/errors";
import { DeleteAccountForm, deleteAccountSchema, formResolver } from "../utils/validation";
import { Button } from "./Button";
import { FormInput } from "./FormInput";

export function DeleteAccountSection() {
  const { deleteAccount } = useAuth();
  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<DeleteAccountForm>({
    defaultValues: { password: "" },
    resolver: formResolver<DeleteAccountForm>(deleteAccountSchema),
  });

  const performDelete = async (password: string) => {
    try {
      await deleteAccount(password);
    } catch (e) {
      if (!applyServerErrors(e, setError, ["password"])) {
        Alert.alert("Couldn't delete account", getErrorMessage(e));
      }
    }
  };

  const onSubmit = handleSubmit((values) => {
    Alert.alert(
      "Delete your account?",
      "Your profile, posts, comments and followers will be permanently removed.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => performDelete(values.password) },
      ],
    );
  });

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Delete account</Text>
      <Text style={styles.warning}>This permanently removes your account and everything in it.</Text>
      <FormInput control={control} name="password" label="Confirm with your password" secureTextEntry autoCapitalize="none" />
      <Button title="Delete my account" variant="danger" onPress={onSubmit} loading={isSubmitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 32 },
  title: { fontSize: 18, fontWeight: "700", color: COLORS.danger, marginBottom: 6 },
  warning: { fontSize: 14, color: COLORS.muted, marginBottom: 12 },
});
