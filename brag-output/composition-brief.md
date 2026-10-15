# Hyperframes Composition Brief: HushLoop

## Objective
Create a short, elegant, high-impact launch-style brag video for HushLoop (Active Pomodoro Desktop Timer for Windows 11).

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: `landscape` — 1920x1080
- Duration: 20 seconds

## Source Material
- Project root: `c:\Users\Neptune\Documents\Projects\hushloop`
- Assets referenced:
  - `assets/branding/lockup-hushloop-2.svg` & `docs/images/hushloop_logo.svg`
  - `docs/images/hushloop_app_icon.png`
  - `docs/images/hushloop_design_mockup.jpg`
  - Live site reference: `https://ronaldgosso.github.io/hushloop_site/`
- Primary code read:
  - `src/renderer/src/components/TimerGauge.tsx`
  - `src/renderer/src/components/ControlDock.tsx`
  - `src/renderer/src/components/TelemetryCard.tsx`
  - `src/renderer/src/index.css`
  - `docs/DESIGN_SYSTEM.md`
  - `docs/WINDOWS_SILENCING.md`
- Product name: HushLoop
- Tagline / strongest claim: "Active Pomodoro Desktop Timer for Windows 11 — Automated Distraction Silencing • Procedural Web Audio Soundscapes • Native Tray & Global Hotkeys"
- Key UI moments to recreate:
  1. The SVG circular timer gauge with gradient progress arc (`#00F2FE` -> `#4EEDDE`), pulsing glow, and orbiting comet.
  2. The floating bottom glass pill dock with interactive Play/Pause and soundscape selector.
  3. The soundscape selector popover showing procedural audio synthesis (432Hz Alpha Waves, Rain Ambience).
  4. Active Distraction Silencer status card (`winmm.dll` audio ducking with Write-Ahead Crash Ledger safeguard).
  5. Coral Rose break transition (`#FF4B72`) and final brand lockup.

## Creative Direction
- Tone preset: `polished`
- Creative direction: Futuristic Windows 11 Fluent dark luxury with medical-grade clarity and acoustic calm.
- Angle: Your timer shouldn't drift when your laptop sleeps, and focus shouldn't require downloading 2GB of audio loops. HushLoop turns the desktop Pomodoro into a high-precision, crash-resilient acoustic sanctuary.
- Hook: "DEEP FOCUS, SILENCED."
- Outro / punchline: "Deep work, uninterrupted. Built for Windows 11."
- Avoid: Generic SaaS jargon, template slide transitions, unreadable rapid text flashes.

## Visual Identity
- Background Base: `#0A0D14` / `#0D1117` (Deep space obsidian)
- Glass Panels: `rgba(22, 27, 34, 0.72)` with 20px backdrop-filter blur and `1px solid rgba(255, 255, 255, 0.08)`
- Primary Accent: `#00F2FE` (Electric Cyan)
- Secondary Accent: `#4EEDDE` (Mint Cyan)
- Break / Alert Accent: `#FF4B72` (Coral Rose)
- Text Primary: `#F0F6FC`
- Text Secondary: `#94A3B8`
- Display Font: `Plus Jakarta Sans`, sans-serif
- Monospace Font: `JetBrains Mono`, monospace (tabular figures)

## Storyboard
Follows `brag-output/brag-plan.md` (20.0s total):
1. **Scene 1 (0.0s - 4.0s)**: "DEEP FOCUS, SILENCED." — Aurora canvas, neon ignition of the circular gauge from 25:00 on simulated dock click.
2. **Scene 2 (4.0s - 9.0s)**: "Zero-Asset Soundscapes" — Floating pill dock popover reveals 432Hz Alpha Waves & Rain Ambience generated purely with Web Audio API math.
3. **Scene 3 (9.0s - 14.5s)**: "Active Distraction Silencing" — Windows Multimedia audio ducking with Write-Ahead Crash Ledger and live streak telemetry.
4. **Scene 4 (14.5s - 20.0s)**: "Dynamic Phase Shift & Outro" — Gauge turns coral for short break; official HushLoop Acoustic Loop logo lockup lands with author attribution.

## Audio
- Audio role: Warm ambient electronic bed with clean rhythmic pulse and subtle futuristic bass.
- Music: `happy-beats-business-moves-vol-11-by-ende-dot-app.mp3`
- Music treatment: Smooth 1.2s fade-in, clean rhythmic bed, slight ducking during feature highlights, gentle fade-out under the final logo.
- Strong cues:
  - `1.60s`: Gauge ignition / comet burst
  - `3.70s`: Transition into dock spotlight
  - `5.80s` & `6.34s`: Soundscape card checkmark reveal
  - `8.96s` / `9.50s`: Crash ledger shield lock
  - `17.91s`: Final logo resolution
- SFX posture: Polished UI tactile clicks, soft electronic surge on ignition, bell chime on break transition.
