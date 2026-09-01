# MVP3 - Requisitos da terceira etapa da aplicação de agendamento da Loja das Chaves

## 1. Visão geral

Este documento define os requisitos do MVP 3 da aplicação de agendamento da Loja das Chaves. Ele complementa o MVP 1 e o MVP 2 e consolida as alterações solicitadas na documentação de modificações do catálogo e da experiência do cliente.

O objetivo do MVP 3 é ajustar a interface, a organização das categorias, os fluxos de agendamento para produtos e serviços, a apresentação visual das imagens e a experiência de uso em dispositivos móveis e desktop, com foco em clareza para o cliente e eficiência na operação administrativa.

## 2. Objetivo do produto

Aprimorar a solução para:

- refletir a nomenclatura atualizada das seções da loja;
- dividir melhor os serviços e produtos em categorias claras;
- corrigir imagens ausentes e revisar a apresentação visual dos itens;
- automatizar a transição de etapas no fluxo de agendamento;
- disponibilizar melhor suporte para seleção de data e horário;
- melhorar a comunicação com o cliente e a gestão do administrador;
- reforçar a identidade visual da marca da loja.

## 3. Escopo do MVP 3

### 3.1 Inclusos no MVP 3

- renomeação de seções conforme a nova estrutura da loja;
- divisão da página inicial em duas partes: serviços e produtos;
- correção de imagens de carimbos e itens sem imagem;
- ajuste de fluxo para avançar automaticamente ao selecionar um item;
- atualização de textos de data e horário conforme o tipo de agendamento;
- alteração da lógica de disponibilidade por mês e de confirmação de agendamentos;
- inclusão de imagens ilustrativas por seção;
- inserção de vídeo institucional abaixo do endereço;
- ajuste de cor da marca principal para azul turquesa.

### 3.2 Fora do escopo do MVP 3

- pagamento online integrado;
- login de cliente;
- painel administrativo com múltiplos perfis complexos;
- integrações avançadas de CRM ou ERP;
- gestão automatizada de estoque;
- app nativo para Android ou iOS;
- criação de novas regras de negócio fora do contexto da documentação de modificação.

## 4. Ajustes de nomenclatura e estrutura da loja

### 4.1 Renomeação de seções

As seguintes seções devem ser renomeadas:

- "linha trodat" para "Carimbos linha Trodat";
- "linha nykon" para "Carimbos linha Nykon".

### 4.2 Divisão da primeira etapa de escolha

Ao iniciar o processo de agendamento, a tela de seleção deve conter duas partes separadas:

#### Parte 1 - Agende um serviço

Deve conter as seguintes categorias:

- Amolação de ferramentas
- Chaves de carro
- Fechaduras em geral
- Portões

#### Parte 2 - Produtos disponíveis

Deve conter as seguintes categorias:

- Carimbos linha Trodat
- Carimbos linha Nykon
- Diversos
- Tintas e almofadas para carimbo

Essa divisão deve deixar claro para o cliente que existem dois tipos de pedido: serviço e produto, com funções, textos e organização visual distintos.

## 5. Correções de imagens e catálogo visual

### 5.1 Imagens ausentes em carimbos linha Trodat

Na seção "Carimbos linha Trodat", os produtos abaixo devem receber imagens corretas:

- Trodat 3911 - coral
  - caminho: ./imagens/carimbos/linha-trodat-3911/coral.png
- Trodat 3911 - laranja neon
  - caminho: ./imagens/carimbos/linha-trodat-3911/laranja.png

Essas imagens devem ser carregadas no ambiente de produção do Vercel e exibidas corretamente na aplicação em execução.

### 5.2 Produtos sem imagem em "Diversos"

A seção "Diversos" deve receber imagens para os itens abaixo:

- Carimbos personalizados
  - caminho: ./imagens/carimbopersonalizado.png
- Carimbos de madeira
  - caminho: ./imagens/carimbomadeira.png

### 5.3 Imagens das seções principais

As seguintes seções devem conter imagem ilustrativa correta:

- Amolação de ferramentas
  - caminho: ./imagens/secao/amolacao.jpg
- Carimbos linha Trodat
  - caminho: ./imagens/secao/carimbostrodat.png
- Carimbos linha Nykon
  - caminho: ./imagens/secao/carimbosnykon.jpg
- Chaves de carro
  - caminho: ./imagens/secao/chavesdecarro.jpeg
- Fechaduras em geral
  - caminho: ./imagens/secao/fechadurasemgeral_.jpg
- Portões
  - caminho: ./imagens/secao/portoes.png

Regras:

- as imagens devem ser carregadas no ambiente de produção do Vercel;
- devem manter boa proporção visual e harmonia com o layout;
- caso necessário, ajustar tamanho ou crop para que a interface permaneça visualmente equilibrada.

## 6. Ajustes de fluxo e usabilidade

### 6.1 Avanço automático ao selecionar item

Quando o cliente escolher uma seção e, em seguida, o produto ou serviço desejado, o sistema deve avançar automaticamente para a próxima etapa, sem exigir clique adicional em "confirmar".

Regras:

- a seleção do item deve funcionar como continuidade do fluxo;
- a navegação deve ser direta e intuitiva;
- a etapa seguinte deve solicitar dados do cliente imediatamente.

### 6.2 Texto de orientação para data e horário

Conforme o tipo de agendamento, o texto exibido deve variar:

- para serviços:
  - "Agende a data e hora disponíveis"
- para produtos:
  - "Escolha o dia e horário que você vai para retirada:"

