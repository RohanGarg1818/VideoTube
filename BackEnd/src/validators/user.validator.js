import { z } from "zod";

const password = z
  .string({ error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

const email = z.string({ error: "Email is required" }).trim().toLowerCase().pipe(z.email("Invalid email address"));

const username = z
  .string({ error: "Username is required" })
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(/^[a-z0-9_.-]+$/, "Username may only contain letters, numbers, '.', '-' and '_'");

const fullName = z.string({ error: "Full name is required" }).trim().min(1, "Full name is required").max(60);

export const registerSchema = { body: z.object({ fullName, email, username, password }) };

export const loginSchema = {
  body: z
    .object({
      email: z.string().trim().toLowerCase().optional(),
      username: z.string().trim().toLowerCase().optional(),
      identifier: z.string().trim().toLowerCase().optional(),
      password: z.string({ error: "Password is required" }).min(1, "Password is required").max(128),
    })
    .refine((b) => b.email || b.username || b.identifier, {
      message: "Username or email is required",
      path: ["username"],
    }),
};

export const refreshSchema = { body: z.object({ refreshToken: z.string().optional() }).optional().default({}) };

export const changePasswordSchema = {
  body: z
    .object({
      oldPassword: z.string({ error: "Current password is required" }).min(1, "Current password is required"),
      newPassword: password,
    })
    .refine((b) => b.oldPassword !== b.newPassword, {
      message: "New password must differ from the current one",
      path: ["newPassword"],
    }),
};

export const updateAccountSchema = {
  body: z
    .object({ fullName: fullName.optional(), email: email.optional() })
    .refine((b) => b.fullName || b.email, { message: "Provide fullName or email to update" }),
};

export const channelSchema = { params: z.object({ username }) };
