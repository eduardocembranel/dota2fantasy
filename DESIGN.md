# Dota 2 Fantasy — UI Design Reference

This document describes the layout and vocabulary of `index.html` so other sessions (or contributors) can work on the page without re-discovering the structure.

**Source files:** `index.html`, `styles.css`, `app.js`

**Language rule:** All user-facing copy and code identifiers are in **English**.

## CSS & Theming Rule (IMPORTANT)

**Never hardcode colors, padding, or margins directly in component classes.** 

All visual theme settings must be extracted to CSS variables in the `:root` pseudo-class at the top of `styles.css`. This ensures that any human or AI contributor can easily tweak the global appearance (e.g., emblem variants, operations panel colors, stage selector colors, banner spacing) without hunting through hundreds of lines of code.

---

## Page overview

The page shows a **dashboard** with three vertical **columns** side by side. Each column represents a Dota 2 **role** and contains one **banner** stacked with **emblems**. Below the dashboard is a **probability simulator** panel for choosing an operation and adjusting improvement/worsening chances.

```
dashboard
├── column (Core)
│   ├── role-title          → "CORE"
│   └── column-banner       → cream vertical banner (pointed bottom)
│       ├── emblem (×5)
│       └── ...
├── column (Mid)
└── column (Support)

global-operations
└── operations-panel
    ├── op-tabs             → Stats | Qualities | Traits
    └── op-content          → grouped operation buttons by color
```

---

## Terminology

| Term | CSS class | Meaning |
|------|-----------|---------|
| **Dashboard** | `.dashboard` | Main horizontal container for all three role columns |
| **Column** | `.column` | One role slot (Core, Mid, or Support) |
| **Role title** | `.role-title` | Large uppercase label above the banner (`Core`, `Mid`, `Support`) |
| **Panel title** | `.panel-title` | Large uppercase label inside the probability simulator (`Probability Simulator`) |
| **Banner** | `.column-banner` | Cream/gold vertical panel with a V-shaped bottom; holds 5 emblems |
| **Emblem** | `.emblem` | One stat card inside a banner |
| **Emblem header** | `.emblem-header` | Darker top strip inside an emblem |
| **Emblem row** | `.emblem-row` | A detail line below the header (quality or trait) |
| **Stage selector** | `.stage-selector` | Controls whether 3 (Group) or 5 (Main) emblems are shown |
| **Operations panel** | `.operations-panel` | Probability simulator: choose an operation, then configure chance inputs below |
| **Full width group** | `.op-group--full-width` | Modifier class on `.op-group` to force it to span the entire row |

---

## What is an emblem?

An **emblem** is a colored card that represents one fantasy stat for that role. Each emblem has:

1. **Header** — stat (attribute) name + total bonus %
2. **Quality row** — emblem quality level (`Tier I` … `Tier V`) + quality bonus %
3. **Trait row** — emblem trait + trait bonus %

> **Quality vs Tier label:** In code and UI we call this row **quality**. The dropdown options still use the in-game labels `Tier I` … `Tier V` because that is the quality level name shown to the player.

### Header (`.emblem-header`)

| Element | CSS | Type | Purpose |
|---------|-----|------|---------|
| **Stat / attribute** | `.emblem-select` | `<select>` dropdown | The stat being tracked (e.g. *Towers*, *GPM*) |
| **Total** | `.emblem-total` | static text | Combined bonus percentage (e.g. `190%`) |

The stat dropdown is wrapped in `.select-wrap` so the chevron sits immediately after the text (same pattern as quality/trait rows).

### Quality row (first `.emblem-row`)

| Element | CSS | Type | Purpose |
|---------|-----|------|---------|
| **Quality** | `.quality-select` | `<select>` dropdown | Quality level: `Tier I` … `Tier V` |
| **Quality bonus** | `.value` | static text | Bonus from quality (e.g. `+60%`) |

### Trait row (second `.emblem-row`)

| Element | CSS | Type | Purpose |
|---------|-----|------|---------|
| **Trait** | `.trait-select` | `<select>` dropdown | Emblem trait (Fractal, Friendly, Benevolent, Vampiric, Unique) |
| **Trait bonus** | `.value` | static text | Bonus from trait (e.g. `+30%`) |

> **Naming summary**
> - **Stat / attribute** = what the emblem measures (`Towers`, `Teamfight`, …)
> - **Quality** = power level of the emblem (`Tier I`–`Tier V` in the dropdown)
> - **Trait** = special modifier on the emblem

Dropdown arrows use a `.select-wrap` wrapper + CSS triangle (`::after`), not a background image on the `<select>`.

---

## Emblem colors

Three color variants:

| Class | Color | Notes |
|-------|-------|-------|
| `.emblem--red` | Dark burgundy | Red emblems |
| `.emblem--green` | Dark forest green | Green emblems |
| `.emblem--blue` | Dark navy blue | Blue emblems |

Each variant defines CSS variables: `--emblem-header-bg`, `--emblem-total`, `--emblem-row`, `--emblem-value`.

### Color order per banner (top → bottom)

**Core** (5 emblems): Red → Green → Red → Green → Red

**Mid** (5 emblems): Red → Blue → Green → Red → Green

**Support** (5 emblems): Blue → Green → Blue → Green → Blue

---

## Probability simulator panel

One shared panel below all banners. The user picks **one operation**, then configures probability inputs (chance to improve, worsen, percentages, etc.) that appear below.

### Tabs

| Tab label | `data-target` / `data-content` | Operations affect |
|-----------|--------------------------------|-------------------|
| **Stats** | `stats` | Emblem stat / attribute |
| **Qualities** | `quality` | Emblem quality |
| **Traits** | `trait` | Emblem trait |