Esse texto deve aparecer no momento em que o cliente escolhe a data e o horário.

### 6.3 Botão de notificação do cliente

No painel administrativo, o botão "Notificar cliente" deve:

- abrir diretamente o link do WhatsApp do cliente;
- levar ao contato do cliente com a mensagem pronta;
- enviar automaticamente a mensagem:
  - "Seu pedido já está pronto! Pode vir buscar."

Além disso, logo abaixo do item na lista, deve aparecer a observação:

- "OBS: O botão notificar cliente serve para aqueles que fizeram o pedido de um produto"

## 7. Ajustes de data e horário

### 7.1 Disponibilidade por mês

A aplicação deve exibir todos os dias disponíveis para agendamento do mês atual e do próximo mês.

Regras:

- o cliente deve enxergar datas do mês atual e do mês seguinte;
- o sistema deve continuar respeitando a disponibilidade real do calendário;
- a lógica de exibição deve facilitar a escolha sem bloquear o cliente em um único mês.

### 7.2 Reclassificação de agendamentos no painel administrativo

Quando um agendamento for confirmado pelo administrador em um mês posterior ao da data original, o registro deve ser contabilizado no mês atual do relatório, mesmo que a data de serviço tenha sido planejada no mês anterior.

Regra de negócio:

- o agendamento deve ser incluído no relatório do mês em que a confirmação ocorreu;
- a data do serviço não deve impedir o registro no período administrativo correto;
- isso assegura que os relatórios mensais reflitam a operação efetiva da loja.

## 8. Melhoria de identidade visual e comunicação

### 8.1 Vídeo na parte inferior da página

Abaixo do endereço da loja, deve aparecer uma miniatura de vídeo.

Regras:

- ao clicar na miniatura, o vídeo deve abrir em uma visualização maior;
- o cliente deve poder fechar o vídeo a qualquer momento; 
- ao fechar, a aplicação retorna ao estado normal.

Link do vídeo:

- https://imgur.com/a/D5y2qbr#WJZo3mW

### 8.2 Alteração da cor da marca

O nome "LOJA DAS CHAVES" deve ter a cor azul turquesa, com visual mais elegante e alinhado à identidade da marca.

Regras:

- a cor principal do nome deve ser turquesa;
- a mudança deve manter harmonização com o restante da interface;
- o ajuste deve ser aplicado sem quebrar legibilidade em mobile e desktop.

## 9. Requisitos funcionais do MVP 3

### 9.1 Página inicial

A aplicação deve exibir a nova divisão de categorias em duas seções principais:

1. Agende um serviço
2. Produtos disponíveis

Além disso, deve manter:

- identidade visual da loja;
- layout responsivo;
- navegação clara;
- foco em conversão e agendamento rápido.

### 9.2 Fluxo de agendamento de serviços

O cliente deve poder:

- escolher a parte da loja correspondente ao seu interesse;
- selecionar o tipo de serviço ou produto;
- visualizar a próxima etapa sem clique extra de confirmação;
- preencher nome e telefone;
- escolher data e hora disponíveis;
- concluir o agendamento.

### 9.3 Fluxo de agendamento para produtos

Para produtos, as regras devem considerar:

- o cliente pode buscar retirada em data e horário específicos;
- a mensagem de orientação deve refletir a intenção de retirada;
- o acompanhamento administrativo deve diferenciar produtos de serviços.

### 9.4 Painel administrativo

O painel administrativo deve continuar funcionando com as regras previamente definidas no MVP 1 e MVP 2, com os ajustes do MVP 3:

- notificar cliente por WhatsApp quando o produto estiver pronto;
- classificar o pedido conforme seu tipo;
- manter a consistência dos registros por mês;
- manter a visão de datas e disponibilidade atualizada.

## 10. Regras de negócio do MVP 3

1. A primeira etapa da aplicação deve separar serviços e produtos em blocos distintos.
2. O cliente deve selecionar o item desejado e seguir diretamente para a próxima etapa.
3. A interface deve indicar a intenção de retirada para produtos e a intenção de agendamento para serviços.
4. As datas exibidas devem cobrir o mês atual e o próximo mês.
5. Os agendamentos confirmados em meses diferentes devem ser reportados de acordo com o mês de confirmação.
6. Os itens sem imagem devem receber imagens oficiais da loja ou do catálogo atual.
7. O botão de notificação do cliente deve abrir WhatsApp com a mensagem correta.
8. O vídeo institucional deve permanecer acessível sem quebrar a experiência da navegação.
9. A identidade visual da marca deve manter leitura, contraste e boa estética.

## 11. Critérios de aceitação

A entrega do MVP 3 será considerada concluída quando:

- a página inicial estiver dividida em "Agende um serviço" e "Produtos disponíveis";
- os nomes das seções estiverem atualizados;
- as imagens dos itens sem imagem estiverem funcionando corretamente;
- o fluxo de agendamento avançar automaticamente ao selecionar um item;
- os textos de data/hora estiverem apropriados para cada tipo de pedido;
- o cliente puder receber os ajustes de notificação e retirada conforme as regras;
- o painel administrativo refletir corretamente os pedidos confirmados por mês;
- o vídeo e a identidade visual da marca estiverem presentes e ajustados.

## 12. Resumo executivo

O MVP 3 consolida uma etapa de refinamento da plataforma, focando em organização visual, clareza de navegação, correção de catálogo e ajustes estratégicos de UX. O objetivo principal é transformar a aplicação em uma vitrine mais profissional, com fluxo mais rápido, melhor comunicação e maior aderência à operação real da Loja das Chaves.
