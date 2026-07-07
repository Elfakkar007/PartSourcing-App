---
version: alpha
name: Plant-Sourcing-Design-System
description: A dense, functional data-entry tool inspired by spreadsheet familiarity (Google Sheets) rather than marketing/showcase design. Optimized for readability across many rows/columns, fast scanning, clear semantic status colors, and comfortable use both at a desk and on a phone in a factory floor. Chrome is quiet and utilitarian; color is reserved for meaning (status, completion, danger), never decoration.

colors:
  primary: "#188038"
  primary-hover: "#0F9D58"
  primary-light-bg: "#e6f4ea"
  secondary: "#1a73e8"
  secondary-light-bg: "#e8f0fe"
  warning: "#f9ab00"
  warning-light-bg: "#fef7e0"
  danger: "#d93025"
  danger-hover: "#b3261e"
  danger-light-bg: "#fce8e6"
  ink: "#1f2328"
  ink-muted: "#5f6368"
  ink-faint: "#80868b"
  canvas: "#ffffff"
  surface-subtle: "#f8f9fa"
  surface-panel: "#f1f3f4"
  border: "#dadce0"
  border-strong: "#c4c7ca"
  grid-line: "#e8eaed"
  grid-header-bg: "#f8f9fa"
  grid-row-hover: "#f1f8f3"
  grid-row-selected: "#e6f4ea"
  status-existing: "#188038"
  status-inactive: "#5f6368"
  focus-ring: "#1a73e8"
  offline-indicator: "#f9ab00"
  online-indicator: "#188038"

typography:
  page-title:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.1px
  section-heading:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  body-strong:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  grid-cell:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: 0
  grid-header-label:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.2px
  caption:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: 0
  mono-code:
    fontFamily: "IBM Plex Mono, ui-monospace, Consolas, monospace"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: 0

rounded:
  none: 0px
  sm: 6px
  md: 8px
  lg: 12px
  pill: 999px

spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  section: 32px

shadow:
  subtle: "rgba(0, 0, 0, 0.06) 0 1px 2px"
  card: "rgba(0, 0, 0, 0.08) 0 1px 3px, rgba(0, 0, 0, 0.04) 0 1px 2px"
  popover: "rgba(0, 0, 0, 0.12) 0 4px 16px"

