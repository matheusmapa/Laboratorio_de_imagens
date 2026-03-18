# Laboratório de Imagens — Instruções para IA 🧪

Olá, IA! Este projeto é um **laboratório de criação de imagens via código**. Você cria posts em HTML/CSS puro que o usuário depois baixa como PNG pelo navegador.

**ATENÇÃO: Este projeto acabou de adotar a arquitetura "Casca + Recheio" modular.**

## A Arquitetura (Casca + Recheio)

```
C:\Laboratorio_de_imagens\
├── public/posts/              ← VOCÊ SÓ MEXE AQUI DENTRO
│   ├── viewer.html            ← A "Casca" (NÃO MEXER: faz carousel, export, scaling)
│   ├── registry.json          ← O Catálogo de posts (atualizar sempre)
│   ├── 001-post-exemplo/      ← Cada post é uma PASTA (o "Recheio")
│   │   ├── post.json          ← Metadados do post
│   │   └── slides/
│   │       ├── slide-1.html   ← HTML+CSS PURO, apenas o visual do slide
│   │       └── slide-2.html
│   └── 00N-nome-novo/         ← O post que você vai criar
├── src/                       ← NÃO MEXER
└── index.html                 ← NÃO MEXER
```

**O pulo do gato:**
A plataforma cuida de **tudo** que é chato (carrossel, exportação PNG, escalonamento no navegador, links).
Você **NUNCA** mexe no `viewer.html` ou tenta reimplementar botões de download. Seu único trabalho é criar o **HTML e CSS visual puro** de cada slide e salvá-los soltos na pasta `slides/`.

**SUPER PODER: Shadow DOM** 🛡️
O `viewer.html` injeta cada slide dentro de um **Shadow DOM** isolado (`attachShadow({mode: 'open'})`).
Isso significa que **seu CSS nunca vai vazar para o slide vizinho**, e o CSS visual do app nunca vai afetar o seu slide. Você tem liberdade total para criar classes super genéricas e curtas (ex: `.card`, `.box`, `.title`, `.h2`) dentro da sua tag `<style>` sem nenhum medo de colisão. Cada slide é um universo perfeitamente selado.

**SUPER PODER 2: Live Editor Nativo** 🎨
A plataforma possui um fantástico **Live Editor** de Drag-and-Drop, Bounding Box (Scale com Aspect Ratio Fix), e Text Inspector. 
Portanto, a IA **NÃO** precisa ficar perdendo tempo rodando dezenas de iterações de teste alterando 1 ou 2 pixels de `top`/`left` para perfeccionismo de posicionamento! O projeto confia na autonomia do usuário humano para ajustar o micro-layout arrastando os itens na tela ou esticando as bordas. Entregue um design harmonioso e informe o usuário de que a partir daquele momento ele tem o volante para as edições micro (texto, cores, posição fina) usando a interface (http://localhost:5173).

---

## Políticas do Projeto e Git (O CMS é Local-First) 🔒
Este projeto atua como um CMS em Flat-File. O usuário quer que seus posts fiquem apenas salvos em seu HD, sem ir para o Github de forma pública.
- A pasta `public/posts/*` está intencionalmente barrada no `.gitignore` e não deve ser commitada.
- Seu foco como IA ao editar posts novos criados dinamicamente é APENAS o FileSystem. Não execute comandos do Git para "salvar os posts", nós salvamos localmente no disco dele. O Git está reservado apenas para atualizações estruturais do motor (Vite, CSS global, Regras).

---

## Como Criar Um Post — Passo a Passo

### 1. Nomenclatura e Pasta
Leia o `registry.json` para descobrir o próximo número. Crie a pasta `public/posts/NNN-nome-curto/`.

### 2. Criar `post.json`
Dentro da pasta do post, crie o arquivo `post.json` com os metadados:
```json
{
  "title": "Título Bonito",
  "format": "1080x1350",
  "slides": 5
}
```
*Formatos: 1080x1350 (retrato/padrão), 1080x1080 (quadrado), 1080x1920 (story).*

### 3. Criar os Arquivos HTML dos Slides
Crie `public/posts/NNN-nome-curto/slides/slide-1.html` (até o `slide-N.html`).
Dentro deles, **NÃO coloque `<html>`, `<head>`, ou `<body>`**. Coloque apenas o seu container em tamanho real:

```html
<style>
/* CSS Fica aqui em cima, escopado ao maximo possível */
.h1-titulo { font-family: 'Inter', sans-serif; font-size: 80px; font-weight: 900; color: white; }
</style>

<!-- A TAG RAIZ DEVE TER O SIZE ABSOLUTO DO FORMATO (Ex: 1080x1350) E O BG -->
<div style="width:1080px; height:1350px; background:#000000; position:relative; overflow:hidden;">
    <!-- Seu design incrivel entra aqui -->
    <h1 class="h1-titulo">Meu Post</h1>
</div>
```
A IA renderizadora (Playwright) vai extrair extamente essa div em escala 1:1 e tirar print. Use fontes do Google via `@import` no CSS se necessário. Abuse de gradientes, sombras, emojis e glassmorphism!

### 4. Atualizar `registry.json`
Registre seu post no array principal para jogar pro dashboard:
```json
{
  "id": "NNN-nome-curto",
  "title": "Título Bonito",
  "description": "Descrição do post.",
  "format": "1080x1350",
  "slides": 5,
  "date": "2026-03-05",
  "tags": ["dica", "vendas"]
}
```

---

## Dicas de Layout para o "Recheio" 🎨
- Se você tiver um slide com Header (ex: Logo) no topo e Footer (ex: Progresso) embaixo, e quiser centralizar o conteúdo perfeitamente no meio matemático da tela, encapsule esse conteúdo (textos, cards) em uma `div` intermediária flexível (`class="main-content"`) contendo `flex: 1; display: flex; flex-direction: column; justify-content: center;`.
- Não ocupe o espaço usando `margin-top: 150px` absoluto, isso pode gerar resultados espremidos.
- Sempre assuma largura e altura absolutas (ex. 1080x1350) para a tag "raiz" do slide.

## O que NÃO Fazer 🚫
- NUNCA coloque scripts de exportação (ex: `html2canvas`) em um post. O sistema já faz isso rodando Chrome Server-side.
- NUNCA crie arquivos únicos monolíticos (ex: `003-meu-post.html`). Eles estão deprecados. Agora tudo é **Pastas**.
- NUNCA cole o código do carousel, botões navigation `(‹, ›)` ou dots. O `viewer.html` engole o seu HTML automaticamente e faz isso por você.

É isso! Crie layouts incríveis. 🚀
