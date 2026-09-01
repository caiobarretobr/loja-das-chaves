# MVP2 - Requisitos da segunda etapa da aplicação de agendamento da Loja das Chaves

## 1. Visão geral

Este documento define os requisitos do MVP 2 da aplicação de agendamento da Loja das Chaves. Ele complementa o MVP 1 e incorpora as alterações solicitadas na documentação de modificação do catálogo, estrutura de serviços, regras de visualização, horários e identidade visual.

O objetivo do MVP 2 é evoluir a vitrine de serviços para refletir o catálogo real da loja, com melhor organização por categorias, serviços novos, ajustes de preço e descrição, novas formas de agendamento para produtos específicos de carimbo, além de refinamentos visuais e operacionais que aumentem a clareza para o cliente e a eficiência da gestão da loja.

## 2. Objetivo do produto

Ampliar a solução para:

- refletir o catálogo atualizado da loja;
- incluir novos serviços e remover itens obsoletos;
- trabalhar com categorias de carimbo em fluxo específico;
- mostrar produtos com imagens ilustrativas conforme o tipo de serviço;
- informar corretamente o horário de funcionamento;
- manter a identidade visual alinhada com a marca da loja;
- melhorar a experiência de agendamento em dispositivos móveis e desktop.

## 3. Escopo do MVP 2

### 3.1 Inclusos no MVP 2

- atualização de preços, nomes e descrições dos serviços existentes;
- inclusão de novos serviços em chaves, fechaduras e portões;
- remoção de itens obsoletos e da seção de carimbos antiga;
- criação de novas categorias e subcategorias para carimbos;
- fluxo de agendamento específico para seleção de seção, modelo e cor do carimbo;
- exibição de imagens ilustrativas para os produtos;
- apresentação do horário de funcionamento abaixo do endereço da loja;
- ajuste visual do nome principal da aplicação para azul elegante.

### 3.2 Fora do escopo do MVP 2

- pagamento online integrado;
- login de clientes;
- múltiplos perfis administrativos complexos;
- CRM ou ERP integrado;
- controle financeiro detalhado;
- gestão automatizada de estoque de produtos físicos;
- app nativo para Android ou iOS.

## 4. Ajustes no catálogo de serviços

### 4.1 Alteração de preços, nomes e descrições

Os serviços abaixo devem ser alterados apenas quando houver instrução explícita de modificação. A aplicação deve respeitar exatamente o que foi informado, sem alterar serviços não listados.

#### Seção: Amolação de ferramentas
- Tesoura
  - novo preço: 10
- Faca
  - novo preço: 10

#### Seção: Chaves de carro
- Confecção de chave simples
  - novo preço: "A partir de 250"
  - novo nome: Cópia de chave simples
- Confecção de chave canivete
  - novo preço: "A partir de 450"
  - novo nome: Cópia de chave canivete
- Limpeza de chaves
  - novo preço: 50
- Programação de chip
  - novo preço: "A partir de 200"
- Confecção de chave com telecomando
  - novo preço: "a partir de 450"
- Troca de pilha
  - novo preço: 25
  - nova descrição: "substituição da pilha em chave automotiva no geral."
- Troca de botão
  - novo preço: 50
- Troca de segredo
  - novo preço: 200
  - novo nome: Troca de segredo para remoção e instalação
- Troca de carcaça canivete
  - novo preço: "200 no cartão | 180 no pix ou a vista"
- Capa de silicone
  - novo preço: 50
- Corte de lâminas
  - novo preço: 70
  - novo nome: Corte de lâminas modelo yale
- Alarme simples
  - nova descrição: "Configuração básica de alarme automotivo simples."
- Troca de carcaça
  - novo preço: "A partir de 70"
  - novo nome: Troca de carcaça de telecomando
- Capas de silicone
  - novo preço: 50
  - nova descrição: "Capas de telecomando de silicone para proteção e melhor pegada da chave."

#### Seção: Fechaduras em geral
- Abertura de cofre
  - novo preço: 200
  - novo nome: "Abertura de cofre (Só abertura)"
- Abertura de cadeados
  - novo preço: 50
- Unificação de segredo
  - novo preço: 120
