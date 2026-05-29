# Gestão Financeira Mobile

Aplicativo mobile para controle financeiro pessoal, desenvolvido com **React Native/Expo** no frontend e **Node.js + Express + Prisma + MySQL** no backend.

O projeto permite que cada usuário gerencie suas próprias receitas, despesas, categorias e dados pessoais de forma separada, com autenticação, recuperação de senha por e-mail, resumo mensal e exportação para Excel.

## Projeto em Destaque

### Aplicativo de Gestão Financeira

O foco deste repositório é o app em:

- **Frontend mobile:** [`praticas/gestao-financeira`](./praticas/gestao-financeira)
- **Backend API:** [`praticas/gestao-financeira-api`](./praticas/gestao-financeira-api)

## Principais Funcionalidades

- Cadastro e login de usuários.
- Recuperação de senha por token enviado por e-mail.
- Dados isolados por usuário.
- Edição de dados pessoais.
- Exclusão de conta com confirmação e senha atual.
- Cadastro, edição e exclusão de categorias personalizadas.
- Categorias padrão protegidas contra alteração.
- Separação entre receitas e despesas.
- Lançamento, edição e exclusão de transações.
- Resumo mensal por categoria.
- Gráfico de despesas.
- Exportação do resumo mensal em Excel.
- Consulta de CEP via ViaCEP.
- Estados e cidades oficiais via API do IBGE.

## Tecnologias

### Mobile

- React Native
- Expo
- Expo Router
- React Context API
- React Native Chart Kit
- Expo File System
- Expo Sharing

### Backend

- Node.js
- Express
- Prisma ORM
- MySQL
- Zod
- Nodemailer
- ExcelJS

## Estrutura

```text
IESB-SUL-PDM/
├── praticas/
│   ├── gestao-financeira/       # Aplicativo mobile Expo
│   └── gestao-financeira-api/   # API REST com Express, Prisma e MySQL
├── aulas/                       # Conteúdos acadêmicos da disciplina
└── README.md
```

## Como Rodar

### 1. API

```bash
cd praticas/gestao-financeira-api
npm install
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

Crie um arquivo `.env` na pasta da API com:

```env
DATABASE_URL="mysql://USUARIO:SENHA@localhost:3306/gestao_financeira"
PORT=3000

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@dominio.com
SMTP_PASS=sua-senha-de-app
MAIL_FROM="Gestão Financeira <seu-email@dominio.com>"
```

### 2. Aplicativo

```bash
cd praticas/gestao-financeira
npm install
npx expo start -c
```

Configure o arquivo `.env` do app:

```env
EXPO_PUBLIC_API_URL=http://IP_DA_SUA_MAQUINA:3000
```

Para celular físico, o IP precisa ser o endereço do computador na mesma rede Wi-Fi.

## Banco de Dados

O projeto usa **MySQL** com Prisma. As principais entidades são:

- `User`
- `Category`
- `Transaction`

Cada transação e categoria personalizada pertence a um usuário específico. Categorias padrão ficam disponíveis para todos, mas não podem ser editadas ou removidas.

## Segurança

- Senhas são salvas com hash.
- Recuperação de senha usa token temporário.
- O token expira em 15 minutos.
- Exclusão de conta exige a senha atual.
- Dados financeiros são filtrados por usuário autenticado.

## Exportação

O resumo mensal pode ser exportado em `.xlsx`, permitindo que o usuário use seus dados em planilhas como Excel, Google Sheets ou LibreOffice.

## Autor

Desenvolvido por **Elias Cordeiro** para a disciplina de Programação para Dispositivos Móveis.

GitHub: [Elijah-IESB](https://github.com/Elijah-IESB)
