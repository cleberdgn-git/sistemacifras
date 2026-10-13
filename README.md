# 🎵 Louvor Cifras - Sistema de Gerenciamento & Visualizador de Palco

Sistema completo desenvolvido com **Next.js 14**, **React 18**, **Tailwind CSS** e **Lucide React**, focado em alta performance e experiência mobile para ministérios de louvor e músicos.

---

## 🚀 Como Executar o Projeto

1. Certifique-se de que o Node.js está instalado.
2. No terminal, execute:
   ```bash
   npm run dev
   ```
3. Abra [http://localhost:3000](http://localhost:3000) no seu navegador ou acesse pelo celular na mesma rede local.

---

## 🎸 Funcionalidades Principais

### 1. Gerenciador de Repertório (Biblioteca)
- **Cadastro Completo de Músicas:** Título, Artista/Ministério, Tom e texto completo da Cifra.
- **Persistência via LocalStorage:** Todas as músicas criadas ou editadas são salvas automaticamente no navegador do usuário.
- **Músicas Pré-carregadas:** Músicas de exemplo prontas para uso imediato (*"Bondade de Deus"*, *"A Casa É Sua"*, *"Porque Ele Vive"*).
- **Busca Rápida e Filtros:** Pesquisa instantânea por título, artista ou tom musical.
- **Edição e Exclusão:** Controle total das cifras cadastradas.

### 2. Criação Dinâmica de Setlist (Culto)
- **Checkboxes Ágeis:** Seleção com toque facilitado para montar a lista do culto de hoje.
- **Seleção em Massa:** Botões para selecionar todas ou desmarcar todas as músicas.
- **Barra Flutuante / Destaque "Iniciar Setlist":** Botão fixo inferior que indica o total de músicas selecionadas e entra instantaneamente no **Modo Palco**.

### 3. Modo Visualizador (Modo Palco)
- **Alinhamento Perfeito com `<pre>` e `font-mono`:** Espaçamentos e posições de acordes rigorosamente preservados sobre a letra.
- **Destaque Visual de Acordes:** Identificação inteligente de acordes e cabeçalhos de seções (`[Intro]`, `[Refrão]`, etc.) para leitura rápida no escuro.
- **Dark Mode Nativo (`#121212`):** Alto contraste, fundo ultra escuro para economizar bateria e não cansar a vista sob iluminação de palco.
- **Controle Dinâmico de Fonte:** Botões de fácil acesso `A-` e `A+` para ajustar a visualização de acordo com a distância do pedestal ou celular/tablet.
- **Modo Tela Cheia (Fullscreen API):** Remove barras do navegador e distrações durante o louvor com um clique.
- **Navegação Sequencial:** Botões grandes de "Anterior" e "Próxima" com contador `"1 de 5"`.
- **Gaveta Rápida da Ordem do Culto:** Permite saltar para qualquer música caso o líder ou pastor altere a sequência na hora.
- **Auto-Scroll Inteligente:** Rolagem contínua para deixar as mãos dos músicos 100% livres nos instrumentos.
- **Transposição de Tom (+ / -):** Ajuste de semitons em tempo real caso o tom precise ser adaptado.
- **Atalhos de Teclado:** Setas `←` e `→` para trocar de música, barra de espaço para auto-scroll.

---

## 📁 Estrutura de Arquivos

```
src/
├── app/
│   ├── globals.css          # Estilos globais, tema dark #121212 e resets
│   ├── layout.tsx           # Configuração de viewport mobile e MusicProvider
│   └── page.tsx             # Alternância entre Gerenciador e Visualizador
├── components/
│   ├── Navbar.tsx           # Barra superior com branding e tema
│   ├── SongList.tsx         # Listagem, busca, seleção e barra flutuante de setlist
│   ├── SongModal.tsx        # Modal de adição e edição de cifras com modelo
│   ├── SetlistViewer.tsx    # Modo palco: <pre>, fullscreen, auto-scroll, fontes
│   └── ThemeToggle.tsx      # Alternador claro/escuro com Lucide icons
├── context/
│   └── MusicContext.tsx     # Gerenciamento de estado global e LocalStorage
├── data/
│   └── initialSongs.ts      # Repertório inicial de exemplo formatado
├── types/
│   └── song.ts              # Tipagens TypeScript (Song, ViewMode, etc.)
└── utils/
    └── chordUtils.ts        # Utilitários de identificação e transposição de acordes
```

