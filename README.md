# Dota 2 Fantasy — Probability Calculator

Ferramenta para simular operações do Dota 2 Fantasy: configure emblems nos banners (Core, Mid, Support), escolha uma operação e calcule probabilidades de melhora/piora.

Stack: **Vite + TypeScript** (vanilla, sem React).

## Pré-requisitos

- [Node.js](https://nodejs.org/) 20+ (recomendado: 22)

## Comandos

```bash
# Instalar dependências
npm install

# Servidor de desenvolvimento
npm run dev

# Build de produção (gera a pasta dist/)
npm run build

# Preview local do build
npm run preview
```

### URLs locais

| Comando | URL |
|---------|-----|
| `npm run dev` | http://localhost:5173/dota2fantasy/ |
| `npm run preview` | http://localhost:4173/dota2fantasy/ |

> O path `/dota2fantasy/` é o `base` configurado para o GitHub Pages. Local e produção usam o mesmo path.

## Estrutura do projeto

```
├── index.html              # Markup da página
├── src/
│   ├── main.ts             # Entry point
│   ├── app.ts              # UI, DOM, event listeners
│   ├── probability.ts      # Lógica de probabilidade (regras do jogo)
│   ├── types.ts            # Tipos TypeScript
│   └── styles.css          # Estilos
├── vite.config.ts
├── DESIGN.md               # Referência de layout e terminologia da UI
└── .github/workflows/      # Deploy automático no GitHub Pages
```

## Deploy (GitHub Pages)

O deploy é automático via GitHub Actions a cada push na branch `main`.

1. Crie o repositório no GitHub (ex.: `dota2fantasy`)
2. Faça push do código para `main`
3. Em **Settings → Pages → Build and deployment**, selecione **GitHub Actions**
4. O site ficará em: `https://<seu-usuario>.github.io/dota2fantasy/`

Se o nome do repositório for diferente, atualize o `base` em `vite.config.ts`:

```ts
export default defineConfig({
  base: '/nome-do-repo/',
});
```

## Debug no console

Helpers expostos em `window.dotaFantasy`:

```js
dotaFantasy.getAppState()           // estado atual (stage + banners)
dotaFantasy.logAppState()           // loga o estado
dotaFantasy.calculateOperationProbability({ ... })  // cálculo manual
```

## Documentação da UI

Veja [DESIGN.md](./DESIGN.md) para classes CSS, estrutura do HTML e terminologia.
