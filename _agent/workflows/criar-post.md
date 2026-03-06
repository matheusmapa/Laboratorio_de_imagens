---
description: Como criar um novo post no Laboratório de Imagens (Nova Arquitetura Modular)
---

# Criar Post — Workflow

// turbo-all

## Pré-requisitos
Certifique-se de que você leu e entendeu a arquitetura "Casca + Recheio" descrita em `C:\Laboratorio_de_imagens\INSTRUCOES-IA.md`.

## Passos

### 1. Identificar o ID do Post
Inspecione `C:\Laboratorio_de_imagens\public\posts\registry.json` para saber o último número e defina o id `NNN-slug`.

### 2. Criar a Pasta do Post
Crie o diretório base e a pasta de slides:
`C:\Laboratorio_de_imagens\public\posts\NNN-slug\slides\`

### 3. Criar o `post.json`
No diretório raiz do post, crie o arquivo `post.json` com título, formato (ex. 1080x1350) e total de slides. Formatos suportados: 1080x1080, 1080x1350, 1080x1920.

### 4. Criar os Slides Visuais
Para **cada slide**, crie um arquivo HTML solto: `slides/slide-1.html`, `slides/slide-2.html`, etc.
Nele vão conter apenas:
- Uma tag `<style>` com os visuais daquele slide. Como o `viewer.html` renderiza cada poste usando **Shadow DOM**, as suas classes CSS estão 100% isoladas. Você não precisa usar metodologias complexas como BEM (`.slide-2__card--red`), fique livre para usar `.card`, `.box`, etc. O styling não vazará para os outros slides do carrossel.
- Uma `<div>` raiz (ou container único) englobando todo o conteúdo do slide com o estilo `style="width: Wpx; height: Hpx; background: ...; position:relative;"`. 
- Repita o processo até finalizar a quantidade de slides definida em `post.json`.

### 5. Configurar o Dashboard Catálogo
Adicione seu novo post ao fim do Array no arquivo `C:\Laboratorio_de_imagens\public\posts\registry.json`. Use a propriedade `"id": "NNN-slug"` (sem barra nem index). 

### 6. Verificação do Resultado
Avise o usuário. Sugira ele testar abrindo a galeria (http://localhost:5173), clicando no post e visualizando os botões de navegação, dots na barra inferior e também verificando a exportação `.png`.
