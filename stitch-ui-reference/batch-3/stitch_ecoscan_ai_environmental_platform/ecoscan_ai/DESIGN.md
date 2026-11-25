---
name: EcoScan AI
colors:
  surface: '#e9ffed'
  surface-dim: '#c8e0ce'
  surface-bright: '#e9ffed'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#e1fae7'
  surface-container: '#dcf4e1'
  surface-container-high: '#d6eedc'
  surface-container-highest: '#d0e8d6'
  on-surface: '#0b1f14'
  on-surface-variant: '#40493d'
  inverse-surface: '#213528'
  inverse-on-surface: '#dff7e4'
  outline: '#707a6c'
  outline-variant: '#bfcaba'
  surface-tint: '#1b6d24'
  primary: '#0d631b'
  on-primary: '#ffffff'
  primary-container: '#2e7d32'
  on-primary-container: '#cbffc2'
  inverse-primary: '#88d982'
  secondary: '#005faf'
  on-secondary: '#ffffff'
  secondary-container: '#54a0fe'
  on-secondary-container: '#003567'
  tertiary: '#006243'
  on-tertiary: '#ffffff'
  tertiary-container: '#007d57'
  on-tertiary-container: '#bdffdc'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a3f69c'
  primary-fixed-dim: '#88d982'
  on-primary-fixed: '#002204'
  on-primary-fixed-variant: '#005312'
  secondary-fixed: '#d4e3ff'
  secondary-fixed-dim: '#a5c8ff'
  on-secondary-fixed: '#001c3a'
  on-secondary-fixed-variant: '#004786'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#e9ffed'
  on-background: '#0b1f14'
  surface-variant: '#d0e8d6'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 3.5rem
    fontWeight: '700'
    lineHeight: 4.25rem
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.25rem
    fontWeight: '600'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: '0'
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 0.9375rem
    fontWeight: '400'
    lineHeight: 1.5rem
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.25rem
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.25rem
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.04em
  data-mono:
    fontFamily: Space Mono
    fontSize: 0.8125rem
    fontWeight: '500'
    lineHeight: 1.125rem
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style
The design system positions environmental monitoring not as an alarmist dashboard, but as a calm, precise, and authoritative enterprise intelligence layer. Designed for environmental engineers, ESG directors, and municipal risk officers, the aesthetic merges technical high-precision telemetry with an organic, clean presence.

The visual style is **Eco-Technical Minimalism**: luminous, pristine surfaces contrasted against deep botanical chlorophyll tones and atmospheric cyan-blues. Interface layers evoke ecological balance through expansive whites, controlled density, and structural clarity, avoiding clutter while conveying high-fidelity machine learning insights.

## Colors
The palette balances natural vitality with clinical diagnostic confidence:

- **Primary (`#2E7D32`)**: Forest Chlorophyll. Used for key call-to-actions, confirmed safe statuses, and primary navigation states.
- **Secondary (`#1976D2`)**: Atmospheric Azure. Used for analytical metrics, water and atmospheric data streams, and active focus triggers.
- **Tertiary (`#059669`)**: Emerald Synthesis. Used for predictive AI telemetry, confidence scoring, and positive trend vectors.
- **Neutral (`#1A2E22`)**: Deep Pine Slate. A dark, organic-tinted off-black replacing stark charcoal to anchor typography and structural dividers without harshness.

### Functional & Severity Accents
- **Canvas / Background**: `#FFFFFF` base with layered surfaces shifting between `#F4F8F5` (Soft Mint Tint) and `#EEF5F0`.
- **Low Severity**: `#059669` (Emerald Green) on `#E6F7F0` surface.
- **Medium Severity**: `#D97706` (Amber Ochre) on `#FEF3C7` surface.
- **High / Critical Severity**: `#DC2626` (Crimson Hazard) on `#FEE2E2` surface.

## Typography
The system utilizes **Plus Jakarta Sans** for prominent headers to deliver an approachable, geometric warmth aligned with environmental sustainability, paired with **Inter** for dense analytical tables, body text, and input components. 

