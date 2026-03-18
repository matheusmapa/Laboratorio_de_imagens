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
Adicione seu novo post ao fim do Array no arquivo `C:\Laboratorio_de_imagens\public\posts\registry.json`. Use a propriedade `"id": "NNN-slug"`. Cuidado para inserir a propriedade `"category": "NomeDaPasta"` caso crie subpastas.

### 6. Geração Autônoma e Cloning (Motor de Fogo) 🔥
Se o usuário anexar uma **imagem de referência** e pedir para clonar ou criar algo similar:
1.  Use sua ferramenta nativa `generate_image` para criar renders 3D Premium ou illustrations dos personagens/objetos base, garantindo fundos limpos (ex: branco sólido).
2.  Use o script `node scripts/fetch-asset.js "URL_DA_NET" "C:\...\destino.png"` para baixar texturas/wallpapers remotos sem precisar do usuário.
3.  Use o script **crucial** `node scripts/remove-bg.js "C:\...\img.png" "C:\...\img-nobg.png"` para isolar/recortar o objeto (usando Inteligência Artificial e a NPU local do usuário). 
4.  Insira as imagens recém-criadas no HTML do slide usando **posicionamento Absoluto** com z-index avançado, filtros de Drop Shadow pesados e recrie os textos por cima para simular a imersão visual e bater 100% de paridade com o estilo da referência.

### 7. Verificação do Resultado
Avise o usuário. Sugira ele testar abrindo a galeria (http://localhost:5173), clicando no post e visualizando os botões de navegação, dots na barra inferior e também verificando a exportação `.png`.
