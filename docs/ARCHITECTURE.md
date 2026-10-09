# FocusDeck Architecture & Technical Blueprint

FocusDeck is an Electron desktop application designed for Windows 11 that combines an authoritative Pomodoro timer, ambient focus music, system silencing, and daily analytics with resilient crash recovery.

---

## 1. Process Separation Model

Electron runs two distinct environments. Keeping them isolated is essential for security and stability:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          MAIN PROCESS (Node.js)                         │
│  - Window Management (BrowserWindow)                                   │
│  - System Tray (Tray, Menu)                                            │
│  - Global Shortcuts (globalShortcut)                                   │
│  - System Silencer (Native Audio/Notification controls)                │
│  - Crash Recovery Ledger (silencer-state.json)                         │
│  - Local Data Storage (JSON / SQLite stats & settings)                 │
│  - App Lifecycle & Power Monitor (sleep/wake events)                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ IPC (invoke/handle & send/on)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        PRELOAD SCRIPT (Bridge)                         │
│  - Runs before DOM loads in an isolated context                       │
│  - Strictly exposes safe APIs via contextBridge.exposeInMainWorld      │
│  - Zero raw ipcRenderer exposed to renderer                            │
│  - Runtime validation of arguments                                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ window.focusDeckAPI
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        RENDERER PROCESS (Chromium)                     │
│  - React 18+ / 19 UI with Tailwind / Vanilla CSS                       │
│  - Pure presentation & user interactions                               │
│  - Timer state subscriber & display                                    │
│  - Audio Player (HTML5 Web Audio for ambient focus loops)              │
│  - Settings & Analytics Dashboard views                                │
└────────────────────────────────────────────────────────────────────────┘
```

### Why this boundary exists
- **Security**: The Renderer process runs web content. Even though our app doesn't load external URLs, web views can be vulnerable to Cross-Site Scripting (XSS). If `nodeIntegration` were enabled or if raw IPC were exposed, an attacker could execute arbitrary PowerShell commands on the user's Windows machine.
- **Single Source of Truth**: The timer state machine and silencer state live authoritatively in the **Main process** (with the core logic written in a decoupled pure TypeScript library). When the renderer window is minimized, hidden, or reloaded, the timer and silencing state continue without interruption.

---

## 2. Core Components

### 2.1 Pure TypeScript Timer State Machine (`src/core/timer`)
- **Zero Electron or Node dependencies**: Can run anywhere (Vitest unit tests, web browser, Node.js).
- **Finite States**:
  - `idle`: Timer reset, waiting for user start.
  - `focus`: Active 25-minute focus session (configurable).
  - `short_break`: 5-minute break session.
  - `long_break`: 15-minute break session (typically after 4 focus sessions).
  - `paused`: Session temporarily paused.
- **Transitions Matrix**:
  - `idle` ➔ `focus`
  - `focus` ➔ `paused`, `short_break`, `long_break`, `idle`
  - `paused` ➔ `focus` (resume), `short_break` (resume), `long_break` (resume), `idle` (reset)
  - `short_break` / `long_break` ➔ `focus`, `idle`, `paused`
  - Any illegal transition (e.g., `idle` ➔ `paused`) is rejected with a typed error or handled gracefully without side-effects.
- **Timestamp-Based Drift Prevention**:
  Instead of relying on `setInterval(() => count++, 1000)`—which drifts by seconds or minutes when Windows suspends background threads or enters Modern Standby—we store:
  - `startTime`: `Date.now()` timestamp when the session began.
  - `durationMs`: Total target duration.
  - `pauseStartTime`: Timestamp when pause began.
  - `totalPausedMs`: Cumulative pause duration.
  - `remainingMs`: Calculated on every tick as:
    $$\text{remainingMs} = \max(0, \text{durationMs} - (\text{Date.now()} - \text{startTime} - \text{totalPausedMs}))$$
  When Windows wakes from sleep, the timer immediately recalculates the correct elapsed time.

---

### 2.2 System Silencing Architecture (`src/main/silencer`)

#### The `SystemSilencer` Interface
```typescript
export interface SystemSilencer {
  silence(): Promise<SilencerResult>;
  restore(): Promise<SilencerResult>;
  isSilenced(): boolean;
}

export interface SilencerResult {
  success: boolean;
  previousState?: SilencerSnapshot;
  error?: string;
  limitationsNoted?: string[];
}

