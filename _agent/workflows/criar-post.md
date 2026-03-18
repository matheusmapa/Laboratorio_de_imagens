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

### 6. Geração Autônoma vs Imagens Reais (Real Asset Protocol) 📸
Sempre preste atenção à intenção do usuário sobre imagens:

**A. Se o usuário quiser INSPIRAÇÃO / CLONAR uma referência:**
1.  Use sua ferramenta nativa `generate_image` para criar renders 3D Premium ou illustrations dos personagens/objetos base, garantindo fundos limpos (ex: branco sólido).
2.  Use o script `node scripts/fetch-asset.js "URL_DA_NET" "C:\...\destino.png"` para baixar texturas remotas.
3.  Use o script **crucial** `node scripts/remove-bg.js "C:\...\img.png" "C:\...\img-nobg.png"` para isolar/recortar o objeto via NPU local. 

**B. Se o usuário fornecer uma IMAGEM REAL (ex: Foto de um cliente, Logo exato) e exigir USÁ-LA:**
1. Peça ao usuário para arrastar o arquivo físico para a pasta `public/posts/NNN-slug/assets/` do projeto local.
2. **REGRA DE OURO:** NUNCA use `generate_image` para sobrescrever essa imagem ou "melhorá-la". Apenas injete a tag `HTML` correspondente: `<img src="assets/nome-da-foto-real.png">` no código. O usuário não quer um avatar 3D substituindo a foto do pai ou do paciente dele!

### 7. O Pulo do Gato para IAs (Integração com o Live Editor) 🎨
**Aviso Crítico para Agentes:** O Laboratório de Imagens possui um **Editor Visual (Live Editor) embuitido nativamente no frontend** com Ferramentas de Seleção, Resize Bounding Boxes em CSS, Drag-and-Drop Físico com compensação de offset, e inputs reativos de Fonte/Cor com Undo/Redo (Ctrl+Z).
**Isso significa que:** Você **NÃO** precisa gastar seu tempo / loops de ferramenta tentando adivinhar e iterar pixels perfeitos de `top` ou `left` durante a geração. Posicione os containers e imagens Absolutas (ou Relativas) de forma aproximada e harmonicamente correta. Se concentre firmemente na *Engenharia de Prompt das Imagens 3D* e no HTML/CSS modular limpo. Comunique ao usuário que ele pode ajustar a tipografia, alterar o texto final, escalar e mover qualquer card fotograficamente 100% pelo mouse no painel dele! O usuário tem autonomia.

### 8. Verificação do Resultado
Avise o usuário. Sugira ele testar abrindo a galeria (http://localhost:5173), clicando no post e acessando o Editor Automágico para ajustar livremente os itens. Lembre-o também de usar o Drag-and-Drop segurando `Shift` se ele precisar forçar a proporção das fotos geradas.
