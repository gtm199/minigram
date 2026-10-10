import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { FormInput } from "../components/FormInput";
import { KeyboardView } from "../components/KeyboardView";
import { Screen } from "../components/Screen";
import { useAuth } from "../hooks/useAuth";
import { updateMe } from "../services/userService";
import type { ImageFile } from "../types";
import { COLORS, LIMITS } from "../utils/constants";
import { applyServerErrors, getErrorMessage } from "../utils/errors";
import { emitProfileUpdated } from "../utils/events";
import { assetToImageFile } from "../utils/upload";
import { EditProfileForm, editProfileSchema, formResolver } from "../utils/validation";

const FIELDS = ["username", "email", "first_name", "last_name", "bio"] as const;

export default function EditProfileScreen() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [newImage, setNewImage] = useState<ImageFile | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<EditProfileForm>({
    defaultValues: {
      username: user?.username ?? "",
      email: user?.email ?? "",
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      bio: user?.bio ?? "",
    },
    resolver: formResolver<EditProfileForm>(editProfileSchema),
  });

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) setNewImage(assetToImageFile(result.assets[0]));
    } catch {
      Alert.alert("Couldn't open your photos", "Please check the photo permission and try again.");
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      const updated = await updateMe(
        {
          username: values.username.trim(),
          email: values.email.trim(),
          first_name: values.first_name.trim(),
          last_name: values.last_name.trim(),
          bio: values.bio.trim(),
        },
        newImage,
      );
      updateUser(updated);
      emitProfileUpdated();
      Alert.alert("Profile updated successfully");
      router.back();
    } catch (e) {
      if (!applyServerErrors(e, setError, FIELDS)) {
        Alert.alert("Couldn't update profile", getErrorMessage(e));
      }
    }
  });

  if (!user) return null;

  return (
    <Screen>
      <KeyboardView>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.avatarWrap} onPress={pickImage}>
            <Avatar uri={newImage?.uri ?? user.profile_picture} name={user.username} size={96} />
            <Text style={styles.change}>Change photo</Text>
          </Pressable>

          <FormInput control={control} name="username" label="Username" autoCapitalize="none" autoCorrect={false} />
          <FormInput
            control={control}
            name="email"
            label="Email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
          <FormInput control={control} name="first_name" label="First name" autoCapitalize="words" />
          <FormInput control={control} name="last_name" label="Last name" autoCapitalize="words" />
          <FormInput control={control} name="bio" label="Bio" multiline maxLength={LIMITS.bio} />

          <View style={{ marginTop: 8 }}>
            <Button title="Save changes" onPress={onSubmit} loading={isSubmitting} />
          </View>
        </ScrollView>
      </KeyboardView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16 },
  avatarWrap: { alignItems: "center", marginBottom: 24, gap: 8 },
  change: { color: COLORS.primary, fontWeight: "600" },
});
