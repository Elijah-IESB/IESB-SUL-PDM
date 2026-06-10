# Roteiro de gravação - Gestão Financeira

Use este roteiro como guia para gravar a tela no OBS e apresentar o projeto ao professor.

## 1. Abrir o backend no VS Code

No terminal, dentro da pasta da API:

```bash
cd praticas/gestao-financeira-api
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Mostre que a API está rodando em:

```text
http://localhost:3000
```

## 2. Mostrar que o banco é MySQL

Abra o arquivo:

```text
praticas/gestao-financeira-api/prisma/schema.prisma
```

Mostre esta configuração:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

No MySQL Workbench, DBeaver ou outro SGBD, abra o banco:

```sql
USE gestao_financeira;
SHOW TABLES;
```

Tabelas principais para mostrar:

```sql
SELECT id, name, email, phone, city, state, zipCode, createdAt FROM User;
SELECT id, name, displayName, icon, background, isIncome, isDefault, userId FROM Category;
SELECT id, description, value, date, categoryId, userId, createdAt FROM Transaction;
```

## 3. Testar a collection no Postman

Importe a collection:

```text
praticas/gestao-financeira-api/postman/collection.json
```

Confirme a variável:

```text
baseUrl = http://localhost:3000
```

Teste nesta ordem:

1. `GET {{baseUrl}}/`
2. `GET {{baseUrl}}/categories`
3. `POST {{baseUrl}}/categories`
4. `PUT {{baseUrl}}/categories/:id`
5. `DELETE {{baseUrl}}/categories/:id`
6. Tente excluir uma categoria padrão e mostre o erro
7. `POST {{baseUrl}}/transactions`
8. `GET {{baseUrl}}/transactions`
9. `DELETE {{baseUrl}}/transactions/:id`
10. `POST {{baseUrl}}/transactions` com body inválido para mostrar o Zod

Depois de criar ou excluir dados pelo Postman, volte no SGBD e rode:

```sql
SELECT id, name, displayName, icon, background, isIncome, isDefault, userId FROM Category ORDER BY createdAt DESC;
SELECT id, description, value, date, categoryId, userId, createdAt FROM Transaction ORDER BY createdAt DESC;
```

## 4. Abrir o frontend

Em outro terminal:

```bash
cd praticas/gestao-financeira
npm install
npx expo start
```

Abra o app no emulador ou no Expo Go.

## 5. Funcionalidades para demonstrar no app

1. Tela inicial de apresentação do aplicativo.
2. Cadastro de novo usuário.
3. Login com e-mail e senha.
4. Mensagem de boas-vindas com o nome do usuário.
5. Recuperação de senha:
   - Clique em `Esqueci minha senha`.
   - Informe o e-mail.
   - Use o código recebido por e-mail ou o código exibido no alerta de teste.
   - Cadastre uma nova senha.
   - Faça login com a nova senha.
6. Tela `Meus dados`:
   - Edite nome, telefone, nascimento, endereço, cidade, estado e CEP.
   - Mostre no banco:

```sql
SELECT id, name, email, phone, address, city, state, zipCode, birthDate FROM User ORDER BY updatedAt DESC;
```

7. Categorias:
   - Crie uma categoria customizada.
   - Edite uma categoria customizada.
   - Mostre que categorias padrão não podem ser alteradas.
   - Mostre no banco:

```sql
SELECT id, name, displayName, icon, background, isIncome, isDefault, userId FROM Category ORDER BY createdAt DESC;
```

8. Transações:
   - Crie uma receita.
   - Crie uma despesa.
   - Edite uma transação.
   - Exclua uma transação.
   - Mostre no banco:

```sql
SELECT id, description, value, date, categoryId, userId, createdAt FROM Transaction ORDER BY createdAt DESC;
```

9. Resumo:
   - Use filtro de mês e ano.
   - Mostre o gráfico.
   - Exporte o resumo mensal em Excel.

10. Segurança por usuário:
    - Entre com outro usuário.
    - Mostre que os dados ficam separados pelo `userId` no banco.

```sql
SELECT userId, COUNT(*) AS total_transacoes FROM Transaction GROUP BY userId;
SELECT userId, COUNT(*) AS total_categorias FROM Category WHERE isDefault = false GROUP BY userId;
```

11. Exclusão de conta:
    - Abra `Meus dados`.
    - Toque em excluir conta.
    - Confirme com a senha atual.
    - Mostre que usuário, categorias customizadas e transações foram apagados.

## 6. Fechamento do vídeo

Ao final, fale que:

- O backend está em Express + Prisma.
- O banco usado é MySQL.
- Os dados não ficam mais em memória.
- Categorias, transações e usuários são persistidos no banco.
- Cada usuário acessa somente os próprios dados.
- A collection do Postman está versionada no repositório.