- Manutenção de fechadura
  - novo preço: 70
- Instalação de fechadura
  - novo preço: "A partir de 120"

#### Seção: Portões
- Controle para portão eletrônico
  - novo preço: 80 reais

### 4.2 Adição de novos serviços

Os serviços abaixo devem ser adicionados às respectivas seções, preservando o padrão visual e textual da aplicação.

#### Seção: Chaves de carro
- Troca de segredo
  - preço: 150
- Corte de lâminas modelo pantográfica
  - preço: 100
- Cópia de controle
  - preço: "a partir de 80"
- Controle novo
  - preço: "a partir de 70"
- Manutenção em controle
  - preço: "a partir de 30 reais"

#### Seção: Fechaduras em geral
- Abertura de cofres + descobrir senha
  - preço: 300
- Abertura + descobrir senha + confecção de chaves
  - preço: 400

#### Seção: Portões
- Controle para portão eletrônico
  - preço: 80
- Cópia de controle
  - preço: "a partir de 80"
- Controle novo
  - preço: "a partir de 70"
- Pilha para controle de portão eletrônico
  - preço: 25
- Manutenção em controle
  - preço: "a partir de 30"

### 4.3 Remoção de serviços e seções

Deve ser aplicada a seguinte limpeza de catálogo:

- remover dos serviços da seção Chaves de carro:
  - Cópias(50)
  - codificação(200)
  - alarmes(220)
- remover a seção inteira: Carimbos

## 5. Novas categorias e fluxos de agendamento

### 5.1 Regras gerais para as novas seções

As novas seções devem ser adicionadas com uma estrutura clara, em minúsculas, respeitando o seguinte comportamento:

- escolher seção;
- escolher o modelo do carimbo;
- escolher a cor do carimbo;
- preencher dados e adicionar descrição;
- escolher horário e data;
- confirmar agendamento.

Essas seções devem permitir a inserção manual de imagens pelo responsável da loja. A aplicação deve aceitar imagens ilustrativas configuradas por item ou categoria.

### 5.2 Seção 1 - Carimbos Linha Trodat

Esta seção deve seguir o fluxo específico de seleção por modelo e cor.

#### 1.1 Linha Trodat 3911
- Nome da subseção: linha trodat 3911
- Preço de todas as cores: 50
- Descrição: "CARIMBO AUTOMÁTICO. Impressão: 3,5 x 1,3cm"
- Cores:
  - pastel verde - imagem: ./imagens/carimbos/linha-trodat-3911/pastelverde.png
  - pastel rosa - imagem: ./imagens/carimbos/linha-trodat-3911/pastelrosa.png
  - pastel lilas - imagem: ./imagens/carimbos/linha-trodat-3911/pastelilas.png
  - pastel azul - imagem: ./imagens/carimbos/linha-trodat-3911/pastelazul.png
  - coral - imagem: ./imagens/carimbos/linha-trodat-3911/coral.png
  - branco - imagem: ./imagens/carimbos/linha-trodat-3911/branco.png
  - azul - imagem: ./imagens/carimbos/linha-trodat-3911/azul.png
  - vermelho - imagem: ./imagens/carimbos/linha-trodat-3911/vermelho.png
  - preto - imagem: ./imagens/carimbos/linha-trodat-3911/preto.png
  - rosa - imagem: ./imagens/carimbos/linha-trodat-3911/rosa.png
  - verde maçã - imagem: ./imagens/carimbos/linha-trodat-3911/verdemaca.png
  - amarelo - imagem: ./imagens/carimbos/linha-trodat-3911/amarelo.png
  - lilás - imagem: ./imagens/carimbos/linha-trodat-3911/lilas.png
  - laranja neon - imagem: ./imagens/carimbos/linha-trodat-3911/laranja.png
  - rosa neon - imagem: ./imagens/carimbos/linha-trodat-3911/rosaneon.png

