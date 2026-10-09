# Contributing to FocusDeck 🤝

Thank you for your interest in contributing to **FocusDeck**! FocusDeck is an active Pomodoro desktop app tuned for Windows 11, designed to protect deep focus through automated distraction silencing and ambient sound synthesis.

We welcome contributions of all levels. Please review this guide to understand our architectural principles, coding standards, and branch workflow.

---

## 🛠️ Prerequisites & Setup

Ensure your local development environment meets the following requirements:

- **Operating System**: Windows 11 (primary target) or Windows 10
- **Node.js**: v20.0.0 or higher (tested with Node v24+)
- **npm**: v10.0.0 or higher
- **Git**: v2.30+
- **GitHub CLI (`gh`)**: Recommended for pull request workflows

### Getting Started

```powershell
# 1. Clone your fork or the repository
git clone https://github.com/ronaldgosso/hushloop.git
cd hushloop

# 2. Install dependencies
npm install

# 3. Launch local development mode
npm run dev
```

---

## 🌿 Branching & Pull Request Workflow

FocusDeck adheres to a strict **trunk-based feature branching** model:

1. Every logical feature or phase must be developed on a dedicated branch created from `main`:
   ```powershell
   git checkout main
   git pull origin main
   git checkout -b feature/<feature-name>
   ```
2. Make atomic commits using [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat(...)`: New feature or user capability
   - `fix(...)`: Bug fix
   - `docs(...)`: Documentation changes
   - `test(...)`: Adding or updating test suites
   - `refactor(...)`: Code refactoring without behavior change
3. Run the verification suite locally before pushing (see below).
4. Open a pull request against `main`:
   ```powershell
   git push -u origin feature/<feature-name>
   gh pr create --title "feat: descriptive PR title" --base main --head feature/<feature-name>
   ```

---

## 🏗️ Architectural Guidelines

When contributing code, adhere to our five architectural pillars:

### 1. Pure TypeScript Core (`src/core/timer`)

- The core Pomodoro state machine (`TimerStateMachine`) and drift-resistant engine (`TimerEngine`) must maintain **zero dependencies** on Electron, Node.js built-ins, or the browser DOM.
- Use epoch timestamp deltas (`Date.now() - startTime - pausedDurationMs`) to remain drift-immune across Windows sleep and minimize cycles.
- Maintain **90%+ test coverage** on all state transitions and edge cases.

### 2. Modular Silencing (`src/main/silencer`)

- All audio manipulation must implement the `SystemSilencer` interface.
- Never alter system audio without first persisting the original volume snapshot to the write-ahead ledger (`CrashRecoveryLedger` at `%APPDATA%\FocusDeck\silencer-session.json`).
- If Windows terminates unexpectedly, the startup recovery hook must automatically restore the user's audio.

### 3. Strict Preload Isolation (`src/preload`, `src/shared`)

- Enable `contextIsolation: true` and `nodeIntegration: false` at all times.
- Renderer processes never access Node `fs`, `child_process`, or raw IPC senders. All communication goes through the typed `window.focusDeckAPI` bridge.

### 4. Zero-Asset Procedural Audio (`src/renderer/src/audio`)

- To satisfy strict Content Security Policies (`media-src 'self' data:; connect-src 'self'`), do not bundle or download large MP3 files.
- Synthesize all acoustic environments (Alpha waves, Rain noise, Chimes) procedurally using the Web Audio API (`AudioContext`, `BiquadFilterNode`, `OscillatorNode`).

### 5. Dentale EHR Design System & Visual Assets

- Follow the futuristic dark glassmorphic design system (`#0D1117`, `#161B22`, glowing cyan `#00F2FE`, coral break `#FF4B72`).
- **Zero ASCII art**: All diagrams, workflows, and mockups in documentation must be high-resolution rendered image assets saved to `docs/images/`.

---

## 🧪 Verification Commands

Before opening a pull request, ensure every check passes:

```powershell
# 1. Run full unit test suite
npm test

# 2. Verify test coverage (must meet or exceed 90%)
npm run test:coverage

# 3. Lint code for style and syntax
npm run lint

# 4. Check Prettier formatting
npm run format

# 5. Verify production Vite & TypeScript builds
npm run build:renderer

# 6. Verify Windows packaging (EXE & MSI)
npm run package:exe   # Builds NSIS setup .exe
npm run package:msi   # Builds WiX enterprise .msi
npm run package:portable # Builds standalone .exe
```

---

## 📄 License

By contributing to FocusDeck, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
