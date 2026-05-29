import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { getUserId, requireUserId } from "../lib/requestUser.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../schemas/categorySchema.js";

const router = Router();

function normalizeName(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function hasDuplicateCategory({ userId, displayName, excludeId }) {
  const name = normalizeName(displayName);

  const duplicate = await prisma.category.findFirst({
    where: {
      id: excludeId ? { not: excludeId } : undefined,
      name,
      OR: [{ isDefault: true }, { userId }],
    },
  });

  return Boolean(duplicate);
}

router.get("/", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const categories = await prisma.category.findMany({
      where: userId
        ? { OR: [{ isDefault: true }, { userId }] }
        : { isDefault: true },
      orderBy: [{ isDefault: "desc" }, { displayName: "asc" }],
    });

    res.json(categories);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const data = createCategorySchema.parse(req.body);
    const name = normalizeName(data.displayName);

    if (await hasDuplicateCategory({ userId, displayName: data.displayName })) {
      return res.status(409).json({ error: "Categoria ja cadastrada" });
    }

    const category = await prisma.category.create({
      data: {
        ...data,
        name,
        userId,
        isDefault: false,
      },
    });

    res.status(201).json(category);
  } catch (e) {
    next(e);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: "Categoria nao encontrada" });
    }
    if (existing.isDefault) {
      return res.status(400).json({ error: "Categorias padrao nao podem ser alteradas" });
    }
    if (existing.userId !== userId) {
      return res.status(404).json({ error: "Categoria nao encontrada" });
    }

    const data = updateCategorySchema.parse(req.body);
    const nextName = data.displayName ? normalizeName(data.displayName) : existing.name;

    if (
      data.displayName &&
      (await hasDuplicateCategory({
        userId,
        displayName: data.displayName,
        excludeId: req.params.id,
      }))
    ) {
      return res.status(409).json({ error: "Categoria ja cadastrada" });
    }

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { ...data, name: nextName },
    });

    res.json(category);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const existing = await prisma.category.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) {
      return res.status(404).json({ error: "Categoria nao encontrada" });
    }
    if (existing.isDefault) {
      return res.status(400).json({ error: "Categorias padrao nao podem ser excluidas" });
    }
    if (existing.userId !== userId) {
      return res.status(404).json({ error: "Categoria nao encontrada" });
    }

    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
