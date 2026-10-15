# HushLoop Design System: Dentale EHR Inspired

This design system is inspired by the **Dentale EHR Healthcare Desktop App** on Dribbble ([Shot 27482436](https://dribbble.com/shots/27482436-Dentale-EHR-Healthcare-Desktop-App)). It brings a futuristic, medical-grade clarity and high-tech dark glassmorphism aesthetic to HushLoop on Windows 11.

![HushLoop Design Mockup](images/hushloop_design_mockup.jpg)

---

## 1. Visual Philosophy & Core Aesthetics

- **Futuristic Dark Glassmorphism**: High-contrast, deep slate canvas with frosted glass panels (`backdrop-filter: blur(20px)`), subtle translucent border hairpins (`1px solid rgba(255, 255, 255, 0.08)`), and soft layered elevation shadows.
- **Electric Cyan Energy (`#00F2FE` / `#4EEDDE`)**: Used for active focus state, glowing timer rings, and primary action indicators.
- **Coral / Rose Accents (`#FF4B72` / `#FF6584`)**: Used for break sessions, critical badges, and subtle completion highlights.
- **Sleek Floating Pill Dock**: Floating pill container at the bottom with icon controls and glowing hover states.
- **Medical-Grade Precision**: Crisp typographic hierarchy, circular progress indicators, and compact telemetry cards.

---

## 2. Design Tokens

### 2.1 Color Palette

| Token | Hex / Value | Usage |
| :--- | :--- | :--- |
| `--bg-base` | `#0D1117` | Root desktop application background |
| `--bg-surface` | `rgba(22, 27, 34, 0.75)` | Glassmorphic cards and containers |
| `--bg-surface-elevated` | `rgba(33, 38, 45, 0.85)` | Modal dialogs, dropdowns, floating dock |
| `--border-subtle` | `rgba(255, 255, 255, 0.08)` | Hairline container borders |
| `--border-focus` | `rgba(0, 242, 254, 0.4)` | Active focus border highlight |
| `--color-cyan-glow` | `#00F2FE` | Glowing timer ring, focus mode indicator |
| `--color-cyan-mint` | `#4EEDDE` | Secondary focus gradient, accents |
| `--color-coral` | `#FF4B72` | Break mode, warm notification accents |
| `--color-coral-soft` | `#FF6584` | Break mode gradient / secondary |
| `--text-primary` | `#F0F6FC` | Highest hierarchy text, timer numbers |
| `--text-secondary` | `#8B949E` | Labels, metric headers, tooltips |
| `--text-muted` | `#484F58` | Inactive icons, subtle captions |

### 2.2 Glassmorphism & Elevation

```css
/* Glass Card Utility */
.glass-panel {
  background: rgba(22, 27, 34, 0.7);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 16px 40px -12px rgba(0, 0, 0, 0.5),
              0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  border-radius: 20px;
}

/* Floating Bottom Pill Dock */
.pill-dock {
  background: rgba(22, 27, 34, 0.85);
  backdrop-filter: blur(28px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 9999px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6),
              0 0 20px rgba(0, 242, 254, 0.15);
}
```

### 2.3 Typography

- **Font Family**: Modern geometric sans (`Outfit`, `Inter`, or system `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`).
- **Timer Display**: Monospace or tabular figures (`font-variant-numeric: tabular-nums`) with wide tracking for clear glanceability from across the desk.
- **Pill Badges**: `font-size: 11px`, `letter-spacing: 0.08em`, `font-weight: 700`, uppercase with glowing pulse dot.

---

## 3. UI Component Blueprint

1. **Circular Timer Gauge**:
   - SVG circle with `stroke-dasharray` and `stroke-dashoffset` for 60fps hardware-accelerated progress animation.
   - Dual-color linear gradient (`#00F2FE` ➔ `#4EEDDE`) during focus sessions.
   - Coral transition (`#FF4B72`) during break sessions.
   - Smooth glowing drop-shadow (`drop-shadow(0 0 16px rgba(0, 242, 254, 0.35))`).

2. **Floating Pill Dock**:
   - Fixed at bottom center of the window.
   - Primary Play/Pause toggle with cyan pulse background.
   - Skip forward button.
   - Volume & Soundscape picker trigger.
   - Settings cog.

3. **Telemetry & Stats Card**:
   - Floating on right or toggled view.
   - Discrete mini gauges for:
     - Today's completed focus sessions (e.g., `4/4`).
     - Total focus minutes.
     - Current streak days with fire badge.

---

## 4. Light & Eco-Print Advertising System (Zero Ink Waste)

For physical distribution (printed posters, office flyers, roll-up displays, desk handouts) where dark backgrounds would consume excessive ink cartridges or cause paper saturation, HushLoop specifies a dedicated **Light & Eco-Print Suite**:

### 4.1 Print Palette & Ink-Saver Profile

| Token | Value | Print Purpose |
| :--- | :--- | :--- |
| Canvas Background | `#FFFFFF` (Pure White) | 0% ink usage across >85% of total surface area |
| Secondary Cards | `#F8FAFC` / `#FFFFFF` | Ultra-clean card elevations with crisp `#E2E8F0` hairline borders |
| Primary Ink | `#0F172A` (Rich Slate/Charcoal) | 100% black contrast without toner bleed; razor-sharp typography |
| Secondary Ink | `#475569` (Medium Slate) | Subheads, feature descriptions, and specs |
| Accent Cyan / Blue | `#0284C7` (Electric Ocean) | High-contrast brand identity and focal points |
| Accent Teal | `#0D9488` (Mint Pine) | Audio synthesis waves & active state indicators |
| QR Code | `#000000` on `#FFFFFF` | Maximum optical reflectance ratio for phone camera sensors |

### 4.2 Print Specifications
- **Ink Coverage**: Strictly <10% total ink coverage (compared to ~85% on standard dark posters).
- **Physical Output Ratios**:
  - **9:16 Portrait**: 1080×1920 (Roll-up vertical displays, digital signage, vertical posters).
  - **4:5 / A4 Flyer**: 1080×1350 (Desk flyers, pinboards, conference handouts).
- **QR Code Target**: Minimum 35mm physical print size with a 4-module quiet zone margin to guarantee 100% first-pass scan reliability under office lighting or sunlight.
