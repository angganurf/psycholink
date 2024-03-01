import { z } from "zod";

export const loginValidator = z
  .object({
    email: z.string().email(),
    withoutRedirect: z.boolean().optional(),
    withPassword: z.boolean().optional(),
    password: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.withPassword) {
      if (!data.password) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password is required",
          path: ["password"],
        });
        return false;
      }
    }
    return true;
  });

export type LoginValitor = z.infer<typeof loginValidator>;

export const registerValidator = z
  .object({
    email: z.string().email(),
    withPassword: z.boolean().optional(),
    password: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.withPassword) {
      if (!data.password) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password is required",
          path: ["password"],
        });
        return false;
      }
    }
    return true;
  });
export type RegisterValidator = z.infer<typeof registerValidator>;

/* Verify Email */
export const verifyEmailValidator = z.object({
  code: z.array(z.string()).length(8),
});
export type VerifyEmailValidator = z.infer<typeof verifyEmailValidator>;

/* Reset Password */
export const passwordResetTokenValidator = z.object({
  email: z.string().email(),
});
export type PasswordResetTokenValidator = z.infer<
  typeof passwordResetTokenValidator
>;

export const resetPasswordValidator = z.object({
  token: z.string(),
  password: z.string().min(1, "Password is required"),
});
export type ResetPasswordValidator = z.infer<typeof resetPasswordValidator>;
