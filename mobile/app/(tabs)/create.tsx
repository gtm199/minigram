import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { Button } from "../../components/Button";
import { FormInput } from "../../components/FormInput";
import { KeyboardView } from "../../components/KeyboardView";
import { Screen } from "../../components/Screen";
import { createPost } from "../../services/postService";
import type { ImageFile } from "../../types";
import { COLORS, LIMITS, RADIUS } from "../../utils/constants";
import { applyServerErrors, getErrorMessage } from "../../utils/errors";
import { emitPostCreated } from "../../utils/events";
import { assetToImageFile } from "../../utils/upload";
import { CaptionForm, captionSchema, formResolver } from "../../utils/validation";

export default function CreatePostScreen() {
  const router = useRouter();
  const [image, setImage] = useState<ImageFile | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { isSubmitting },
  } = useForm<CaptionForm>({
    defaultValues: { caption: "" },
    resolver: formResolver<CaptionForm>(captionSchema),
  });

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled) return;
      setImage(assetToImageFile(result.assets[0]));
      setImageError(null);
    } catch {
      Alert.alert("Couldn't open your photos", "Please check the photo permission and try again.");
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!image) {
      setImageError("Choose a photo to share");
      return;
    }
    try {
      await createPost(values.caption.trim(), image);
      reset();
      setImage(null);
      emitPostCreated();
      Alert.alert("Post created successfully");
      router.navigate("/");
    } catch (e) {
      if (!applyServerErrors(e, setError, ["caption"])) {
        Alert.alert("Unable to upload image", getErrorMessage(e, "Unable to upload image"));
      }
    }
  });

  return (
    <Screen>
      <KeyboardView>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.picker} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="cover" />
            ) : (
              <>
                <Ionicons name="image-outline" size={48} color={COLORS.muted} />
                <Text style={styles.pickerText}>Tap to choose a photo</Text>
              </>
            )}
          </Pressable>
          {image ? (
            <Pressable onPress={pickImage}>
              <Text style={styles.change}>Choose a different photo</Text>
            </Pressable>
          ) : null}
          {imageError ? <Text style={styles.error}>{imageError}</Text> : null}

          <FormInput
            control={control}
            name="caption"
            label="Caption"
            placeholder="Write a caption..."
            multiline
            maxLength={LIMITS.caption}
          />

          <Button title="Share" onPress={onSubmit} loading={isSubmitting} />
        </ScrollView>
      </KeyboardView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 8 },
  picker: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    gap: 8,
  },
  preview: { width: "100%", height: "100%" },
  pickerText: { color: COLORS.muted, fontSize: 15 },
  change: { color: COLORS.primary, fontWeight: "600", textAlign: "center", marginBottom: 8 },
  error: { color: COLORS.danger, fontSize: 13 },
});