For sensor coordinates, PPM counts, and telemetry readings, `data-mono` provides strict tabular alignment to guarantee rapid scannability during threat assessments. Maintain strict uppercase transformation on `label-sm` for status indicators and severity chips.

## Layout & Spacing
A fluid 12-column responsive grid underpins desktop dashboards with a maximum canvas width of 1440px. The layout shifts to an 8-column format on tablet viewports (768px - 1023px) and a single or 4-column flow on mobile viewports (<768px).

Internal card padding strictly employs `space-lg` (24px) for prominent modular containers and `space-md` (16px) for compact feeds. Gaps between analytical modules conform strictly to `gutter` tokens to preserve airy environmental breathing room across complex data sets.

## Elevation & Depth
Depth is achieved through low-contrast, multi-stop organic shadows tinted with deep pine pigments rather than dead grey tones. This gives surfaces a floating, tactile quality above the off-white canvas.

- **Level 1 (Telemetry Cards & Panels)**: `box-shadow: 0 1px 3px rgba(26, 46, 34, 0.04), 0 6px 16px -4px rgba(26, 46, 34, 0.03);` bordered with a 1px solid `#E2EFE6` stroke.
- **Level 2 (Active Threat Modals & Flyouts)**: `box-shadow: 0 4px 6px -1px rgba(26, 46, 34, 0.05), 0 12px 28px -6px rgba(26, 46, 34, 0.08);` with a 1px solid `#D0E5D7` stroke.
- **Level 3 (Alert Banners & Hover Popovers)**: `box-shadow: 0 20px 35px -8px rgba(26, 46, 34, 0.12);` borderless, suspended.

## Shapes
To reinforce natural organic structures and approachable AI workflows, the design system utilizes 1rem (16px / `rounded-2xl` equivalent) as the standard container radius.

- **Cards & Data Widgets**: 16px (`rounded-2xl`) corner radius.
- **Buttons, Inputs & Dropdowns**: 8px (`rounded-md`) corner radius to preserve functional sharpness.
- **Badges, Tags & Severity Pills**: Full capsule radius (9999px) for clear tactile encapsulation.

## Components

### Buttons
- **Primary**: Solid `#2E7D32` background with `#FFFFFF` text. Hover shifts to `#256628` with subtle forward elevation. Active states compress down 1px.
- **Secondary**: Translucent surface (`#EAF4EC`) with `#2E7D32` label. Hover deepens to `#D6EBDB`.
- **Tertiary / Ghost**: Transparent container, `#1976D2` text, with underline on hover for secondary telemetry actions.
- Padding: 10px 18px (`space-sm` vertical, `space-md` horizontal).

### Severity Badges
Constructed using full capsule pills, bold uppercase `label-sm` typography, and distinct left status pips:
- **Low Severity**: `#059669` text on `#ECFDF5` background. Border: 1px solid `#A7F3D0`.
- **Medium Severity**: `#B45309` text on `#FFFBEB` background. Border: 1px solid `#FDE68A`.
- **High Severity**: `#B91C1C` text on `#FEF2F2` background. Border: 1px solid `#FECACA`.

### Cards & Analytical Widgets
Surfaces sit on `#FFFFFF` with standard 16px corner radius and Level 1 elevation. Headers feature a distinct `space-lg` separation, with secondary metrics rendered in `data-mono` styling alongside real-time live threat status indicators.

### Inputs & Controls
- **Field Inputs**: Minimal 1px border (`#D1E3D7`), white background, 8px radius. Focus states transition border to `#1976D2` with a 3px soft outer ring (`rgba(25, 118, 210, 0.15)`).
- **Checkboxes & Radios**: 18px standard size. Unchecked state features an organic slate border (`#A3B8AA`). Checked state fills with `#2E7D32` featuring a crisp white geometric checkmark.

### Threat Threat-Detection Maps & Sensor Overlays
Floating UI panels sitting directly over satellite or spatial views inherit a semi-translucent backdrop (`background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px);`) bounded by 1px solid `#D0E5D7` borders.