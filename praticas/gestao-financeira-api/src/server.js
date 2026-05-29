import "dotenv/config";
import express from "express";
import cors from "cors";

import authRouter from "./routes/auth.js";
import categoriesRouter from "./routes/categories.js";
import transactionsRouter from "./routes/transactions.js";

import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// Permite acesso externo (celular, Expo, navegador)
app.use(cors());

// Permite receber JSON
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({
    ok: true,
    name: "gestao-financeira-api",
  });
});

// Rotas
app.use("/auth", authRouter);
app.use("/categories", categoriesRouter);
app.use("/transactions", transactionsRouter);

// Middleware de tratamento de erros
app.use(errorHandler);

// Porta
const port = process.env.PORT ?? 3000;

// MUITO IMPORTANTE:
// "0.0.0.0" permite conexões externas
// (celular físico, Expo Go, etc.)
app.listen(port, "0.0.0.0", () => {
  console.log(`API rodando em http://0.0.0.0:${port}`);
});