#### 1.2 Linha Trodat 4911
- Nome da subseção: linha trodat 4911
- Preço de todas as cores: 60
- Descrição: "CARIMBO AUTOMÁTICO. Impressão: 1,4 x 3,8 cm"
- Cores:
  - preto - imagem: ./imagens/carimbos/linha-trodat-4911/preto.png
  - verde - imagem: ./imagens/carimbos/linha-trodat-4911/verde.png
  - branco - imagem: ./imagens/carimbos/linha-trodat-4911/branco.png
  - cinza - imagem: ./imagens/carimbos/linha-trodat-4911/cinza.png
  - branco fechado - imagem: ./imagens/carimbos/linha-trodat-4911/brancofechado.png
  - rosa - imagem: ./imagens/carimbos/linha-trodat-4911/rosa.png
  - azul - imagem: ./imagens/carimbos/linha-trodat-4911/azul.png
  - vermelho - imagem: ./imagens/carimbos/linha-trodat-4911/vermelho.png
  - rosa neon - imagem: ./imagens/carimbos/linha-trodat-4911/rosaneon.png
  - laranja neon - imagem: ./imagens/carimbos/linha-trodat-4911/laranjaneon.png
  - verde limão neon - imagem: ./imagens/carimbos/linha-trodat-4911/verdelimaoneon.png
  - azul pastel - imagem: ./imagens/carimbos/linha-trodat-4911/azulpastel.png
  - creme pastel - imagem: ./imagens/carimbos/linha-trodat-4911/cremepastel.png
  - coral pastel - imagem: ./imagens/carimbos/linha-trodat-4911/coralpastel.png
  - rosa pastel - imagem: ./imagens/carimbos/linha-trodat-4911/rosapastel.png
  - verde pastel - imagem: ./imagens/carimbos/linha-trodat-4911/verdepastel.png

#### 1.3 Linha Novo Pocket Print Trodat
- Nome da subseção: linha novo pocket print trodat
- Preço de todas as cores: 55
- Descrição: "CARIMBO POCKET TRODAT. Impressão 3,8 x 1,4 mm"
- Cores:
  - azul céu - imagem: ./imagens/carimbos/pocket-print/azulceu.png
  - cinza - imagem: ./imagens/carimbos/pocket-print/cinza.png
  - lilaz preto - imagem: ./imagens/carimbos/pocket-print/lilazpreto.png
  - preto - imagem: ./imagens/carimbos/pocket-print/preto.png
  - rosa preto - imagem: ./imagens/carimbos/pocket-print/rosapreto.png
  - rosa turquesa - imagem: ./imagens/carimbos/pocket-print/rosaturquesa.png
  - verde maçã - imagem: ./imagens/carimbos/pocket-print/verdemaca.png
  - vermelho - imagem: ./imagens/carimbos/pocket-print/vermelho.png

### 5.3 Seção 2 - Carimbos Linha Nykon

#### 2.1 Linha Nykon Power Black 301
- Nome da subseção: linha nykon power black 301
- Preço de todas as cores: 45
- Descrição: "CARIMBO AUTOMÁTICO. Impressão: 1,0 x 2,7 cm"
- Cores:
  - amarelo - imagem: ./imagens/carimbos/nykon-301/amarelo.png
  - azul - imagem: ./imagens/carimbos/nykon-301/azul.png
  - azul bebê - imagem: ./imagens/carimbos/nykon-301/azulbebe.png
  - rosa bebê - imagem: ./imagens/carimbos/nykon-301/rosabebe.png
  - lilás - imagem: ./imagens/carimbos/nykon-301/lilas.png
  - laranja - imagem: ./imagens/carimbos/nykon-301/laranja.png
  - vermelho - imagem: ./imagens/carimbos/nykon-301/vermelho.png
  - cinza - imagem: ./imagens/carimbos/nykon-301/cinza.png
  - preto - imagem: ./imagens/carimbos/nykon-301/preto.png
  - branco - imagem: ./imagens/carimbos/nykon-301/branco.png
  - verde - imagem: ./imagens/carimbos/nykon-301/verde.png
  - violeta - imagem: ./imagens/carimbos/nykon-301/violeta.png