components:

  # --- Grid / Table (the core of the product) ---
  data-grid:
    description: >
      The primary work surface. A spreadsheet-like table where each row is one component
      record and each cell is independently editable in place (no separate edit form/modal
      for normal editing). Row height stays compact to maximize visible rows — this is the
      opposite priority of a marketing page; density beats whitespace here.
    header:
      background: "{colors.grid-header-bg}"
      text: "{typography.grid-header-label}"
      color: "{colors.ink-muted}"
      height: 36px
      position: sticky (stays visible while scrolling vertically)
      border-bottom: "2px solid {colors.border-strong}"
    row:
      height: 40px (desktop) / 44px (touch, larger tap target)
      border-bottom: "1px solid {colors.grid-line}"
      hover-background: "{colors.grid-row-hover}"
      selected-background: "{colors.grid-row-selected}"
    cell:
      text: "{typography.grid-cell}"
      padding: 6px 10px
      editable-state: on click/tap, cell becomes an inline input with a 2px solid
        "{colors.focus-ring}" outline; no modal, no page navigation
      autosave-indicator: small checkmark icon (16px, "{colors.primary}") fades in
        briefly at the right edge of the cell after a successful save, fades out after ~1.5s
      incomplete-indicator: cell left empty that is part of the "required for completion"
        rule gets a 1px dashed "{colors.warning}" left border as a quiet visual nudge
    photo-link-cell:
      description: >
        The Foto column stores a Google Drive URL as text, not a file. Rendered as a
        clickable link in "{colors.secondary}", opens the Drive URL in a new tab.
      hover-preview (desktop): on mouse hover, a small popover ("{shadow.popover}",
        rounded "{rounded.md}", max 240px wide) appears showing the image fetched from
        the Drive thumbnail endpoint. Disappears on mouse-out.
      tap-preview (mobile): first tap opens the same popover as a centered modal with a
        dimmed backdrop; tapping outside or an explicit close icon dismisses it. A second
        tap target (small external-link icon next to the link text) opens Drive directly.
    row-selection:
      checkbox-column: 32px wide, leftmost, "{colors.secondary}" checked state, used to
        select rows for bulk actions (bulk delete, bulk export)
    empty-cell-placeholder:
      text: "—" in "{colors.ink-faint}", never a blank white void so the grid always reads
        as intentional, not broken

  location-tabs:
    description: >
      Horizontal tab strip inside a Line view, one tab per Location. Selecting a tab
      filters the grid below to that Location's rows only.
    tab-default:
      text: "{typography.body}", color "{colors.ink-muted}", padding 8px 16px,
      border-bottom: 2px solid transparent
    tab-active:
      color: "{colors.ink}", border-bottom: "2px solid {colors.primary}", font-weight 600
    tab-completion-badge:
      description: small checkmark badge on a tab once every row in that Location is complete
      background: "{colors.primary}", icon color "{colors.canvas}", 16px circle,
      positioned top-right corner of the tab label

  status-chip:
    description: Small pill used for the Status column and for filters/legends.
    existing:
      background: "{colors.primary-light-bg}", text "{colors.status-existing}",
      "{typography.caption}", rounded "{rounded.pill}", padding 2px 10px
    inactive:
      background: "{colors.surface-panel}", text "{colors.status-inactive}",
      "{typography.caption}", rounded "{rounded.pill}", padding 2px 10px

  sync-status-bar:
    description: >
      Persistent, unmissable indicator of connectivity + save state — this is the single
      most important trust signal in an offline-first tool. Always visible, never buried
      in a menu.
    position: top of the app, below the header, full-width, height 32px
    online-state:
      background: "{colors.primary-light-bg}", icon + text in "{colors.online-indicator}",
      label: "Tersimpan • Online"
    offline-state:
      background: "{colors.warning-light-bg}", icon + text in "{colors.offline-indicator}",
      label: "Mode Offline • Tersimpan di perangkat, akan sinkron otomatis"
    syncing-state:
      background: "{colors.secondary-light-bg}", small spinner + text in "{colors.secondary}",
      label: "Menyinkronkan N perubahan..."

  button-primary:
    background: "{colors.primary}", text "{colors.canvas}" in "{typography.body-strong}",
    rounded "{rounded.md}", padding 8px 16px, hover background "{colors.primary-hover}",
    active: transform scale(0.97)

  button-secondary:
    background: "{colors.canvas}", text "{colors.ink}" in "{typography.body-strong}",
    1px solid "{colors.border}", rounded "{rounded.md}", padding 8px 16px,
    hover background "{colors.surface-subtle}"

  button-danger:
    background: "{colors.canvas}", text "{colors.danger}" in "{typography.body-strong}",
    1px solid "{colors.danger}", rounded "{rounded.md}", padding 8px 16px,
    hover background "{colors.danger-light-bg}"
    usage: reserved for delete/destructive actions only — never used for neutral actions

  toolbar:
    description: Row of contextual actions above the grid (Tambah Baris, Hapus Terpilih,
      Export, Import, Duplikat). Buttons stay compact and icon+label, not icon-only,
      because this is a work tool used by people who benefit from explicit labels over
      guessing icon meaning.
    background: "{colors.canvas}", border-bottom "1px solid {colors.border}",
    padding: "{spacing.sm} {spacing.lg}"

  confirmation-dialog:
    description: Used for delete confirmations, especially bulk delete.
    backdrop: rgba(0, 0, 0, 0.4)
    panel: "{colors.canvas}", rounded "{rounded.lg}", "{shadow.popover}", max-width 420px
    title: "{typography.section-heading}"
    body: "{typography.body}", must state the exact count and location affected
      (e.g. "Anda akan menghapus 20 baris dari Location Boiler Room")
    primary-action: "{component.button-danger}" labeled with the specific action,
      never a generic "OK" for destructive confirmations
    secondary-action: "{component.button-secondary}" labeled "Batal"

  toast-notification:
    description: Brief, non-blocking feedback (e.g. "Import selesai, 42 baris ditambahkan")
    background: "{colors.ink}", text "{colors.canvas}" in "{typography.body}",
    rounded "{rounded.md}", padding 10px 16px, position bottom-center or bottom-right,
    auto-dismiss after 4s, includes an "Undo" text-link in "{colors.secondary-on-dark
    equivalent: #8ab4f8}" when the action is undoable (e.g. after import or bulk delete)

  progress-bar:
    description: Used on the dashboard for per-Line and combined completion percentage.
    track: "{colors.surface-panel}", height 8px, rounded "{rounded.pill}"
    fill: "{colors.primary}", rounded "{rounded.pill}"
    label: percentage in "{typography.body-strong}" placed above or beside the bar,
      never only a color with no number — numeric literacy matters more than aesthetics here

  card:
    background: "{colors.canvas}", border "1px solid {colors.border}",
    rounded "{rounded.lg}", padding "{spacing.lg}", shadow "{shadow.subtle}"
    usage: dashboard summary tiles, settings panels — NOT used for grid rows themselves

  input-field:
    background: "{colors.canvas}", border "1px solid {colors.border}",
    rounded "{rounded.md}", padding 8px 12px, text "{typography.body}",
    focus: "2px solid {colors.focus-ring}" outline, border color "{colors.secondary}"

  recycle-bin-row:
    description: Row in the admin's "deleted items" view.
    background: "{colors.surface-subtle}", text "{colors.ink-muted}",
    strikethrough on the Part name field, restore action as a small text-link
    in "{colors.secondary}" on the right

