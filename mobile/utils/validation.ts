import { yupResolver } from "@hookform/resolvers/yup";
import type { FieldValues, Resolver } from "react-hook-form";
import * as yup from "yup";

import { LIMITS } from "./constants";

export function formResolver<T extends FieldValues>(schema: yup.AnyObjectSchema): Resolver<T> {
  return yupResolver(schema as never) as unknown as Resolver<T>;
}

const usernameRule = yup
  .string()
  .trim()
  .required("Choose a username")
  .min(3, "At least 3 characters")
  .max(30, "At most 30 characters")
  .matches(/^[\w.@+-]+$/, "Letters, numbers and . @ + - _ only");

const emailRule = yup.string().trim().required("Enter your email").email("Enter a valid email");

export interface LoginForm {
  identifier: string;
  password: string;
}
export const loginSchema = yup.object({
  identifier: yup.string().trim().required("Enter your username or email"),
  password: yup.string().required("Enter your password"),
});

export interface RegisterForm {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}
export const registerSchema = yup.object({
  username: usernameRule,
  email: emailRule,
  first_name: yup.string().trim().max(150).default(""),
  last_name: yup.string().trim().max(150).default(""),
  password: yup.string().required("Choose a password").min(8, "At least 8 characters"),
  password_confirm: yup
    .string()
    .required("Confirm your password")
    .oneOf([yup.ref("password")], "Passwords do not match"),
});

export interface EditProfileForm {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  bio: string;
}
export const editProfileSchema = yup.object({
  username: usernameRule,
  email: emailRule,
  first_name: yup.string().trim().max(150).default(""),
  last_name: yup.string().trim().max(150).default(""),
  bio: yup.string().max(LIMITS.bio, `At most ${LIMITS.bio} characters`).default(""),
});

export interface ChangePasswordForm {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}
export const changePasswordSchema = yup.object({
  old_password: yup.string().required("Enter your current password"),
  new_password: yup.string().required("Enter a new password").min(8, "At least 8 characters"),
  new_password_confirm: yup
    .string()
    .required("Confirm your new password")
    .oneOf([yup.ref("new_password")], "Passwords do not match"),
});

export interface DeleteAccountForm {
  password: string;
}
export const deleteAccountSchema = yup.object({
  password: yup.string().required("Enter your password to confirm"),
});

export interface CaptionForm {
  caption: string;
}
export const captionSchema = yup.object({
  caption: yup.string().max(LIMITS.caption, `At most ${LIMITS.caption} characters`).default(""),
});
