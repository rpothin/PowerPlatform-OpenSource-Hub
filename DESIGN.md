---
name: Power Platform Open-Source Hub
description: Community-driven discovery hub for open-source Power Platform and Copilot Studio projects.
_typography-note: "Hanken Grotesk replaces Inter (brand.md reflex-reject). Geist Mono is available; JetBrains Mono chosen for developer-tool familiarity."
colors:
  primary: "#6936F7"
  primary-deep: "#4A1FB5"
  primary-mid: "#8A60F9"
  primary-light: "#EDE8FE"
  neutral-bg: "#F7F8FC"
  surface: "#FFFFFF"
  surface-raised: "#F0F2FA"
  ink-primary: "#1A1B2E"
  ink-secondary: "#4A4D6A"
  ink-muted: "#7A7E9A"
  border: "#E1E4F0"
  border-strong: "#C5CADF"
  success: "#2DA44E"
  warning: "#D29922"
  danger: "#CF222E"
  dark-bg: "#0D1117"
  dark-surface: "#161B22"
  dark-surface-raised: "#21262D"
  dark-ink-primary: "#E8E9F4"
  dark-ink-secondary: "#9198A1"
  dark-border: "#30363D"
  dark-primary: "#A78BFA"
typography:
  display:
    fontFamily: "'Hanken Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.25rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Hanken Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
    fontSize: "clamp(1.4rem, 3vw, 2rem)"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "'Hanken Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Hanken Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "'Hanken Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0.02em"
  mono:
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'Courier New', monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  none: "0"
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  "2xl": "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "9px 19px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  stat-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.lg}"
    padding: "24px 20px"
  repo-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.lg}"
    padding: "20px"
  input-search:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
---

# Design System: Power Platform Open-Source Hub

## 1. Overview

**Creative North Star: "The Community Bridge"**

The Power Platform Open-Source Hub exists at the intersection of two worlds — Microsoft's ecosystem of makers and developers, and the open culture of GitHub contributors. The design system reflects that position: it is simultaneously familiar to Power Platform users who know Fluent, and comfortable for GitHub-native contributors who navigate repos, issues, and READMEs daily. Neither world dominates; the bridge is the point.

Density matters here. Users arrive with intent — they are looking for a specific project, a contribution opportunity, or an ecosystem pulse. The interface respects that intent by surfacing information directly, without ceremony or sales theatre. Typography is clean and legible at small sizes. Spacing is consistent and generous enough to breathe, but never wasteful when there is data to show.

The palette anchors on a deep indigo-violet — a color in the Power Platform purple family, but more vibrant and technically confident than any Docusaurus default. It carries authority without corporate coldness. Against white or near-white surfaces in light mode, and against GitHub-adjacent dark surfaces in dark mode, it reads as both trustworthy and alive.

This system explicitly rejects: marketing/sales aesthetics, hero-metric templates, gradient text, glassmorphism used decoratively, identical card grids without hierarchy, and manufactured urgency. The hub serves the community; it does not pitch to it.

**Key Characteristics:**
- **Dual-register fluency**: brand warmth on the landing page, product density in the gallery
- **System-native typography**: system font stack enhanced with Inter — fast, cross-platform, Fluent/GitHub-adjacent
- **Functional elevation**: shadows serve state (hover, focus, raised surface), not decoration
- **Indigo-violet identity**: a distinct primary that bridges Power Platform purple and GitHub's technical blue
- **Minimal but deliberate motion**: state transitions only, respecting `prefers-reduced-motion`

## 2. Colors: The Bridge Palette

A single primary accent (indigo-violet) against cool neutral surfaces, supported by semantic status colors adopted from GitHub's palette for ecosystem familiarity.

### Primary
- **Indigo Violet** (`#6936F7`): The primary accent. Used on primary CTAs, active states, stat values, focus rings, and key link hover states. Bridging Power Platform purple and GitHub's technical indigo family. Light mode only.
- **Deep Indigo** (`#4A1FB5`): Primary hover/pressed state. Also used as the darkest step in the primary ramp.
- **Soft Indigo** (`#8A60F9`): Mid-tone for secondary accents, progress indicators, and subtle highlights.
- **Indigo Tint** (`#EDE8FE`): Background tint for selected chips, active filter pills, info callouts.

### Secondary
- **Success Green** (`#2DA44E`): Adopted from GitHub's semantic green. Used for "active", "open to contributions", and positive status indicators.
- **Warning Amber** (`#D29922`): GitHub-adjacent amber. For stale activity warnings or attention indicators.
- **Danger Red** (`#CF222E`): GitHub semantic red. Used sparingly for destructive actions or critical missing data.