export interface SilencerSnapshot {
  timestamp: number;
  masterVolume: number; // 0-100
  isMuted: boolean;
  dndEngaged: boolean;
}
```

#### Windows 11 Technical Reality & Honest Documentation
1. **Windows 11 Do Not Disturb / Focus Assist**:
   - Microsoft deprecated the legacy Windows 10 Focus Assist registry toggles (`WpnUserService`, `NotificationManager`) in Windows 11 builds (22H2 / 23H2 / 24H2).
   - There is **no stable, documented Win32 or WinRT API** for third-party desktop apps to programmatically toggle Windows 11 Do Not Disturb system-wide without private APIs or administrative elevation that triggers UAC prompts or violates Store policies.
   - **FocusDeck Solution**:
     - System Master Volume / Notification Sound Muting: Managed via Windows Core Audio endpoint APIs (PowerShell Core Audio interop / native audio ducking).
     - App-level Focus Mode: Suppresses all FocusDeck-generated alerts and sound effects during focus.
     - Documented User Action: Transparently informs the user in Settings and UI that Windows 11 DND requires user-level activation (Win + N ➔ Focus), while FocusDeck reliably mutes system distracting audio and restores it automatically.
2. **Crash Recovery Ledger**:
   - Before applying any change to system volume or mute state, FocusDeck writes an atomic snapshot to `%APPDATA%\FocusDeck\silencer-session.json`.
   - If FocusDeck terminates normally: The silencer restores system audio and deletes the recovery file.
   - If FocusDeck or Windows crashes: On subsequent launch, FocusDeck inspects `silencer-session.json`. If an un-restored session exists, it immediately restores original volume/mute levels and logs an event.

---

### 2.3 Audio Engine (`src/renderer/audio`)
- Bundled royalty-free focus audio tracks (e.g., White Noise, Rain Ambience, Lo-Fi Binaural Beats) stored in `src/assets/audio/`.
- Played using the HTML5 Web Audio API in the Renderer process.
- Features:
  - Seamless loop playback without clicking/gap.
  - Smooth fade-in on session start and fade-out on session complete or pause.
  - Independent volume slider decoupled from system master volume.

---

### 2.4 Local Persistence (`src/main/storage`)
- Stores user settings (`settings.json`) and session analytics (`stats.json` or SQLite).
- Daily Stats Record:
  ```typescript
  export interface DailyStats {
    date: string; // YYYY-MM-DD
    focusSessionsCompleted: number;
    totalFocusMinutes: number;
    shortBreaksCompleted: number;
    longBreaksCompleted: number;
    currentStreakDays: number;
  }
  ```

---

## 3. IPC Contract Specification (`src/shared/types/ipc.ts`)

All communication between Renderer and Main processes follows a strictly typed contract:

| Channel / Invocation | Direction | Payload | Return / Description |
| :--- | :--- | :--- | :--- |
| `timer:start` | Renderer ➔ Main | `{ phase?: TimerPhase }` | `TimerSnapshot` |
| `timer:pause` | Renderer ➔ Main | `void` | `TimerSnapshot` |
| `timer:resume` | Renderer ➔ Main | `void` | `TimerSnapshot` |
| `timer:reset` | Renderer ➔ Main | `void` | `TimerSnapshot` |
| `timer:skip` | Renderer ➔ Main | `void` | `TimerSnapshot` |
| `timer:tick` | Main ➔ Renderer | `TimerSnapshot` | Emitted every 1000ms |
| `timer:phase-complete` | Main ➔ Renderer | `{ completedPhase: TimerPhase, nextPhase: TimerPhase }` | Emitted on zero |
| `silencer:status` | Renderer ➔ Main | `void` | `SilencerSnapshot` |
| `silencer:toggle` | Renderer ➔ Main | `{ enable: boolean }` | `SilencerResult` |
| `settings:get` | Renderer ➔ Main | `void` | `UserSettings` |
| `settings:update` | Renderer ➔ Main | `Partial<UserSettings>` | `UserSettings` |
| `stats:get-today` | Renderer ➔ Main | `void` | `DailyStats` |
| `hotkey:register` | Renderer ➔ Main | `{ accelerator: string }` | `{ success: boolean, error?: string }` |

---

## 4. Project Folder Structure

```
focusdeck/
├── .github/
│   └── workflows/
│       └── build-and-test.yml
├── docs/
│   ├── ARCHITECTURE.md
│   └── WINDOWS_SILENCING.md
├── src/
│   ├── core/                      # Pure TypeScript business logic (Zero dependencies)
│   │   ├── timer/
│   │   │   ├── state-machine.ts
│   │   │   ├── timer-engine.ts
│   │   │   └── __tests__/
│   │   │       ├── state-machine.test.ts
│   │   │       └── timer-engine.test.ts
│   │   └── stats/
│   │       ├── streak-calculator.ts
│   │       └── __tests__/
│   ├── main/                      # Electron Main Process (Node.js)
│   │   ├── index.ts               # Entry point, lifecycle, window creation
│   │   ├── tray.ts                # Windows 11 system tray icon & menu
│   │   ├── hotkeys.ts             # Global keyboard shortcuts
│   │   ├── notifications.ts       # Windows desktop notifications
│   │   ├── silencer/
│   │   │   ├── silencer-interface.ts
│   │   │   ├── windows-silencer.ts
│   │   │   └── crash-recovery.ts
│   │   └── storage/
│   │       ├── store.ts
│   │       └── stats-repo.ts
│   ├── preload/                   # Electron Preload Script
│   │   ├── index.ts               # contextBridge APIs
│   │   └── exposed-api.ts
│   ├── renderer/                  # React Application
│   │   ├── index.html
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── components/
│   │   │   │   ├── TimerDisplay.tsx
│   │   │   │   ├── Controls.tsx
│   │   │   │   ├── AudioPlayer.tsx
│   │   │   │   ├── StatsCard.tsx
│   │   │   │   └── SettingsModal.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useTimer.ts
│   │   │   │   └── useAudio.ts
│   │   │   └── assets/
│   │   │       └── audio/
│   │   │           ├── white-noise.mp3
│   │   │           └── rain.mp3
│   └── shared/                    # Shared Types & Constants
│       ├── types/
│       │   ├── timer.ts
│       │   ├── silencer.ts
│       │   ├── settings.ts
│       │   ├── stats.ts
│       │   └── ipc.ts
│       └── constants/
├── electron-builder.json          # Windows NSIS packaging configuration
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── vitest.config.ts
```

---

## 5. Security & Risk Analysis

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Electron XSS / Remote Execution** | Critical | Strict CSP in `index.html`. `contextIsolation: true`, `nodeIntegration: false`. No dynamic code evaluation (`eval`), only typed IPC. |
| **Timer Drift on Laptop Sleep** | High | Pure timestamp calculations (`Date.now() - startTime`). Electron `powerMonitor` listens to `suspend` and `resume` to re-sync immediately. |
| **System Audio Stuck Muted on Crash** | High | Persistent journal in `%APPDATA%\FocusDeck\silencer-session.json`. Startup hook scans and restores original state immediately. |
| **Windows 11 DND API Unavailability** | Medium | Audio ducking/muting implemented reliably; DND system behavior honestly presented to user with clear guidance. |
| **System Tray Icon Disappearing on Windows Explorer Crash** | Low | Listen to `TaskbarCreated` Windows message to re-instantiate tray icon automatically. |

---

## 6. Development Phases Roadmap

- **Phase 0: Plan (Current)** — Architecture, IPC design, folder map, Windows 11 silencer reality, and risk ledger.
- **Phase 1: Scaffold** — Vite + React + TypeScript + Electron + Vitest + ESLint/Prettier setup with verification scripts.
- **Phase 2: Timer Core + Tests** — Pure TypeScript state machine with 90%+ test coverage, timestamp math, drift prevention.
- **Phase 3: UI + Tray + IPC** — React frontend, system tray with dynamic tooltip and menu, typed preload bridge.
- **Phase 4: Silencer + Crash Recovery** — Windows audio ducking/muting, persistent crash ledger, recovery on reboot.
- **Phase 5: Music, Notifications, Stats** — Ambient audio loops, Windows native notifications, daily stats & streak tracking.
- **Phase 6: Settings, Hotkey, Polish** — Custom durations, hotkey registration (`globalShortcut`), UI theme & smooth transitions.
- **Phase 7: Packaging & Release** — `electron-builder` NSIS installer build, test run, README, and final verification checklist.
