import { z } from "zod";

const strongPassword = z
  .string()
  .min(8, "Senha deve ter pelo menos 8 caracteres")
  .regex(/[a-z]/, "Senha deve ter uma letra minuscula")
  .regex(/[A-Z]/, "Senha deve ter uma letra maiuscula")
  .regex(/[0-9]/, "Senha deve ter um numero")
  .regex(/[^A-Za-z0-9]/, "Senha deve ter um caractere especial");

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || null);

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().trim().email("E-mail invalido").toLowerCase(),
  password: strongPassword,
});

export const loginSchema = z.object({
  email: z.string().trim().email("E-mail invalido").toLowerCase(),
  password: z.string().min(1, "Informe a senha"),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().trim().email("E-mail invalido").toLowerCase(),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email("E-mail invalido").toLowerCase(),
  token: z.string().trim().regex(/^\d{6}$/, "Token deve ter 6 digitos"),
  newPassword: strongPassword,
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Informe a senha atual"),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres"),
  phone: optionalText,
  address: optionalText,
  city: optionalText,
  state: optionalText,
  zipCode: optionalText,
  birthDate: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null)
    .pipe(z.coerce.date().nullable()),
});
