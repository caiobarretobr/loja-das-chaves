# Loja das Chaves

A Loja das Chaves é um sistema web de agendamento e gestão operacional para uma loja especializada em serviços de chaves, fechaduras, portões, amolação, carimbos e acessórios relacionados. O projeto foi pensado para simplificar o atendimento ao cliente, reduzir a necessidade de contato manual e centralizar a gestão da agenda e dos serviços em uma única interface.

A aplicação combina um frontend moderno em React com uma API serverless na Vercel e integração com Firebase para autenticação e persistência de dados. O objetivo é permitir que clientes agendem o atendimento em poucos passos, enquanto o proprietário da loja acompanha os pedidos, bloqueia datas e revisa a agenda por meio de um painel administrativo.

## Visão geral

O sistema foi criado para resolver um problema comum de pequenos negócios locais: a agenda era organizada de forma manual, com muita conversa por WhatsApp e pouca visibilidade da disponibilidade real. Com a plataforma, a loja consegue:

- disponibilizar serviços em uma página intuitiva e responsiva;
- permitir que clientes escolham serviço, data e horário;
- armazenar agendamentos em um banco seguro;
- bloquear datas ou horários indisponíveis;
- notificar a loja sobre novos agendamentos;
- enviar lembretes automáticos para clientes;
- manter uma área administrativa para gerenciar o fluxo da operação.

## Como funciona

### Fluxo do cliente

1. O cliente acessa a página inicial da loja.
2. Visualiza os serviços disponíveis e as categorias de atendimento.
3. Escolhe o tipo de serviço desejado.
4. Seleciona uma data e um horário disponível na agenda.
5. Confirma os dados do atendimento.
6. O agendamento é salvo no sistema.
7. A loja recebe a notificação e o cliente pode receber lembretes antes do horário.

### Fluxo da loja

1. O responsável acessa o painel administrativo com senha configurada.
2. Pode visualizar os agendamentos confirmados.
3. Pode concluir, cancelar ou reabrir horários.
4. Pode bloquear datas inteiras ou intervalos específicos.
5. Acompanha relatórios e atividades da agenda.

## Funcionalidades principais

- Agendamento online com interface mobile-first
- Gestão de disponibilidade por dia e horário
- Categorias de serviços com preços e descrições
- Painel administrativo para controle da agenda
- Bloqueio manual de datas e turnos
- Notificações por WhatsApp e push web
- Autenticação de clientes com Firebase
- Lembretes de atendimento via cron/serverless
- Relatórios e acompanhamento de atendimentos

## Stack tecnológica

### Frontend

- React 19
- Vite
- Material UI (MUI)
- i18next para internacionalização/idioma do app
- CSS customizado para layout responsivo

### Backend e infraestrutura

- Vercel Serverless Functions
- Firebase Firestore para persistência
- Firebase Authentication para login de clientes
- Node.js 20+

### Comunicação e automação

- Web Push para notificações no navegador
- WhatsApp via integração do backend
- Lógica de lembretes automatizados por endpoint serverless

### Bibliotecas relevantes

- `firebase`
- `web-push`
- `jspdf`
- `react-i18next`
- `@mui/material`

## Como foi criada

O projeto foi desenvolvido como uma solução específica para uma loja local, com foco em rapidez de uso, simplicidade operacional e acessibilidade em celular. A criação partiu da necessidade de automatizar o processo de agendamento e reduzir a dependência de comunicação manual por mensagens.

A arquitetura foi pensada em camadas:

- frontend responsivo para atender clientes em qualquer dispositivo;
- API serverless para processar agendamentos e regras de negócio;
- banco de dados para persistência e consulta de reservas;
- painel administrativo para controle do dono da loja;
- notificações para manter a equipe informada em tempo real.

Além disso, a estrutura do projeto foi organizada em features para facilitar manutenção e expansão, como:

- agendamento
- autenticação de conta
- administração
- integração de push
- serviços compartilhados

## Estrutura do projeto

```text
.
├── api/                     # Funções serverless da Vercel
├── public/                  # Arquivos estáticos públicos
├── src/                     # Código do frontend React
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── i18n/
│   └── main.jsx
├── server/                  # Helpers e utilitários do backend
├── scripts/                 # Scripts operacionais e utilitários
├── index.html               # Entrada principal do Vite
├── vite.config.js           # Configuração do Vite
├── vercel.json              # Configuração do deploy na Vercel
├── package.json             # Dependências e scripts do projeto
├── .nvmrc                   # Versão do Node recomendada
├── .env.local               # Variáveis locais do ambiente
├── README.md                # Documentação do projeto
└── firestore.rules          # Regras de segurança do Firestore
```

## Requisitos

- Node.js 20 ou superior
- Conta no Vercel
- Projeto Firebase com Firestore e Authentication habilitados
- Chaves VAPID para notificações push
- Variáveis de ambiente configuradas corretamente

## Variáveis de ambiente

O projeto utiliza variáveis de ambiente para conectar frontend, backend e serviços externos. Em desenvolvimento local, normalmente elas são configuradas em `.env.local`.

Exemplos de variáveis esperadas:

- `VITE_API_BASE_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `ADMIN_PASSWORD`
- `ADMIN_SECRET`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `BARBERGS_BASE_URL`
- `BARBERGS_CHECK_SECRET`

Para gerar as chaves VAPID:

```bash
npx web-push generate-vapid-keys
```

## Como rodar localmente

1. Instale as dependências:

```bash
npm install
```

2. Use a versão correta do Node:

```bash
nvm use 20
```

3. Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

4. Para testar as funções serverless do Vercel localmente:

```bash
vercel dev
```

## Scripts disponíveis

```bash
npm run dev      # inicia o frontend em modo de desenvolvimento
npm run build    # gera build de produção
npm run preview  # serve o build localmente
npm run lint     # valida o código com ESLint
```

## Deploy

O projeto é pensado para ser hospedado na Vercel, com funções serverless e frontend em uma mesma estrutura principal. Para deploy correto, é importante que a versão do Node seja compatível com o Vite e com as dependências do projeto.

Recomendação:

- Node 20.x
- deploy na Vercel com ambiente de produção configurado
- variáveis de ambiente adicionadas no painel da Vercel

## Benefícios do sistema

- melhora o atendimento da loja;
- reduz perda de tempo na gestão de agenda;
- facilita a organização dos serviços;
- melhora a experiência do cliente;
- centraliza a operação em uma plataforma moderna e escalável.

## Observações finais

Este projeto representa uma solução prática para empresas locais que precisam digitalizar a gestão de agenda e atendimento sem depender de ferramentas complexas ou caras. O foco está em simplicidade, rapidez e eficácia operacional, mantendo a experiência do cliente amigável e a rotina da loja bem organizada.

Se você quiser expandir o projeto no futuro, os próximos passos naturais são:

- integrar pagamentos;
- criar fila de atendimento por categoria;
- armazenar histórico mais completo de clientes;
- adicionar mais relatórios e dashboards;
- melhorar a automação de lembretes e feedbacks.