### Neutral
- **Neutral BG** (`#F7F8FC`): Page background in light mode. Barely-there cool-violet tint — not warm, not pure white.
- **Surface White** (`#FFFFFF`): Card and panel surfaces.
- **Surface Raised** (`#F0F2FA`): Hover state for list items, alternating row tints, inner panel backgrounds.
- **Ink Primary** (`#1A1B2E`): Body text. Near-black with a subtle violet cast — never pure black.
- **Ink Secondary** (`#4A4D6A`): Secondary text, labels, meta.
- **Ink Muted** (`#7A7E9A`): Placeholder, disabled, tertiary annotations. Always checked against 4.5:1 minimum.
- **Border** (`#E1E4F0`): Default dividers and card borders.
- **Border Strong** (`#C5CADF`): Inputs at rest, table separators.
- **Dark BG** (`#0D1117`): Dark mode page background. GitHub-native dark.
- **Dark Surface** (`#161B22`): Dark mode card and panel surfaces.
- **Dark Surface Raised** (`#21262D`): Dark mode hover/elevated surfaces.
- **Dark Primary** (`#A78BFA`): Indigo-violet adapted for dark mode — lighter, warmer, accessible against dark surfaces.

### Named Rules
**The One Accent Rule.** The indigo-violet primary appears on ≤15% of any given screen. Its rarity and consistency are what make it trustworthy. Never apply it to decorative elements.

**The No-Warm-Default Rule.** Neutral backgrounds use a cool-violet tint, not warm/beige/sand. Warmth in the brand comes from the indigo accent and community imagery, not from a tinted background.

## 3. Typography

**Body / UI Font:** Hanken Grotesk (preferred, loaded from Google Fonts) falling back to `-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`  
**Mono Font:** JetBrains Mono → Fira Code → Cascadia Code → Consolas (for code blocks, repo topics as chips)

**Character:** A single humanist grotesque family across all weights. Hanken Grotesk is a contemporary, legible sans-serif that reads as technical and trustworthy without the overexposure of Inter. It bridges Microsoft Fluent's Segoe UI sensibility and GitHub's clean utility aesthetic. No display/serif contrast pairing; the hierarchy is built through weight and size alone, which is appropriate for a data-dense community surface.

### Hierarchy
- **Display** (700, clamp(2rem → 3.25rem), line-height 1.1, -0.02em): Hero headline on the landing page only. One per screen. `text-wrap: balance`.
- **Headline** (600, clamp(1.4rem → 2rem), line-height 1.25, -0.015em): Section titles (Key Insights, Who is this for?). `text-wrap: balance`.
- **Title** (600, 1.125rem, line-height 1.4, -0.01em): Card headings, filter section labels, dialog titles.
- **Body** (400, 0.9375rem / 15px, line-height 1.6): Primary reading text. Max line length 65–72ch. `text-wrap: pretty` on prose blocks.
- **Label** (600, 0.75rem / 12px, line-height 1.35, +0.02em): Stat card labels (uppercase), filter section headers, tag text. Uppercase only when the design calls for extreme restraint (stat labels); avoid as a section-eyebrow reflex.
- **Mono** (400, 0.875rem, line-height 1.5): Repository topic tags, code references, technical metadata.

### Named Rules
**The One-Family Rule.** Hanken Grotesk only. Do not introduce a second face. Hierarchy is weight × size, not face contrast.

## 4. Elevation

The system uses a minimal, state-driven shadow vocabulary. Surfaces are flat at rest. Shadows appear in two contexts only: hover state (user intent) and floating UI (dialogs, dropdowns). Tonal layering (lighter surface on darker surface) handles resting depth without shadows.

### Shadow Vocabulary
- **Ambient Hover** (`0 4px 16px rgba(105, 54, 247, 0.12)`): Applied on card hover. Carries a faint indigo tint to reinforce brand connection without color-washing the surface.
- **Ambient Lift** (`0 8px 32px rgba(0, 0, 0, 0.12)`): Dialogs, dropdowns, floating filter panels.
- **Dark Ambient Hover** (`0 4px 16px rgba(0, 0, 0, 0.35)`): Card hover in dark mode. No tint — dark surfaces use neutral shadow.

### Named Rules
**The Flat-By-Default Rule.** All surfaces rest flat (no shadow). Hover, active, and floating states introduce shadow as a response to interaction — never as decoration.

## 5. Components