#### 2.2 Linha Nykon Power Black 302
- Nome da subseção: linha nykon power black 302
- Preço de todas as cores: 55
- Descrição: "CARIMBO AUTOMÁTICO. Impressão: 1,4 x 3,8 cm"
- Cores:
  - cinza - imagem: ./imagens/carimbos/nykon-302/cinza.png
  - amarelo - imagem: ./imagens/carimbos/nykon-302/amarelo.png
  - reciclado - imagem: ./imagens/carimbos/nykon-302/reciclado.png
  - azul - imagem: ./imagens/carimbos/nykon-302/azul.png
  - branco - imagem: ./imagens/carimbos/nykon-302/branco.png
  - preto - imagem: ./imagens/carimbos/nykon-302/preto.png
  - rosa neon - imagem: ./imagens/carimbos/nykon-302/rosaneon.png
  - verde limão - imagem: ./imagens/carimbos/nykon-302/verdelimao.png
  - azul bebê - imagem: ./imagens/carimbos/nykon-302/azulbebe.png
  - lilás - imagem: ./imagens/carimbos/nykon-302/lilas.png
  - verde - imagem: ./imagens/carimbos/nykon-302/verde.png
  - vermelho - imagem: ./imagens/carimbos/nykon-302/vermelho.png
  - laranja - imagem: ./imagens/carimbos/nykon-302/laranja.png
  - amarelo esverdeado - imagem: ./imagens/carimbos/nykon-302/amarelo.png
  - violeta - imagem: ./imagens/carimbos/nykon-302/violeta.png
  - amadeirado - imagem: ./imagens/carimbos/nykon-302/amadeirado.png
  - rosa pastel - imagem: ./imagens/carimbos/nykon-302/rosapastel.png
  - verde pastel - imagem: ./imagens/carimbos/nykon-302/verdepastel.png
  - azul pastel - imagem: ./imagens/carimbos/nykon-302/azulpastel.png
  - verde esmeralda - imagem: ./imagens/carimbos/nykon-302/verdeesmeralda.png

### 5.4 Seção 3 - Carimbos Diversos

Esta seção deve utilizar o fluxo convencional de agendamento, sem seleção de cor de carimbo.

- Carimbos personalizados
  - imagem: ./imagens/carimbos/carimbopersonalizado.png
  - preço: 20
  - descrição: "para personalizar, entre em contato com a loja"
- Carimbos para tecido
  - descrição: "Kit carimbos para tecidos"
  - preço: 100
  - imagem: ./imagens/carimbo/carimbotecido.png
- Carimbos de madeira
  - preço: 25
  - imagem: ./imagens/carimbos/carimbomadeira.png

### 5.5 Seção 4 - Tintas e almofadas para carimbo

- todas as tintas: 10
- todas as almofadas: a partir de 15

Itens:
- tinta azul
- tinta vermelha
- tinta preta
- almofada azul
- almofada vermelha
- almofada preta

Requisito importante: esta é a única seção que deve receber imagens ilustrativas automaticamente.

### 5.6 Seção 5 - Produtos complementares do catálogo de carimbos

A aplicação deve manter uma categoria de produtos complementares, organizada e pronta para receber materiais, tintas e itens de manutenção do setor de carimbos, com imagens ilustrativas quando houver catálogo disponível.

## 6. Imagens ilustrativas

### 6.1 Regra geral

Para todos os produtos e serviços, exceto os itens já estão descritos com imagens atríbuidos a eles, a aplicação deve adicionar uma imagem meramente ilustrativa. A imagem deve ser escolhida com base no nome e na descrição do produto e deve substituir a logo genérica usada em todos os produtos.

### 6.2 Exceções

A aplicação não deve adicionar imagens automaticamente nas seguintes seções:
- carimbos (linha trodat)
- carimbos (linha nykon)
- carimbos (linha pocket)
- carimbos (tintas e almofadas para carimbo)

### 6.3 Regras para as novas seções de carimbo

- para as 3 primeiras seções com fluxo específico, a imagem deve ser adicionada manualmente pelo responsável da loja;
- as imagens devem representar a cor e o modelo do produto;
- as imagens devem manter um visual simples e consistente com a identidade visual do catálogo;
- os caminhos das imagens devem seguir o padrão definido no catálogo; 
- os nomes dos arquivos e os diretórios devem ser mantidos em minúsculas.

