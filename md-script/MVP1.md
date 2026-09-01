# MVP1 - Requisitos da aplicação de agendamento da Loja das Chaves

## 1. Visão geral

Este documento define os requisitos do MVP 1 da aplicação de agendamento para a Loja das Chaves. O objetivo é permitir que clientes escolham um serviço, preencham seus dados, selecionem data e horário disponíveis e concluam o agendamento com uma experiência simples, rápida e totalmente em português.

A solução deve priorizar:

- simplicidade de uso;
- baixo custo de operação;
- responsividade em mobile e desktop;
- fácil manutenção;
- integração com WhatsApp para comunicação e notificações;
- administração mínima, mas funcional, para acompanhamento dos agendamentos.

## 2. Objetivo do produto

Criar uma vitrine de serviços e fluxo de agendamento online para uma loja de chaves, fechaduras, carimbos e serviços relacionados, permitindo:

- apresentar os serviços em categorias;
- captar o interesse do cliente;
- coletar dados de contato;
- verificar disponibilidade por dia e hora;
- confirmar agendamento;
- notificar a loja sobre o pedido;
- manter registro administrativo dos pedidos.

## 3. Escopo do MVP

### 3.1 Inclusos no MVP

- Página inicial com identidade visual da loja;
- Navegação de serviços por categorias;
- Seleção de serviço e confirmação do pedido;
- Formulário com nome, telefone e observações;
- Escolha de data disponível conforme regra de negócio;
- Escolha de horário disponível;
- Confirmação final do agendamento;
- Notificação para o administrador via WhatsApp;
- Painel administrativo com autenticação simples;
- Listas de pedidos agendados, cancelados e finalizados;
- Visualização de meses anteriores no painel administrativo.

### 3.2 Fora do escopo do MVP

- pagamento online;
- login de cliente;
- múltiplos usuários administrativos com perfis diferentes;
- dashboard analítico avançado;
- integração com ERP ou CRM;
- automação de lembretes complexos;
- no-code ou CMS completo;
- app nativo para Android/iOS.

## 4. Principais personas

### 4.1 Cliente da loja

- Busca agendar um serviço de forma simples;
- Quer evitar ligações e filas;
- Prefere um fluxo rápido em celular;
- Gostaria de saber se o horário está disponível de forma clara.

### 4.2 Administrador da loja

- Precisa verificar os agendamentos em um painel simples;
- Deseja saber rapidamente quem agendou, qual serviço foi solicitado e em qual data/hora;
- Precisa responder, cancelar, finalizar ou editar pedidos;
- Recebe notificações de WhatsApp quando um novo pedido entra.

## 5. Requisitos funcionais

### 5.1 Página inicial

A aplicação deve exibir:

- logo da loja;
- nome da loja;
- navegação centralizada;
- layout responsivo e horizontal em desktop;
- informações de contato e redes sociais no rodapé.

### 5.2 Seleção de serviço

O cliente deve percorrer um fluxo em etapas:

1. Escolha da categoria de serviço;
2. Visualização dos serviços disponíveis daquela categoria;
3. Seleção do serviço desejado;
4. Confirmação para continuar.

Regras:

- a página inicial deve mostrar as categorias de serviços;
- ao clicar em uma categoria, a tela deve mostrar uma lista vertical de serviços;
- cada item deve conter imagem ilustrativa, nome, descrição curta e preço estimado;
- ao selecionar um serviço, o item deve receber destaque visual;
- o cliente deve confirmar a escolha antes de prosseguir.

### 5.3 Formulário de dados do cliente

Após confirmar o serviço, o usuário deve preencher:

- nome completo;
- telefone;
- descrição/opcional ou observações sobre o serviço desejado.

Regras:

- todos os campos devem ser validados no frontend e no backend;
- telefone deve seguir formato brasileiro;
- o campo de descrição deve aceitar texto livre, opcional.

### 5.4 Seleção de data

Depois do formulário, o cliente deve escolher uma data.

Regras:

