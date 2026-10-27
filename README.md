# Sistema de Vendas da Sbørnia

Trabalho da disciplina **Programação de Software Aplicado** — Exercício *TypeScript e Serviços REST*.

**Grupo:** _(preencher com os nomes dos integrantes, máximo 3)_

O repositório contém as duas partes exigidas pelo enunciado:

| Parte | Pasta | Tecnologia |
|---|---|---|
| Serviços REST (backend) | `src/` + `pom.xml` | Java, Spring Boot, Spring Data JPA, Bean Validation, H2 |
| Cliente de console que consome os serviços | `cliente-ts/` | TypeScript, Node.js (fetch nativo) |

---

## 1. Situação-problema

A Sbørnia vende em grandes superfícies comerciais, apenas para usuários cadastrados. As compras presenciais usam terminais antigos: leitor de código de barras, teclado e impressora, **sem monitor**. O sistema guarda produtos (código, descrição, estoque, preço unitário, categoria) e usuários (identificador, nome, data de nascimento, número de dependentes) em banco relacional.

O valor de cada item é `quantidade × preço unitário + impostos`, com as regras:

| Regra | Descrição |
|---|---|
| i | Alimentícios: 5% |
| ii | Automotivos: 30% |
| iii | Bebidas alcoólicas: 100% |
| iv | Demais categorias: 17% (novas faixas podem ser adicionadas) |
| v | Usuários com mais de 60 anos não pagam imposto, exceto bebidas alcoólicas |
| vi | Usuários com mais de 3 dependentes têm 50% de desconto no imposto, exceto bebidas alcoólicas |

---

## 2. Arquitetura

```
┌──────────────────────────┐   HTTP/JSON   ┌───────────────────────────────────────────┐
│  cliente-ts (console)    │ ────────────▶ │  Backend Java (Spring Boot, porta 8080)   │
│                          │               │                                           │
│  terminal.ts  (operador) │               │  controller  →  service  →  repository    │
│  demo.ts      (roteiro)  │ ◀──────────── │                    │                      │
│  api.ts       (cliente)  │               │                 imposto (Strategy +       │
│  cupom.ts     (impressão)│               │                 Decorator + Factory)      │
└──────────────────────────┘               │                    │                      │
                                           │                 H2 (JPA)                  │
                                           └───────────────────────────────────────────┘
```

### 2.1 Backend Java

| Pacote | Responsabilidade |
|---|---|
| `domain` | Entidades JPA `Produto`, `Usuario`, `Venda`, `ItemVenda` e o enum `Categoria`, com validações (`@NotBlank`, `@Past`, `@Positive`, `@PositiveOrZero`) |
| `dto` | `VendaRequestDTO` e `ItemVendaRequestDTO`, o formato de entrada de uma venda |
| `repository` | Interfaces Spring Data JPA |
| `service` | `VendaServiceImpl`: busca usuário e produtos, valida estoque, calcula impostos, baixa o estoque e grava a venda em uma transação |
| `imposto` | Cálculo dos impostos (ver 2.2) |
| `controller` | Endpoints REST (ver seção 3) |

### 2.2 Cálculo de impostos

- **Strategy** — uma classe por categoria (`ImpostoAlimenticio`, `ImpostoAutomotivo`, `ImpostoBebidaAlcoolica`, `ImpostoPadrao`), cada uma com sua alíquota. Todas são `@Component`.
- **Decorator** — `IsencaoIdosoCalculadoraImposto` (regra v) e `DescontoDependentesCalculadoraImposto` (regra vi) envolvem a estratégia e aplicam os benefícios, ignorando-os para bebidas alcoólicas.
- **Factory** — `CalculadoraImpostoFactory` recebe todas as estratégias injetadas pelo Spring, decora cada uma e devolve a calculadora da categoria. Categorias sem estratégia própria usam a de `OUTROS` (17%).

**Nova faixa de imposto:** basta adicionar o valor no enum `Categoria` e criar uma classe `@Component` que implemente `CalculadoraImpostoStrategy`. Nenhuma outra classe muda (princípio aberto/fechado).

### 2.3 Cliente TypeScript

| Arquivo | Responsabilidade |
|---|---|
| `tipos.ts` | Interfaces que espelham o JSON das entidades e DTOs Java |
| `api.ts` | Classe `SborniaApi`: um método por endpoint, usando `fetch`. Converte respostas de erro em `ErroApi` com o status HTTP e a mensagem do servidor |
| `cupom.ts` | Formata vendas, produtos e usuários como texto impresso, já que o terminal não tem monitor (requisito a) |
| `terminal.ts` | Simulação interativa do terminal de venda: o operador informa o usuário, lê os códigos de barras, digita quantidades e recebe o cupom |
| `demo.ts` | Roteiro automático que cadastra dados, registra vendas cobrindo todas as regras de imposto, testa os erros e **confere** o imposto devolvido pelo backend com o esperado pelo enunciado |

---

## 3. Endpoints REST

Base: `http://localhost:8080`