## 7. Horário de funcionamento

Abaixo do endereço da loja, o sistema deve exibir o seguinte texto:

> Horário de funcionamento:
> Segunda a Sexta: 9h às 12h | 13h às 18h
> Sábado: 8h às 12h
> Obs: Não abrimos aos Domingos.

## 8. Identidade visual

### 8.1 Nome principal da aplicação

O nome principal exibido no topo do aplicativo, "Loja das chaves", deve ser renderizado na cor azul, em uma tonalidade elegante e profissional.

### 8.2 Diretrizes visuais

- usar azul como cor principal do cabeçalho e títulos principais;
- manter contraste adequado em fundos claros;
- preservar legibilidade em mobile;
- manter o layout limpo, moderno e facilmente navegável.

## 9. Requisitos funcionais do MVP 2

### 9.1 Catálogo de serviços

A aplicação deve:

- mostrar as categorias em ordem lógica e facilmente identificável;
- listar os serviços com nome, descrição, preço e imagem quando aplicável;
- refletir alterações de preço, nome e descrição sem necessidade de alterar código-fonte de forma manual sempre que o catálogo for atualizado;
- remover itens que foram obsoletos.

### 9.2 Fluxo de carimbos por seção e cor

Para as categorias de carimbo com seleção por modelo e cor, o sistema deve:

1. apresentar a seção de carimbo;
2. exibir o modelo disponível;
3. permitir a escolha da cor;
4. coletar dados do cliente e observações;
5. permitir a escolha de data e horário;
6. confirmar o agendamento.

### 9.3 Novo comportamento de agendamento

O cliente deve seguir um fluxo consistente em todas as categorias, com a diferenciação esperada para peças de carimbo e itens de catálogo regular.

Regras:
- a seleção do serviço deve ocorrer antes da coleta de dados pessoais;
- a descrição do pedido deve ser opcional, mas aceita texto livre;
- o sistema deve registrar corretamente os itens selecionados, incluindo cor e modelo para carimbos;
- o valor exibido deve estar alinhado com a categoria e o produto escolhido.

### 9.4 Sugestão de experiência de usuário

A interface deve destacar:
- preço atualizado;
- descrição clara do serviço;
- categoria correta;
- imagens representativas quando possível;
- distinção visual entre itens de catálogo padrão e itens de seleção por modelo e cor.

## 10. Regras de negócio do MVP 2

1. Todos os serviços exibidos devem refletir o catálogo atualizado da loja.
2. Serviços não mencionados na lista de alteração devem permanecer intactos.
3. A seção Carimbos deve ser removida ou substituída pela nova estrutura de categorias.
4. Produtos de carimbo com modelos e cores compartilhando o mesmo valor devem apresentar o preço de forma consistente.
5. O cliente deve poder escolher entre diferentes modelos e cores em categorias específicas.
6. A imagem de cada item deve ser mantida em diretórios organizados e em nomes padronizados.
7. O cabeçalho principal da aplicação deve manter a identidade da marca com cor azul elegante.
8. O horário de funcionamento deve ficar visível abaixo do endereço da loja.
9. O sistema deve respeitar o processo de agendamento já definido no MVP 1, com os refinamentos do catálogo e da experiência do cliente.

## 11. Entregáveis esperados do MVP 2

- catálogo de serviços atualizado;
- nova organização de categorias e subseções para carimbos;
- serviços adicionados e removidos conforme a regra de negócio;
- imagens e diretórios ajustados;
- fluxo de agendamento refinado para itens de carimbo;
- identidade visual com nome principal em azul elegante;
- informações de funcionamento visíveis ao cliente;
- aplicação pronta para uso com o catálogo real da loja.

## 12. Critérios de sucesso

O MVP 2 será considerado concluído quando:

- o catálogo refletir exatamente os ajustes pedidos;
- os novos serviços e categorias estiverem visíveis e funcionais;
- o fluxo de carimbo estiver claro e organizado por cor/modelo;
- as imagens e textos estiverem alinhados com os produtos reais;
- a interface estiver visualmente consistente com a identidade da loja;
- a loja conseguir atender clientes com serviço e agendamento mais organizados.