### Buttons
- **Shape:** 8px radius (`{rounded.md}`)
- **Primary:** `#6936F7` background, white text, `10px 20px` padding. Font: 0.9375rem, 500 weight. Hover: `#4A1FB5`.
- **Hover / Focus:** `transform: translateY(-1px)`, shadow `0 4px 12px rgba(105,54,247,0.25)`. Focus-visible: 2px offset `#6936F7` outline.
- **Secondary (outlined):** Transparent background, `#6936F7` border, `#6936F7` text. Hover: `{colors.primary-light}` background.
- **Ghost:** Transparent, `{colors.ink-secondary}` text, subtle background on hover (`{colors.surface-raised}`).
- **All transitions:** `background 0.15s ease-out, transform 0.15s ease-out, box-shadow 0.15s ease-out`. Reduced-motion: no transform, no shadow transition.

### Chips / Filter Pills
- **Unselected:** `{colors.surface-raised}` background, `{colors.ink-secondary}` text, `{colors.border}` border, `{rounded.pill}` radius.
- **Selected:** `{colors.primary-light}` background, `{colors.primary-deep}` text, `{colors.primary-mid}` border.
- **Hover:** border shifts to `{colors.primary-mid}`, background `{colors.primary-light}` at 50% opacity.

### Cards / Containers
- **Corner Style:** 12px radius (`{rounded.lg}`)
- **Background:** `{colors.surface}` (white)
- **Shadow Strategy:** Flat at rest with `1px solid {colors.border}`. On hover: `{elevation.ambient-hover}` + border shifts to `{colors.border-strong}`. No `border-top` accent stripe.
- **Internal Padding:** 20–24px (`{spacing.lg}`)
- **Stat cards specifically:** Primary value color `{colors.primary}`, label uppercase 0.72rem 600 weight.

### Inputs / Fields
- **Style:** `{colors.surface}` background, `{colors.border-strong}` 1px border, `{rounded.md}` radius, `10px 14px` padding.
- **Focus:** Border shifts to `{colors.primary}`, `0 0 0 3px rgba(105,54,247,0.15)` outer glow.
- **Placeholder:** `{colors.ink-muted}` — always verify ≥4.5:1 against background before shipping.
- **FluentUI inputs** (gallery search bar): theme override to use `{colors.primary}` for focus ring color, preserving Fluent accessibility semantics.

### Navigation
- **Style:** Docusaurus navbar, top-positioned. Logo + text, horizontal links left, GitHub right.
- **Link states:** Default `{colors.ink-secondary}`, hover `{colors.primary}`, active underline in `{colors.primary}`.
- **Mobile breakpoint:** 960px (current Docusaurus config value, preserved).

### Repository Card (Signature Component)
The core unit of the gallery. Each card surfaces: repository name (Title weight), owner, description (Body), language/topic chips (Chip style), star count, and open issue indicators. Actions (GitHub link) on hover reveal.
- No identical-card-grid trap: cards sort by relevance/activity and vary in chip density — the data creates natural visual variation.
- Hover: ambient-hover shadow + border-strong + `transform: translateY(-2px)` on the card.

## 6. Do's and Don'ts

### Do:
- **Do** use `#6936F7` for primary interactive elements (CTAs, active states, links, focus rings) and nowhere else.
- **Do** verify body text contrast ≥4.5:1 against its background before shipping — especially `{colors.ink-muted}` on `{colors.neutral-bg}`.
- **Do** apply `text-wrap: balance` on h1–h3 and `text-wrap: pretty` on body paragraphs.
- **Do** include `@media (prefers-reduced-motion: reduce)` for every animation: remove `transform` transitions, reduce shadow animations to `opacity` only.
- **Do** use `{colors.success}` / `{colors.warning}` / `{colors.danger}` in their semantic GitHub roles — GitHub-native users recognize these instantly.
- **Do** use tonal layering (surface → surface-raised → neutral-bg) to express resting depth. Shadows are for hover and float states.
- **Do** keep the filter pane and gallery as the primary product surface — optimize for data density and scanability over visual impressiveness.

### Don't:
- **Don't** use marketing or sales aesthetics. No hero-metric templates (big number, gradient accent, supporting stats). This is a community utility, not a product pitch.
- **Don't** use gradient text (`background-clip: text` + gradient). All text uses a solid color from the palette.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored accent stripe on cards, list items, or callouts. Use full-border treatment, background tint, or leading icons instead.
- **Don't** use glassmorphism or `backdrop-filter: blur` decoratively. If used, it must serve a functional purpose (modal backdrop, sticky nav legibility).
- **Don't** repeat uppercase tracked eyebrow labels on every section. Uppercase labels are reserved for stat card labels; section headings use Title/Headline weight at normal case.
- **Don't** use the warm-neutral background band (creamy beige, sand, paper, parchment). The background is a cool-tinted near-white `#F7F8FC`. Warmth is carried by the primary accent and community content.
- **Don't** ship placeholder text below 4.5:1 contrast. The Fluent Input default gray placeholder often fails — override explicitly.
- **Don't** nest cards inside cards. The repo card is the deepest container unit.
