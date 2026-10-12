import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
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

const MAX_VIDEO_MB = 25; // keep in sync with MAX_VIDEO_SIZE_MB on the backend

function VideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
  });
  return <VideoView player={player} style={styles.preview} nativeControls contentFit="contain" />;
}

export default function CreatePostScreen() {
  const router = useRouter();
  const [media, setMedia] = useState<ImageFile | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const isVideo = media?.type.startsWith("video/") ?? false;

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

  const pickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        quality: 0.8,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.type === "video" && asset.fileSize && asset.fileSize > MAX_VIDEO_MB * 1024 * 1024) {
        setMediaError(`Video must be smaller than ${MAX_VIDEO_MB} MB.`);
        return;
      }
      setMedia(assetToImageFile(asset));
      setMediaError(null);
    } catch {
      Alert.alert("Couldn't open your library", "Please check the permission and try again.");
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!media) {
      setMediaError("Choose a photo or video to share");
      return;
    }
    try {
      await createPost(values.caption.trim(), media);
      reset();
      setMedia(null);
      emitPostCreated();
      Alert.alert("Post created successfully");
      router.navigate("/");
    } catch (e) {
      if (!applyServerErrors(e, setError, ["caption"])) {
        Alert.alert("Unable to upload", getErrorMessage(e, "Unable to upload"));
      }
    }
  });

  return (
    <Screen>
      <KeyboardView>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {media ? (
            <>
              <Pressable style={[styles.picker, isVideo && styles.videoPicker]}>
                {isVideo ? (
                  <VideoPreview uri={media.uri} />
                ) : (
                  <Image source={{ uri: media.uri }} style={styles.preview} resizeMode="cover" />
                )}
              </Pressable>
              <Pressable onPress={pickMedia}>
                <Text style={styles.change}>Choose something else</Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.picker} onPress={pickMedia}>
              <Ionicons name="images-outline" size={48} color={COLORS.muted} />
              <Text style={styles.pickerText}>Tap to choose a photo or video</Text>
            </Pressable>
          )}
          {mediaError ? <Text style={styles.error}>{mediaError}</Text> : null}

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
  videoPicker: { backgroundColor: "#000000", borderStyle: "solid" },
  preview: { width: "100%", height: "100%" },
  pickerText: { color: COLORS.muted, fontSize: 15 },
  change: { color: COLORS.primary, fontWeight: "600", textAlign: "center", marginBottom: 8 },
  error: { color: COLORS.danger, fontSize: 13 },
});