| Método | Caminho | Descrição | Respostas |
|---|---|---|---|
| GET | `/usuarios` | Lista usuários | 200 |
| GET | `/usuarios/{id}` | Busca usuário | 200, 404 |
| POST | `/usuarios` | Cadastra usuário | 201, 400 |
| GET | `/produtos` | Lista produtos | 200 |
| GET | `/produtos/{codigo}` | Busca produto pelo código de barras | 200, 404 |
| POST | `/produtos` | Cadastra produto | 201, 400 |
| POST | `/vendas` | Registra venda e calcula impostos | 201, 400 (dados inválidos ou estoque insuficiente), 404 (usuário/produto inexistente) |
| GET | `/vendas/{id}` | Consulta venda | 200, 404 |

Exemplos de corpo:


json
POST /usuarios
{ "nome": "Kraunus Sang", "dataNascimento": "1990-05-20", "numeroDependentes": 1 }

POST /produtos
{ "codigo": "7891000100103", "descricao": "Arroz 5kg", "quantidadeEstoque": 100,
  "precoUnitario": 20.00, "categoria": "ALIMENTICIO" }

POST /vendas
{ "usuarioId": 1, "itens": [ { "produtoCodigo": "7891000100103", "quantidade": 2 } ] }


Categorias aceitas: `ALIMENTICIO`, `AUTOMOTIVO`, `BEBIDA_ALCOOLICA`, `OUTROS`.

---

## 4. Como executar

### Pré-requisitos
- JDK 26 (versão definida em `maven.compiler.source` no `pom.xml`) e Maven
- Node.js 18 ou superior

### 4.1 Backend

```bash
mvn spring-boot:run
```

O servidor sobe em `http://localhost:8080`. O banco H2 é em memória, então começa vazio a cada execução. O console do H2 fica em `http://localhost:8080/h2-console` (JDBC URL `jdbc:h2:mem:sbornia`, usuário `sa`, sem senha).

### 4.2 Cliente TypeScript (em outro terminal)

```bash
cd cliente-ts
npm install
npm run demo        # roteiro automático com todas as regras
npm run terminal    # terminal de venda interativo
```

Para apontar para outro endereço: `SBORNIA_API_URL=http://outro-host:8080 npm run demo`.

Com o banco vazio, rode `npm run demo` primeiro (ele cadastra usuários e produtos) ou cadastre pelo menu do terminal.

---

## 5. Cenários da demonstração

Produtos cadastrados: Arroz (alimentício, R$ 20), Óleo de motor (automotivo, R$ 40), Vinho (bebida alcoólica, R$ 50) e Caderno (outros, R$ 10).

| Cenário | Usuário | Itens | Imposto esperado |
|---|---|---|---|
| Regras i–iv | 35 anos, 1 dependente | 1 de cada | 1,00 + 12,00 + 50,00 + 1,70 = **64,70** |
| Regra v | 70 anos, 0 dependentes | 2 arroz, 1 vinho | 0,00 + 50,00 = **50,00** |
| Regra vi | 40 anos, 4 dependentes | 2 óleos, 3 cadernos, 1 vinho | 12,00 + 2,55 + 50,00 = **64,55** |
| Regras v + vi | 65 anos, 5 dependentes | 1 caderno, 1 vinho | 0,00 + 50,00 = **50,00** |
| Erro | — | vinho × 9999 | HTTP 400, estoque insuficiente |
| Erro | usuário 999999 | — | HTTP 404 |
| Erro | — | produto inexistente | HTTP 404 |
| Erro | nome vazio, data futura, dependentes negativos | — | HTTP 400 |

Ao final, o roteiro informa se todas as verificações passaram.

### Exemplo de cupom

```
================================================
        SUPERFÍCIE COMERCIAL DA SBØRNIA
                 CUPOM DE VENDA
================================================
Venda nº 3   26/10/2026, 22:51:04
Cliente: Maestro Pletskaya (id 3)
Idade: 40   Dependentes: 4
------------------------------------------------
7891000200204  Óleo de motor 1L
  [AUTOMOTIVO]
  2 x 40,00                                80,00
  Imposto (15%)                            12,00
  Total do item                            92,00
...
------------------------------------------------
Subtotal (sem impostos)                   160,00
Impostos                                   64,55
TOTAL A PAGAR                             224,55
================================================
```

---

## 6. Decisões e limitações

- O cliente é de console, como permite o enunciado, e imprime tudo como texto para representar a impressora do terminal.
- O cliente não tem dependências de execução: usa o `fetch` nativo do Node.js. TypeScript e `@types/node` são só dependências de desenvolvimento.
- `server.error.include-message=always` foi habilitado no backend para que o cliente mostre mensagens como "Estoque insuficiente para o produto: ...".
- A regra "mais de 60 anos" é estrita: quem tem exatamente 60 anos ainda paga imposto. O mesmo vale para "mais de três dependentes".
- Compras pela internet estão fora do escopo, conforme o enunciado.
