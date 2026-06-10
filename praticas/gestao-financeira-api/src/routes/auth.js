import { Router } from "express";
import { randomInt } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { sendPasswordResetEmail } from "../lib/email.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { requireUserId } from "../lib/requestUser.js";
import {
  deleteAccountSchema,
  loginSchema,
  registerSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "../schemas/authSchema.js";

const router = Router();

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    city: user.city,
    state: user.state,
    zipCode: user.zipCode,
    birthDate: user.birthDate,
    createdAt: user.createdAt,
  };
}

router.post("/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });

    if (existing) {
      return res.status(409).json({ error: "Este e-mail já está cadastrado" });
    }

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: hashPassword(data.password),
      },
    });

    res.status(201).json({ user: publicUser(user) });
  } catch (e) {
    next(e);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });

    if (!user || !verifyPassword(data.password, user.passwordHash)) {
      return res.status(401).json({ error: "E-mail ou senha inválidos" });
    }

    res.json({ user: publicUser(user) });
  } catch (e) {
    next(e);
  }
});

router.post("/request-password-reset", async (req, res, next) => {
  try {
    const data = requestPasswordResetSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });

    if (!user) {
      return res.status(404).json({ error: "E-mail nao encontrado" });
    }

    const token = String(randomInt(100000, 1000000));
    await prisma.user.update({
      where: { email: data.email },
      data: {
        resetTokenHash: hashPassword(token),
        resetTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    let emailSent = true;
    let warning = null;
    try {
      await sendPasswordResetEmail({ to: data.email, token });
    } catch (emailError) {
      emailSent = false;
      warning = emailError.message;
    }

    res.json({
      ok: true,
      emailSent,
      devToken: token,
      warning,
    });
  } catch (e) {
    next(e);
  }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const data = resetPasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });

    if (
      !user ||
      !user.resetTokenHash ||
      !user.resetTokenExpiresAt ||
      user.resetTokenExpiresAt < new Date() ||
      !verifyPassword(data.token, user.resetTokenHash)
    ) {
      return res.status(401).json({ error: "Token inválido ou expirado" });
    }

    await prisma.user.update({
      where: { email: data.email },
      data: {
        passwordHash: hashPassword(data.newPassword),
        resetTokenHash: null,
        resetTokenExpiresAt: null,
      },
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.put("/users/:id", async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    if (userId !== req.params.id) {
      return res.status(403).json({ error: "Você só pode editar seus próprios dados" });
    }

    const data = updateProfileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ user: publicUser(user) });
  } catch (e) {
    next(e);
  }
});

router.delete("/users/:id", async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    if (userId !== req.params.id) {
      return res.status(403).json({ error: "Você só pode excluir sua própria conta" });
    }

    const data = deleteAccountSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !verifyPassword(data.password, user.passwordHash)) {
      return res.status(401).json({ error: "Senha atual inválida" });
    }

    await prisma.transaction.deleteMany({ where: { userId } });
    await prisma.category.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
