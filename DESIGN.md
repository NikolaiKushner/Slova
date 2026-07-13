# Slova Design System

Rules for anyone (human or AI) touching UI. Tokens live in
`app/assets/css/main.css` (`@theme` + `.dark` overrides). Visual showcase:
`/design` (dev-only).

## Character

Friendly, calm, lightly playful — never childish. Studying without stress.
The mascot adds warmth; the UI itself stays clean and adult. Rounded corners
everywhere (the mascot IS a rounded card) — no sharp corners in the UI.

## Palette

| Token | Light | Dark | Use for |
| --- | --- | --- | --- |
| `--color-accent` | `#5B4FD6` | `#8F86EA` | Primary CTA, active states, mascot corner |
| `--color-accent-soft` | `#8F86EA` | `#5B4FD6` | Hover, progress bars, decorative dots, focus rings |
| `--color-accent-subtle` | `#EDEBFB` | `#2B2A4A` | Badge/selection backgrounds |
| `--color-ink` | `#1D2433` | `#F2F1FF` | Body text, outlines |
| `--color-ink-muted` | `#6A7080` | `#A7ACC2` | Secondary text |
| `--color-ink-faint` | `#9AA0AD` | `#7D84A0` | Captions, placeholders — decorative only |
| `--color-paper` | `#F7F6F2` | `#14161F` | Page background (warm, not pure white) |
| `--color-surface` | `#FFFFFF` | `#1E2130` | Cards, panels, inputs |
| `--color-border` | `#E7E5DE` | `#323752` | Borders, dividers |
| `--color-success` | `#0E9F8C` | `#2CB8A4` | Correct answers, positive stats |
| `--color-error` | `#E05252` | `#E97A7A` | Wrong answers, destructive actions |
| `--color-warning` | `#E8A13C` | `#EDB25F` | Caution states |

**Accent is rationed:** one primary button per screen, plus small touches
(mascot corner, progress, active nav item). Never flood large surfaces with
accent.

### Contrast (WCAG AA, 4.5:1 body text) — measured

- `ink` / `ink-muted` on `paper` and `surface` pass in both themes
  (`ink-muted` on light `paper` is 4.6:1 — at the limit, do not lighten it).
- `ink-faint` does NOT pass (≈2.6:1 light, ≈4.3:1 dark). Placeholder and
  decorative text only — never information the user must read.
- `accent` as text passes on `paper`/`surface` in both themes (≥5:1).
- Semantic colors as body-size text on bare `surface` do NOT all pass
  (light theme: success 3.3:1, error 3.8:1, warning 2.2:1). Use them for
  fills, borders, icons, and large/bold text; body-size semantic text goes
  on a tinted background (e.g. red-50-style tint) or falls back to `ink`.

## Dark theme

The `.dark` class on `<html>` overrides the same CSS variables — components
written with tokens need no `dark:` variants for token-covered properties.
Accent and accent-soft swap so accent stays readable on dark surfaces.
**Borders instead of shadows:** `--shadow-card` is disabled in dark theme;
separation comes from `--color-border` and surface/paper difference.

## Typography

System stack (`--font-sans`): `-apple-system, 'SF Pro Text', 'Segoe UI',
Roboto, sans-serif`. Scale is Tailwind's default, as already used on screens:

- `text-xs` 12px — captions, hints
- `text-sm` 14px — controls, secondary copy
- `text-base` 16px — body
- `text-xl` 20px / `text-2xl` 24px — section and page headings
- `text-3xl` 30px+ — hero/stat numbers

Headings: weight 800 (`font-extrabold`), letter-spacing −0.02em
(`tracking-tight`). Body text: regular weight, no tracking.

## Radii

Part of the character — no sharp corners.

- sm = 8px → `rounded-lg`
- md = 12px → `rounded-xl`
- card = 12px → `rounded-card` (semantic alias token `--radius-card`)
- lg = 16px → `rounded-2xl`

Deviation from the original token spec, on purpose: Tailwind v4's default
`--radius-sm/md/lg` variables are NOT redefined — existing screens use
`rounded-md/lg/xl` and redefining the variables would resize them all. The
scale above maps onto Tailwind's built-in values instead; only
`--radius-card` is a new token.

## Shadows

- `--shadow-card` (`shadow-card`) — soft, for cards resting on paper.
- `--shadow-pop` (`shadow-pop`) — pronounced, for modals and popovers only.
- Dark theme: card shadow is off (see above); pop shadow stays, darker.

## Mascot (`<SlovaMascot>`)

Props: `size` (px, default 96), `emotion`:

| Emotion | Face | Use when |
| --- | --- | --- |
| `hello` (default) | dot eyes, smile | Greetings, empty-ish neutral states |
| `yay` | arched happy eyes, open smile, blush | Correct answer, session complete |
| `oops` | slanted dash eyes, "o" mouth, sweat drop | Wrong answer |
| `sleep` | flat dash eyes, dot mouth, "z z" | Nothing due for review |
| `wink` | one eye winking, smile | Streaks, achievements |

Rules: at most one mascot per screen. In study modes the mascot appears only
in answer feedback/results — never next to the card while the user is
thinking. All mascot colors are tokens; it works in dark theme automatically.

## Components

- **Cards:** `surface` background + `border` + `rounded-card` + `shadow-card`
  (border only in dark theme).
- **Buttons:** primary — `accent` background, `paper` text (paper, not white:
  it stays AA-contrast in both themes); secondary — `surface` + `border` +
  `ink` text; ghost — no background/border, `ink-muted` text, accent on hover.
- **Focus states:** always visible — 2px ring in `accent-soft`.

## Motion

- Card flip: 400ms (`--duration-flip`).
- Everything else: 150ms (`--duration-quick`) for hovers/toggles, 250ms
  (`--duration-base`) for reveals/layout.
- Easing: `cubic-bezier(0.2, 0, 0, 1)` (`--ease-brand` / `ease-brand`).
- Respect `prefers-reduced-motion`: disable flips and slides, keep opacity.

## Do / Don't

- ✅ One accent CTA per screen ❌ Three purple buttons side by side
- ✅ Card = surface + border + soft shadow ❌ Heavy drop shadows in dark theme
- ✅ Mascot in the result toast after an answer ❌ Mascot staring at the user next to the flashcard
- ✅ `text-ink-muted` for secondary copy ❌ `text-ink-faint` for anything the user must read
- ✅ Colors via tokens (`bg-accent`, `text-ink`) ❌ Hardcoded hex values in components
