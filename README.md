# Barber GS

Aplicação de agendamento online para a barbearia Barber GS, 100% em português do Brasil, com frontend em React + Vite, interface em Material UI, autenticação administrativa via funções serverless na Vercel e persistência em Firestore.

URL principal de produção: <https://barbergs.vercel.app/>

## Objetivo

Automatizar o agendamento manual de uma barbearia pequena, com apenas 1 barbeiro, para que clientes escolham serviço, data e horário sem precisar conversar diretamente pelo WhatsApp.

## Stack

- Frontend: React, Vite, Material UI, i18next
- Backend/API: Vercel Serverless Functions
- Banco de dados: Firebase Firestore
- Autenticação de clientes: Firebase Authentication
- Notificações: Web Push e CallMeBot WhatsApp
- Hospedagem: Vercel

## Requisitos

- Node.js 20 ou superior
- Projeto Firebase com Firestore habilitado
- Firebase Authentication com provedores Google e e-mail/senha habilitados
- Conta na Vercel

## Variáveis de Ambiente

Copie `.env.example` para `.env.local` no desenvolvimento local e configure os valores reais. Não coloque chaves privadas, senhas ou arquivos de service account no repositório.

- `ADMIN_PASSWORD`: senha do barbeiro
- `ADMIN_SECRET`: chave longa usada para assinar a sessão administrativa
- `FIREBASE_PROJECT_ID`: ID do projeto no Firebase
- `FIREBASE_CLIENT_EMAIL`: e-mail da conta de serviço do Firebase
- `FIREBASE_PRIVATE_KEY`: chave privada da conta de serviço, preservando `\n`
- `VITE_API_BASE_URL`: opcional para apontar o frontend para outro backend
- `VITE_FIREBASE_API_KEY`: chave Web do Firebase para autenticação do cliente
- `VITE_FIREBASE_AUTH_DOMAIN`: domínio Auth do Firebase, como `seu-projeto.firebaseapp.com`
- `VITE_FIREBASE_PROJECT_ID`: ID público do projeto Firebase usado no frontend
- `VITE_FIREBASE_APP_ID`: App ID Web do Firebase
- `VAPID_PUBLIC_KEY`: chave pública para notificações Web Push
- `VAPID_PRIVATE_KEY`: chave privada para notificações Web Push
- `VAPID_SUBJECT`: contato/assunto VAPID, como `mailto:contato@barbergs.vercel.app`
- `BARBERGS_BASE_URL`: URL da produção, recomendado `https://barbergs.vercel.app`
- `BARBERGS_CHECK_SECRET`: segredo usado pelo GitHub Actions para chamar `/api/reminders/check`
- `BARBERGS_TIME_ZONE`: fuso horário usado para interpretar datas e horários da agenda, recomendado `America/Recife`
- `BARBERGS_REMINDER_MINUTES_MIN`: início da janela de lembrete, recomendado `0`
- `BARBERGS_REMINDER_MINUTES_MAX`: fim da janela de lembrete, recomendado `65`

Para gerar as chaves VAPID, rode:

```bash
npx web-push generate-vapid-keys
```

A integração com WhatsApp usa uma URL fixa do CallMeBot no backend:

```text
https://api.callmebot.com/whatsapp.php?phone=558193796278&text=TEST&apikey=7205669
```

Somente o valor de `text` muda quando o sistema envia avisos de planos ou novos agendamentos.

## Firebase Auth

Para o login de clientes funcionar em produção, confirme no Firebase Console:

- O projeto usado nas variáveis `VITE_FIREBASE_*` é o mesmo projeto do backend, como `barbergs-bcd60`.
- Existe um Web App registrado em Project settings > General > Your apps.
- Authentication > Sign-in method tem Google habilitado.
- Authentication > Sign-in method tem Email/Password habilitado, se o cadastro por e-mail será usado.
- Authentication > Settings > Authorized domains inclui `barbergs.vercel.app`.
- Depois de alterar qualquer variável `VITE_FIREBASE_*` na Vercel, faça um novo deploy, porque o Vite embute esses valores no build do navegador.

## Rodando Localmente

```bash
npm install
npm run dev
```

Para testar as funções serverless localmente:

```bash
vercel dev
```

## Scripts

- `npm run dev`: inicia o frontend em modo desenvolvimento
- `npm run build`: gera o build de produção
- `npm run preview`: serve o build localmente
- `npm run lint`: executa ESLint no frontend e nas APIs
- `node scripts/barbergscheck.mjs`: verificador local/manual de notificações e lembretes

## Estrutura

- `src/app`: composição principal da aplicação e tema
- `src/features`: código organizado por feature, incluindo agendamento, conta e painel administrativo
- `src/features/shared`: serviços, constantes e utilitários compartilhados
- `src/i18n`: textos localizados em português do Brasil
- `api`: funções serverless da Vercel
- `api/_lib`: helpers compartilhados pelas funções serverless
- `public`: ativos publicados diretamente pelo Vite
- `images`: imagens originais preservadas do projeto
- `markdown-scripts`: PRDs, descrições e histórico de modificações preservados
- `scripts`: scripts operacionais locais

## Limite de Funções Serverless

O projeto deve permanecer com no máximo 12 funções serverless na Vercel. Hoje há exatamente 12 arquivos deployáveis em `api/`; os helpers em `api/_lib` não contam como endpoints públicos.

Endpoints atuais:

- `/api/agendamentos`
- `/api/bloqueios`
- `/api/clientes/inscricoes`
- `/api/clientes/perfil`
- `/api/disponibilidade`
- `/api/login`
- `/api/planos`
- `/api/push/inscricoes`
- `/api/push/notificar`
- `/api/push/status`
- `/api/relatorios`
- `/api/reminders/check`

## Lembretes em Produção

A produção não depende de cron local para lembrar clientes. O workflow `.github/workflows/check-reminders.yml` chama `POST /api/reminders/check` a cada 30 minutos.

O endpoint verifica agendamentos e atendimentos de planos que começam em até 65 minutos. Para cada item elegível, ele envia um lembrete ao barbeiro via CallMeBot WhatsApp e tenta enviar Web Push ao cliente quando o cliente autorizou notificações no navegador.

Configure estes secrets no GitHub:

- `BARBERGS_BASE_URL`: `https://barbergs.vercel.app`
- `BARBERGS_CHECK_SECRET`: o mesmo valor configurado na Vercel

## Recursos Atuais

- Agendamento responsivo com foco em celular
- Escolha de serviços e planos mensais
- Painel do barbeiro para concluir atendimentos
- Fechamento manual de datas inteiras ou horários específicos, com reativação
- Notificação opcional do barbeiro via CallMeBot
- Conta do usuário com Google ou e-mail/senha para assinatura de planos mensais
- Lista de dispositivos do barbeiro com notificações Web Push para novos agendamentos e lembretes de 1 hora
- Relatórios mensais de atendimentos concluídos

## Referências do Projeto

- `tech-stack.md`: stack recomendada
- `best-practices.md`: práticas de arquitetura, segurança e manutenção
- `markdown-scripts/prd-v1.md`: descrição inicial do produto
- `markdown-scripts/prd-modified.md` e `markdown-scripts/prdv*.md`: evolução dos requisitos
- `markdown-scripts/prices`: planos e combos de serviços
