---
name: Vibrant Neomorphic System
colors:
  surface: '#f7f9fc'
  surface-dim: '#d8dadd'
  surface-bright: '#f7f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f7'
  surface-container: '#eceef1'
  surface-container-high: '#e6e8eb'
  surface-container-highest: '#e0e3e6'
  on-surface: '#191c1e'
  on-surface-variant: '#464556'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f4'
  outline: '#767587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4643e9'
  primary: '#433fe5'
  on-primary: '#ffffff'
  primary-container: '#5d5cff'
  on-primary-container: '#fdf9ff'
  inverse-primary: '#c1c1ff'
  secondary: '#6b38d4'
  on-secondary: '#ffffff'
  secondary-container: '#8455ef'
  on-secondary-container: '#fffbff'
  tertiary: '#006847'
  on-tertiary: '#ffffff'
  tertiary-container: '#00845a'
  on-tertiary-container: '#eefff2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1dfff'
  primary-fixed-dim: '#c1c1ff'
  on-primary-fixed: '#09006b'
  on-primary-fixed-variant: '#2b20d2'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f7f9fc'
  on-background: '#191c1e'
  surface-variant: '#e0e3e6'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

The design system is a sophisticated evolution of neomorphism, blending soft tactile surfaces with high-energy digital accents. It targets a modern, tech-forward audience that values a premium "physical" feel without the clutter of traditional skuomorphism. 

The aesthetic is defined as **Vibrant Neomorphism**:
- **Tactile Foundation:** Surfaces appear to be molded from a single, continuous material, using light and shadow to create extrusions.
- **Digital Vitality:** Clean, muted backgrounds are punctuated by high-vibrancy accents and mesh gradients, injecting "life" and energy into interaction points.
- **Modern Clarity:** A strict commitment to white space and refined typography ensures that despite the complex surface depth, the interface remains legible and highly functional.

## Colors

The palette is anchored by a neutral, soft grey base that facilitates the neomorphic depth effects. This "quiet" foundation allows the new accent colors to command attention:

- **Primary (Vibrant Indigo):** Used for key actions and brand presence.
- **Secondary (Electric Violet):** Used for active states, selection indicators, and energetic highlights.
- **Success (Soft Emerald):** Reserved for positive confirmations and healthy system states.

**Gradients & Glows:**
Primary actions utilize a subtle mesh gradient blending Indigo and Violet to create a sense of internal light. Active components feature a soft glow (using `accent_glow_hex`) to simulate a light-emitting diode (LED) effect embedded within the surface.

## Typography

This design system leverages **Plus Jakarta Sans** for its friendly yet geometric precision. Information hierarchy is enforced through high-contrast font weights:

- **Headers:** Utilize Bold (700) and ExtraBold (800) weights with tighter letter-spacing to feel "heavy" and grounded against the soft UI.
- **Body:** Uses Medium (500) for primary reading to ensure the text doesn't get lost in the shadows of the containers.
- **Labels:** SemiBold (600) with slight tracking for maximum legibility at small scales.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** model with generous internal padding to allow neomorphic shadows room to breathe. 

- **The 8px Rhythm:** All spacing and sizing are multiples of 8px (or 4px for tight internal component spacing).
- **Desktop:** 12-column grid, 24px gutters, 40px minimum side margins.
- **Tablet:** 8-column grid, 16px gutters, 24px side margins.
- **Mobile:** 4-column grid, 16px gutters, 16px side margins.

Content is organized in "islands" — elevated containers that use the spacing system to create clear logical groupings.

## Elevation & Depth

Hierarchy is achieved through **High-Contrast Neomorphism**. Unlike traditional flat design, elements are defined by their relationship to the surface:

- **Extruded (Raised):** Created using dual shadows. A top-left light shadow (`#FFFFFF` at 80% opacity) and a bottom-right dark shadow (`#D1D9E6` at 100% opacity). This contrast is sharpened to make the effect crisp.
- **Inverted (Pressed):** Used for input fields and pressed button states. The shadows move inside the element to create a "well" effect.
- **Active Glow:** Elements that are "on" or "selected" project a soft primary-colored outer glow (15px-20px blur) to signify vitality and energy.

## Shapes

The shape language is consistently **Rounded**. Hard corners are avoided as they break the illusion of the "molded" material. 

- **Standard Elements:** 0.5rem (8px) radius for buttons and small components.
- **Cards/Containers:** 1rem (16px) or 1.5rem (24px) for large layout blocks.
- **Interactive Indicators:** Elements like toggles and selection chips often transition to pill-shaped (rounded-full) to provide a friendly, organic feel.

## Components

### Buttons
- **Primary:** Features a mesh gradient from Vibrant Indigo to Electric Violet. On hover, the shadow depth decreases and the "Active Glow" intensifies.
- **Secondary:** Neomorphic extrusion with Indigo text.
- **Tertiary:** Flat with a subtle inner glow on hover.

### Inputs
- **Fields:** Inverted (sunken) neomorphic shape. When focused, the border glows with a soft 1px Indigo stroke and the internal shadow softens.

### Chips & Badges
- **Status Chips:** Small, pill-shaped elements with high-vibrancy fills (Emerald for success). These act as the primary "spots" of color in a sea of neutral grey.

### Cards
- **Surface:** Always extruded from the background. 
- **Header:** Refined weight (Bold) typography to anchor the content.

### Toggle & Selection
- **Active State:** When toggled 'on', the background fills with a gradient and emits a subtle shadow glow of the same color, simulating a physical backlit button.