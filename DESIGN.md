```markdown
# Design System Document: The Precision Paddock

## 1. Overview & Creative North Star
The core of this design system is built upon a Creative North Star we call **"The Precision Paddock."** 

In the high-stakes world of horse racing odds, most interfaces are cluttered, aggressive, and overwhelming. We are breaking that template. This system moves away from "Standard SaaS" and toward a "High-End Editorial" experience. We treat data with the reverence of a luxury watch face: every decimal point is intentional, every shift in value is visible through tonal depth rather than loud colors, and whitespace is used as a functional tool to reduce cognitive load during split-second decision-making.

We achieve this through **Intentional Asymmetry** and **Tonal Sophistication**. By favoring background shifts over structural lines, we create a UI that feels fluid, integrated, and premium.

---

## 2. Colors & Surface Logic
The palette is rooted in a "Quiet Luxury" aesthetic—neutral foundations with a sophisticated teal-green (`primary: #3e6561`) that suggests both heritage and growth.

### The "No-Line" Rule
Standard UI relies on 1px borders to separate content. In this system, **100% opaque solid borders are prohibited for sectioning.** Boundaries must be defined through:
- **Background Color Shifts:** Use `surface-container-low` to define a sidebar against a `surface` background.
- **Tonal Transitions:** Use `surface-container-highest` to define a header area.

### Surface Hierarchy & Nesting
Think of the UI as physical layers of fine paper. 
- **Base Layer:** `surface` (#f9f9f9).
- **Secondary Containers:** `surface-container-low` (#f2f4f4).
- **Nested Priority Elements:** Place a `surface-container-lowest` (#ffffff) card inside a `surface-container-low` section to create a soft, natural "lift."

### The Glass & Gradient Rule
To prevent the UI from feeling flat, use **Glassmorphism** for floating elements (Dropdowns, Modals). Use the `surface` color at 80% opacity with a `backdrop-blur` of 12px.
- **Signature Textures:** For primary Action Buttons or high-value "Winning Odds" highlights, apply a subtle linear gradient from `primary` (#3e6561) to `primary_dim` (#315955) at a 145-degree angle. This adds "soul" and depth that flat hex codes lack.

---

## 3. Typography
We use **Inter** for its mathematical precision. The hierarchy is designed to highlight the "Editorial" nature of the data.

- **Display & Headline:** Use `display-md` and `headline-sm` for hero odds or race names. These should have a slight letter-spacing reduction (-0.02em) to feel tighter and more authoritative.
- **Data Points:** Use `title-md` for odds values. The high contrast between a `title-md` price and a `label-sm` horse name creates a clear "at-a-glance" scanning path.
- **Functional Labels:** Use `label-md` in `on_surface_variant` (#5a6061) for secondary data (e.g., "Weight," "Jockey," "Form").

---

## 4. Elevation & Depth
We eschew traditional drop shadows for **Tonal Layering**.

- **The Layering Principle:** Depth is achieved by stacking. A Slide-over should use `surface-container-lowest` to physically stand out against the `surface-dim` background of the main app.
- **Ambient Shadows:** For floating Modals, use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(45, 52, 53, 0.06);`. The shadow is tinted with the `on-surface` color to feel natural, not "dirty."
- **The Ghost Border:** If a boundary is strictly required for accessibility, use a **Ghost Border**: `1px solid` using the `outline-variant` token at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Data Tables (The Core)
- **Rule:** No vertical or horizontal divider lines.
- **Logic:** Use a `0.5rem` vertical gap between rows. The header row should use `label-md` in all-caps with a `0.05em` tracking. 
- **Interaction:** On hover, a row should transition its background to `surface-container-high`. This "spotlight" effect guides the eye without needing borders.

### Buttons
- **Primary:** Gradient fill (Primary to Primary-Dim). `rounded-md` (0.75rem). Text is `on_primary`. 
- **Secondary:** Transparent background with a `Ghost Border`.
- **Loading State:** Replace text with a centered, 2px stroke spinner using `on_primary` at 50% opacity. The button width must remain constant to avoid layout shift.

### Dropdowns & Selects
- **Surface:** Glassmorphic `surface_container_lowest` at 90% opacity.
- **Corners:** `rounded-md` (0.75rem).
- **Selection:** Use `primary_container` (#c0ebe5) with `on_primary_container` (#315954) for the active state.

### Skeleton Loaders
- **Style:** Avoid high-contrast greys. Use a subtle pulse animation between `surface-container-high` and `surface-container-highest`.
- **Shape:** Match the `rounded-md` corner radius of the actual component.

### Modals & Slide-overs
- **Backdrop:** `on_surface` (#2d3435) at 40% opacity with a `4px` blur.
- **Entry:** Slide-overs should animate from the right with a "spring" easing (`cubic-bezier(0.175, 0.885, 0.32, 1.1)`).

---

## 6. Do's and Don'ts

### Do:
- **Use Whitespace as a Divider:** Give data "room to breathe." If a table feels cramped, increase the padding, don't add a line.
- **Leverage Tonal Nesting:** Place `surface-container-lowest` elements on `surface-container-low` backgrounds to create hierarchy.
- **Maintain High Contrast for Odds:** Ensure the main odds values use the `on_surface` color for maximum readability.

### Don't:
- **No Heavy Borders:** Never use a 100% opaque border for a card or section.
- **No Pure Black Shadows:** Shadows must always be low-opacity and tinted by the UI's neutral tones.
- **No Generic Blue:** Stick to the `primary` teal-green (#3e6561) for all highlights to maintain the "Precision Paddock" identity.
- **Avoid "Default" Tables:** Never let a table look like a spreadsheet; use typographic scale and spacing to make it look like a curated list.

---

## 7. Component Specifics: Chrome Extension Context
Given the limited real estate of a Chrome Extension:
- **Header:** Use a fixed `surface-container-highest` header with `title-sm` typography to keep the focus on the data.
- **Action Chips:** Use `secondary_container` for status indicators (e.g., "Live," "Finished"). These should be small, using `label-sm` font.
- **Input Fields:** Use a `surface-container-lowest` fill with a `Ghost Border`. On focus, the border transitions to a 1px `primary` stroke.```