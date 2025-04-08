import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(20),
    email: z.string().trim().min(2).max(200).email(),
    password: z.string().trim().min(6).max(20),
    confirmPassword: z.string().trim().min(6).max(20),
  })
  .refine((password) => password.password === password.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().min(2).max(200).email(),
  password: z.string().trim().min(6).max(20),
  userAgent: z.string().optional(),
});

export const VerificationSchema = z.object({
  code: z.string().trim().min(1).max(255),
});

export const resetPasswordSchema = z.object({
  password: z.string().trim().min(6).max(255),
  verificationCode: VerificationSchema,
});

export const emailSchema = z.string().trim().email().min(1).max(200);