- a lista de datas deve cobrir do dia atual até o fim do mês atual;
- somente devem aparecer dias de terça, quarta e quinta, conforme regra definida no produto;
- cada bloco de data deve mostrar o nome do dia e o número do dia/mes;
- a cor do bloco deve refletir a disponibilidade:
  - azul: data com disponibilidade normal;
  - laranja: data com apenas uma hora disponível;
  - invisível: data sem horários disponíveis.

### 5.5 Seleção de horário

Após selecionar a data, o cliente deve escolher um horário disponível.

Regras:

- os horários disponíveis devem ser 08:00 e 10:00;
- somente um horário por dia deve estar disponível por cliente ao mesmo tempo;
- se um horário já foi agendado, o outro horário restante deve continuar disponível para o próximo cliente;
- o fluxo deve apresentar somente horários válidos e disponíveis.

### 5.6 Confirmação do agendamento

Ao confirmar o horário, o sistema deve:

- registrar o agendamento;
- cadastrar o serviço solicitado;
- persistir nome, telefone, descrição e data/hora;
- enviar notificação ao administrador no WhatsApp;
- apresentar mensagem de sucesso para o cliente.

Mensagem esperada:

> Agendamento confirmado e a loja notificada! 5 min antes do horário do serviço que você marcou, você será notificado com uma mensagem!

Ao final, o cliente deve poder clicar em "OK" para reiniciar o fluxo.

### 5.7 Notificações via WhatsApp

O sistema deve notificar o administrador sempre que houver um novo pedido.

Formato da mensagem:

- "Novo pedido feito por {Primeiro nome}!"
- "Acesse no site {URL do app} para ver mais detalhes"
- "● Nome: {Nome completo}"
- "● Phone: {Telefone}"
- "● Serviço: {Serviço}"
- "● Descrição: {Descrição do cliente}"

Integração:

- usar a API CallMeBot;
- o texto deve ser construído dinamicamente com os dados do agendamento;
- a URL de envio deve seguir o padrão da documentação da API utilizada.

### 5.8 Painel administrativo

O painel administrativo deve exigir autenticação simples com senha definida como:

- rafa123

Acesso disponível:

- "Serviços agendados";
- "Pedidos cancelados";
- "Pedidos finalizados (mês atual)";
- seção "Meses passados".

#### 5.8.1 Lista de serviços agendados

Cada item da lista deve exibir:

- nome do cliente;
- telefone;
- descrição;
- data e hora;
- serviço;
- valor total estimado.

Cada item deve permitir ações:

- Cancelar pedido;
- Entrar em contato;
- Finalizar pedido;
- Editar.

Regras de negócio:

- ao cancelar, o pedido deve ser movido para a lista de cancelados;
- ao entrar em contato, o administrador deve ser direcionado para WhatsApp do cliente usando o número informado;
- ao finalizar, o pedido deve ser incluido na lista de pedidos finalizados do mês atual;
- ao editar, o administrador deve conseguir alterar data e hora usando as datas e horários permitidos.

#### 5.8.2 Lista de pedidos cancelados

- deve armazenar todos os pedidos cancelados;
- a lista deve ser limpa no primeiro dia de cada mês.

#### 5.8.3 Lista de pedidos finalizados (mês atual)

- todo mês a lista deve ser renovada;
- os pedidos finalizados do mês devem ficar disponíveis para consulta;
- mês anterior deve ser movido para a seção de meses passados.

#### 5.8.4 Seção de meses passados

- deve conter um seletor de meses com registros existentes;
- cada opção deve representar um mês passado com ao menos um pedido registrado.

## 6. Regras de negócio

1. O cliente deve escolher um serviço antes de continuar.
2. O nome e o telefone são obrigatórios.
3. A seleção de serviço e a escolha da data/hora devem ser registradas no mesmo fluxo.
4. Somente dias específicos devem ser disponibilizados ao cliente.
5. A disponibilidade por hora deve ser controlada por data.
6. Cada agendamento deve possuir status: agendado, cancelado, finalizado.
7. A cada novo agendamento, o administrador deve receber notificação via WhatsApp.
8. Agendamentos com mais de 7 dias devem ser considerados automaticamente como cancelados no processo administrativo, conforme regra de negócio.
9. O sistema deve manter a consistência das listas de pedidos conforme o estado do agendamento.

