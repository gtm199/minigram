import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Alert, Image, ScrollView, StyleSheet } from "react-native";

import { Button } from "../../components/Button";
import { FormInput } from "../../components/FormInput";
import { KeyboardView } from "../../components/KeyboardView";
import { Loading } from "../../components/Loading";
import { Screen } from "../../components/Screen";
import { ErrorState } from "../../components/States";
import { usePost } from "../../hooks/usePosts";
import { updatePost } from "../../services/postService";
import { COLORS, LIMITS, RADIUS } from "../../utils/constants";
import { applyServerErrors, getErrorMessage } from "../../utils/errors";
import { emitPostUpdated } from "../../utils/events";
import { CaptionForm, captionSchema, formResolver } from "../../utils/validation";

export default function EditPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = Number(id);
  const router = useRouter();
  const { post, loading, error, reload } = usePost(postId);

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

  useEffect(() => {
    if (post) reset({ caption: post.caption });
    // Only fill the form once per post; later event patches must not overwrite typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const updated = await updatePost(postId, values.caption.trim());
      emitPostUpdated(postId, { caption: updated.caption, updated_at: updated.updated_at });
      router.back();
    } catch (e) {
      if (!applyServerErrors(e, setError, ["caption"])) {
        Alert.alert("Couldn't update post", getErrorMessage(e));
      }
    }
  });

  if (loading) return <Loading />;
  if (!post) return <ErrorState message={error ?? "Post not found"} onRetry={reload} />;

  return (
    <Screen>
      <KeyboardView>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {post.image ? <Image source={{ uri: post.image }} style={styles.image} resizeMode="cover" /> : null}
          <FormInput control={control} name="caption" label="Caption" multiline maxLength={LIMITS.caption} />
          <Button title="Save" onPress={onSubmit} loading={isSubmitting} />
        </ScrollView>
      </KeyboardView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16 },
  image: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: RADIUS.md,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
  },
});
