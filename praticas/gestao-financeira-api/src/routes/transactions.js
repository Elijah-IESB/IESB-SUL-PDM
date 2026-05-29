import { Router } from "express";
import ExcelJS from "exceljs";
import { prisma } from "../lib/prisma.js";
import { requireUserId } from "../lib/requestUser.js";
import {
  createTransactionSchema,
  updateTransactionSchema,
} from "../schemas/transactionSchema.js";

const router = Router();

async function canUseCategory(userId, categoryId) {
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      OR: [{ isDefault: true }, { userId }],
    },
  });

  return Boolean(category);
}

router.get("/", async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: "desc" },
    });
    res.json(transactions);
  } catch (e) {
    next(e);
  }
});

router.get("/export", async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const month = String(req.query.month ?? "").padStart(2, "0");
    const year = String(req.query.year ?? "");

    if (!/^\d{2}$/.test(month) || !/^\d{4}$/.test(year)) {
      return res.status(400).json({ error: "Informe mes e ano validos" });
    }

    const start = new Date(`${year}-${month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: start, lt: end },
      },
      include: { category: true },
      orderBy: { date: "asc" },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Gestão Financeira";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(`Resumo ${month}-${year}`);
    sheet.columns = [
      { header: "Data", key: "date", width: 14 },
      { header: "Descrição", key: "description", width: 32 },
      { header: "Categoria", key: "category", width: 22 },
      { header: "Tipo", key: "type", width: 12 },
      { header: "Valor", key: "value", width: 14 },
      { header: "Impacto", key: "impact", width: 14 },
    ];

    let income = 0;
    let expense = 0;

    for (const transaction of transactions) {
      const value = Number(transaction.value);
      const isIncome = Boolean(transaction.category?.isIncome);
      if (isIncome) income += value;
      else expense += value;

      sheet.addRow({
        date: new Date(transaction.date).toLocaleDateString("pt-BR"),
        description: transaction.description,
        category: transaction.category?.displayName ?? "Sem categoria",
        type: isIncome ? "Receita" : "Despesa",
        value,
        impact: isIncome ? value : -value,
      });
    }

    sheet.addRow({});
    sheet.addRow({ description: "Total de receitas", impact: income });
    sheet.addRow({ description: "Total de despesas", impact: -expense });
    sheet.addRow({ description: "Saldo do mês", impact: income - expense });

    sheet.getRow(1).font = { bold: true };
    sheet.getColumn("value").numFmt = '"R$"#,##0.00;[Red]-"R$"#,##0.00';
    sheet.getColumn("impact").numFmt = '"R$"#,##0.00;[Red]-"R$"#,##0.00';

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=\"resumo-${year}-${month}.xlsx\"`
    );
    res.send(Buffer.from(buffer));
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const data = createTransactionSchema.parse(req.body);
    if (!(await canUseCategory(userId, data.categoryId))) {
      return res.status(400).json({ error: "Categoria invalida para este usuario" });
    }

    const transaction = await prisma.transaction.create({
      data: { ...data, userId },
      include: { category: true },
    });
    res.status(201).json(transaction);
  } catch (e) {
    next(e);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const data = updateTransactionSchema.parse(req.body);
    const existing = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!existing) return res.status(404).json({ error: "Transacao nao encontrada" });

    if (data.categoryId && !(await canUseCategory(userId, data.categoryId))) {
      return res.status(400).json({ error: "Categoria invalida para este usuario" });
    }

    const transaction = await prisma.transaction.update({
      where: { id: req.params.id },
      data,
      include: { category: true },
    });
    res.json(transaction);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const existing = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!existing) return res.status(404).json({ error: "Transacao nao encontrada" });

    await prisma.transaction.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