## 7. Dados e estrutura mínima de persistência

### 7.1 Entidade agendamento

Campos mínimos:

- id
- clienteNome
- clienteTelefone
- descricao
- servicoId ou servicoNome
- categoria
- valorEstimado
- data
- hora
- status
- createdAt
- updatedAt

### 7.2 Entidade serviço

Campos mínimos:

- id
- nome
- categoria
- descricao
- precoEstimado
- imagem

### 7.3 Entidade disponibilidade

Campos mínimos:

- dia
- horariosDisponiveis
- horariosReservados

## 8. Requisitos não funcionais

### 8.1 Usabilidade

- interface simples e intuitiva;
- linguagem 100% em português do Brasil;
- fluxo visual claro em etapas;
- componentes com contraste suficiente para acessibilidade básica;
- experiência pensada para uso em celular e desktop.

### 8.2 Manutenção

- código organizado por funcionalidades;
- uso de componentes reutilizáveis;
- documentação mínima para setup e operação;
- baixo acoplamento entre frontend, API e regras de negócio.

### 8.3 Segurança

- manter senha do admin em ambiente seguro;
- não expor lógica administrativa ao cliente;
- validar dados tanto no frontend quanto no backend;
- proteger endpoints com regras adequadas de acesso.

### 8.4 Performance

- carregamento rápido da página principal;
- respostas rápidas para consulta de disponibilidade;
- uso de estratégias leves para não aumentar custo e complexidade.

### 8.5 Custo

- preferir arquitetura serverless e serviços gratuitos;
- evitar dependências pesadas e soluções de alto custo;
- manter stack compatível com Vercel + Firebase/Firestore ou solução equivalente de baixo custo.

## 9. Tecnologias esperadas para o MVP

Conforme a stack definida no projeto, a solução deve usar:

- React para frontend;
- JavaScript como linguagem principal;
- Vite para desenvolvimento do front-end;
- Material UI ou Chakra UI para componentes visuais;
- serverless functions para APIs;
- Firebase Firestore para armazenamento dos registros;
- Vercel para hospedagem e deploy;
- WhatsApp via CallMeBot para notificações;
- tradução/localização em português.

## 10. Critérios de aceite do MVP

### 10.1 Fluxo do cliente

- o cliente consegue visualizar as categorias de serviços;
- consegue selecionar um serviço;
- consegue preencher nome, telefone e observação;
- consegue escolher uma data disponível;
- consegue escolher um horário disponível;
- consegue concluir o agendamento com retorno visual de sucesso.

### 10.2 Fluxo administrativo

- o admin consegue entrar com a senha definida;
- vê os agendamentos pendentes;
- consegue cancelar, entrar em contato, finalizar ou editar um pedido;
- consegue navegar entre listas de status;
- consegue consultar registros de meses passados.

### 10.3 Notificação

- um novo pedido dispara mensagem para o WhatsApp do administrador;
- a mensagem contém nome, telefone, serviço e observação do cliente.

### 10.4 Responsividade

- a aplicação funciona corretamente em celular, tablet e desktop;
- o fluxo é legível e usável sem quebra de layout.

## 11. Entregáveis do MVP1

- frontend de agendamento responsivo;
- listagem de categorias e serviços;
- formulário de dados do cliente;
- fluxo de seleção de data e horário;
- persistência de agendamentos;
- painel administrativo básico;
- integração com WhatsApp para avisos;
- documentação técnica inicial da solução.

## 12. Riscos e observações

- a regra de disponibilidade por dia/horário deve ser robusta para evitar conflitos;
- a notificação via WhatsApp deve ser tratada com erros e retries simples;
- os dados de telefone devem ser validados para evitar inputs inválidos;
- a senha do administrador deve estar protegida por variáveis de ambiente;
- a estrutura de dados deve ser simples para reduzir manutenção.

## 13. Resumo executivo

O MVP1 tem como propósito entregar um agendamento funcional e confiável para a Loja das Chaves, sem exagerar em complexidade. A proposta prioriza conveniência para o cliente, controle para o administrador e operação acessível em termos de custo e manutenção, alinhada ao stack atual do projeto e às melhores práticas do desenvolvimento moderno.