### Groups inside each tab

Operations are grouped by emblem color:

- `.op-group` — vertical stack for one color
- `.op-btn` — action button; left border color matches emblem color via `.op-btn--green`, `.op-btn--red`, `.op-btn--blue`, `.op-btn--other`

Indicator colors are defined in `:root`:

- `--op-green-indicator`
- `--op-red-indicator`
- `--op-blue-indicator`
- `--op-other-indicator`

---

## Current emblem data (placeholders)

Values below are **sample** content in `index.html`.

### Core banner

| # | Color | Stat | Total | Quality | Trait |
|---|-------|------|-------|---------|-------|
| 1 | Red | Towers | 190% | III | Unique |
| 2 | Green | Teamfight | 260% | IV | Fractal |
| 3 | Red | GPM | 310% | V | Fractal |
| 4 | Green | Teamfight | 240% | IV | Unique |
| 5 | Red | Creep Score | 210% | III | Fractal |

### Mid banner

| # | Color | Stat | Total | Quality | Trait |
|---|-------|------|-------|---------|-------|
| 1 | Red | Towers | 280% | V | Unique |
| 2 | Blue | Runes Grabbed | 250% | V | Fractal |
| 3 | Green | Teamfight | 250% | V | Fractal |
| 4 | Red | Kills | 230% | IV | Unique |
| 5 | Green | First Blood | 200% | III | Fractal |

### Support banner

| # | Color | Stat | Total | Quality | Trait |
|---|-------|------|-------|---------|-------|
| 1 | Blue | Smokes Used | 250% | V | Benevolent |
| 2 | Green | Stuns | 190% | I | Fractal |
| 3 | Blue | Lotuses Gained | 220% | III | Fractal |
| 4 | Green | Courier Kills | 200% | III | Benevolent |
| 5 | Blue | Camps Stacked | 170% | II | Fractal |

---

## Dropdown options (current)

### Stat / attribute (`.emblem-select`)

Options depend on **emblem color** (`.emblem--red`, `.emblem--green`, `.emblem--blue`).

**Red** (`.emblem--red`):

- Creep Score
- GPM
- Deaths
- Kills
- Towers
- Madstones Collected

**Green** (`.emblem--green`):

- Teamfight
- Stuns
- Tormentor Kills
- Roshan Kills
- First Blood
- Courier Kills

**Blue** (`.emblem--blue`):

- Wards Placed
- Camps Stacked
- Lotuses Gained
- Watchers Taken
- Runes Grabbed
- Smokes Used

### Quality (`.quality-select`)

Fixed set for all emblems:

- Tier I, Tier II, Tier III, Tier IV, Tier V

### Trait (`.trait-select`)

Fixed set for all emblems:

- Fractal
- Friendly
- Benevolent
- Vampiric
- Unique

**TODO:** Rules for which traits apply per emblem color/context may be added later.

---

## Layout notes

- Banner height fits **5 emblems** with uniform `min-height` (`--emblem-height` in `styles.css`).
- Banner bottom uses `clip-path` for the pointed shape.
- **Spacing** is controlled at the top of `styles.css` in `:root` — see the quick-reference comment block at the file top.
- Emblem header has a darker background and a bottom border separating it from the rows.

### Common spacing tweaks (`styles.css` → `:root`)

| What to change | Variable |
|----------------|----------|
| Gap between Quality and Trait rows | `--space-quality-to-trait` |
| Gap between emblems in banner | `--space-between-emblems` |
| Emblem min height | `--emblem-height` |
| Space below header before Quality | `--space-header-to-quality` |
| Padding at bottom of each emblem | `--space-emblem-bottom` |

---

## How to use this in another Cursor session

1. Open or `@`-reference this file: `DESIGN.md`
2. Optionally add a Cursor rule: *“Read DESIGN.md before changing index.html”*
3. When adding game logic, keep the HTML class names stable:
   - `.column` / `.column-banner` / `.emblem` / `.emblem-header` / `.emblem-row`
   - `.emblem-select` (stat), `.quality-select`, `.trait-select`
   - `.operations-panel` / `.op-tab-btn` / `.op-content` / `.op-group` / `.op-btn`

---

## JavaScript (`app.js`)

### Application state

`appState` (via `getAppState()` / `refreshAppState()`) always reflects the current UI:

```js
{
  stage: 'group' | 'main',
  banners: {
    core: { role: 'core', emblems: [...] },
    mid: { role: 'mid', emblems: [...] },
    support: { role: 'support', emblems: [...] }
  }
}
```

Each emblem entry: `{ index, color, attribute, quality, trait }`.

### Helpers exposed on `window.dotaFantasy`

| Function | Return value |
|----------|--------------|
| `readEmblem(emblemEl)` | `{ attribute, quality, trait, color }` |
| `readBanner(columnEl)` | `{ role, emblems }` |
| `getDashboardState()` | `{ core, mid, support }` |
| `getAppState()` | Refreshes and returns `appState` |
| `refreshAppState()` | Updates `appState` from the DOM |
| `getActiveStage()` | `'group'` or `'main'` |
| `logAppState()` | Logs and returns current `appState` |
| `parseQuality(label)` | converts `"Tier III"` → `3` |

---

## Planned extensions (not implemented yet)

- [ ] Apply operation logic to emblem DOM/state when an operation is selected
- [ ] Rules for which **traits** apply per emblem color/context
- [ ] Dynamic recalculation of `.emblem-total` from quality + trait bonuses
- [ ] Persisting user selections (localStorage or backend)