## Do's and Don'ts

### Do
- Keep grid rows compact (40–44px) — density is the priority, not airy whitespace.
- Reserve color for meaning: green = complete/existing/success, amber = warning/offline,
  red = destructive/inactive-adjacent-danger, blue = informational/link. Never decorative.
- Always show a visible, persistent sync/connectivity indicator — this is the product's
  core trust mechanism and must never be hidden in a settings menu.
- Use inline cell editing for the grid — click/tap a cell, edit, it autosaves. No modal
  popups for routine data entry.
- Pair every progress percentage with the literal number, not just a colored bar.
- State exact counts and locations in every destructive confirmation dialog.
- Keep touch targets at minimum 44×44px on anything a phone user taps in the field.

### Don't
- Don't use marketing-style full-bleed hero sections, large display type, or product
  photography treatment anywhere in this app — it is a work tool, not a showcase.
- Don't apply generous body line-height (1.47+) inside grid cells — that's for prose,
  not tabular data, and it wrecks row density.
- Don't limit the palette to one accent color — this tool needs distinct semantic colors
  for status, completion, and danger to function correctly, not just for style.
- Don't hide destructive actions behind a single generic "OK" button — always label the
  specific consequence.
- Don't use gradients, drop shadows on buttons/chips, or decorative illustration — keep
  chrome quiet so the data is what draws attention.
- Don't use icon-only buttons in the main toolbar — always pair icon + text label.

## Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|---|---|---|
| Mobile | ≤ 640px | Grid becomes a stacked card-per-row view (each row's fields listed vertically) instead of a horizontal table; location tabs become a horizontal scroll strip; toolbar actions collapse into a "..." overflow menu except the single most common action (Tambah Baris) |
| Tablet | 641–1024px | Grid stays tabular but hides lower-priority columns (Qty WH, Description) behind a "show more columns" toggle; toolbar shows icon+label for primary actions, overflow for the rest |
| Desktop | ≥ 1025px | Full grid, all columns visible, full toolbar, sync-status-bar and location tabs always visible without scrolling |

### Touch Targets
- Minimum 44×44px for anything tapped on a phone (checkboxes, cell tap targets, buttons).
- Grid rows at 44px height on touch devices vs 40px on desktop with mouse/trackpad.

### Collapsing Strategy
- **Grid → Card list**: below 640px, each data row renders as a small card showing
  "Sub-Machine" as the card title and remaining fields as label/value pairs stacked
  vertically, still each individually tappable/editable inline.
- **Toolbar**: full button row (desktop) → icon+label primary action visible, rest under
  overflow menu (mobile).
- **Dashboard charts**: multi-column chart grid (desktop) → single column stacked
  (mobile), each chart still shows its numeric labels at full size (never shrink numbers
  to the point of illegibility).

## Iteration Guide

1. Style the data-grid and sync-status-bar components first — they are used everywhere
   and everything else is secondary to them.
2. Reference component keys directly when asking for changes (e.g. "adjust
   {component.data-grid} row height", not "make the table nicer").
3. Never apply prose-oriented typography rules (loose line-height, wide letter-spacing)
   to grid-cell or grid-header-label — those two live by their own denser rules.
4. When adding a new status or badge, define its color pairing explicitly in `colors:`
   rather than reusing an existing semantic color for a new, different meaning.
5. Test every new component at the Mobile breakpoint before considering it done — this
   tool is used in the field on phones as much as at a desk.

## Known Gaps
- Chart-specific color sequences for the "breakdown per Category" chart are not yet
  defined — pick from {colors.secondary}, {colors.primary}, {colors.warning}, and add
  further hues at matching saturation only if more than 4 categories exist.
- Dark mode is intentionally out of scope for this version — the app is optimized for
  bright factory-floor daylight readability, not dark-mode aesthetics.
