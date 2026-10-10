import axios from "axios";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

function firstMessage(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstMessage(item);
      if (found) return found;
    }
    return null;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      const found = firstMessage(item);
      if (found) return found;
    }
  }
  return null;
}

/** Turn any thrown error into a short, user-friendly message. Never shows raw tracebacks. */
export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (!axios.isAxiosError(error)) return fallback;

  if (error.code === "ECONNABORTED") return "The request timed out. Please try again.";
  if (!error.response) return "Network error. Check your connection.";
  if (error.response.status === 429) return "Too many requests. Please try again later.";

  const data = error.response.data as
    | { message?: unknown; errors?: unknown }
    | string
    | undefined;

  if (data && typeof data === "object") {
    const fromErrors = firstMessage(data.errors);
    if (fromErrors) return fromErrors;
    if (typeof data.message === "string" && data.message) return data.message;
  }
  return fallback;
}

/** Copy field errors from a DRF validation response onto a react-hook-form form. */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly string[],
): boolean {
  if (!axios.isAxiosError(error)) return false;
  const errors = (error.response?.data as { errors?: unknown } | undefined)?.errors;
  if (!errors || typeof errors !== "object") return false;

  let applied = false;
  for (const [key, value] of Object.entries(errors as Record<string, unknown>)) {
    if (!fields.includes(key)) continue;
    const message = firstMessage(value);
    if (!message) continue;
    setError(key as Path<T>, { type: "server", message });
    applied = true;
  }
  return applied;
}
