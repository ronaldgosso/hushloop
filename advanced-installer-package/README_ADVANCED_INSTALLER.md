# 📦 HushLoop — Advanced Installer Bundling Package

This directory contains everything required to produce a production-ready Windows 11 Setup Installer (`HushLoop-Setup-1.1.5.exe`) using **Advanced Installer**.

---

## 🔍 Root Cause of Previous Git Releases Not Opening

The executables originally committed to Git failed to launch on Windows due to an Electron runtime module conflict:
1. `package.json` specifies `"type": "module"` (ESM).
2. Electron's internal `webPreferences.preload` loader uses synchronous CommonJS `require()`.
3. In earlier builds, the preload script was built as an ES module (`index.js`). When Electron attempted to load it, Node threw `ERR_REQUIRE_ESM: require() of ES Module not supported`, silently aborting the renderer window.
4. **Resolution**: The build pipeline now compiles `src/preload/index.ts` to `dist-electron/preload/index.cjs` via `esbuild` as a pure CommonJS bundle, and `src/main/index.ts` explicitly prioritizes loading `index.cjs`.
5. The application binary in `app/HushLoop.exe` has been verified and launches cleanly.

---

## 📁 Package Contents

```
advanced-installer-package/
├── HushLoop.aip                 <-- Pre-configured Advanced Installer Project file
├── README_ADVANCED_INSTALLER.md <-- This comprehensive guide
├── app/                         <-- Ready-to-bundle application binaries
│   ├── HushLoop.exe             <-- Main Windows executable (v1.1.4)
│   ├── resources/               <-- app.asar (with index.cjs) and unpacked assets
│   ├── locales/                 <-- Chromium locale packs
│   ├── chrome_*.pak             <-- UI resources
│   ├── *.dll                    <-- Audio (ffmpeg), DirectX (d3dcompiler_47), ANGLE (libEGL, libGLESv2)
│   └── v8_context_snapshot.bin  <-- V8 runtime snapshot
├── graphics/                    <-- High-resolution branding assets
│   ├── app_icon.ico             <-- Multi-resolution ICO (256x256, 128, 64, 48, 32, 16)
│   ├── uninstall_icon.ico       <-- Dedicated uninstaller ICO
│   ├── dialog_sidebar.bmp       <-- Installer wizard sidebar image (164x314)
│   ├── header_banner.bmp        <-- Installer wizard header banner (500x60)
│   ├── hushloop_app_icon.png    <-- High-res PNG logo
│   └── hushloop_logo.svg        <-- Vector logo lockup
└── eula/                        <-- EULA & License agreements
    ├── license.rtf              <-- Rich Text Format for Advanced Installer EULA dialog
    └── license.txt              <-- Plain text version
```

---

## 🚀 How to Bundle the EXE in Advanced Installer

### Method A: Open the Pre-Configured Project (Fastest)

1. Launch **Advanced Installer**.
2. Go to **File ➔ Open** and select:
   `c:\Users\Neptune\Documents\Projects\hushloop\advanced-installer-package\HushLoop.aip`
3. Click the **Build** button in the top toolbar (or press `F7`).
4. Advanced Installer will compile and place `HushLoop-Setup-1.1.4.exe` inside the `Output\` folder.
5. Click **Run** (`Ctrl + F5`) to test the installer!

---

### Method B: Configure via Advanced Installer Wizard (Step-by-Step)

If you prefer to create a new project from scratch in Advanced Installer:

#### 1. Project Type
- Choose **Installer ➔ Simple** (or **Enterprise / Professional**).
- Project Language: **English (United States)**.

#### 2. Product Details
- **Product Name**: `HushLoop`
- **Product Version**: `1.1.4`
- **Company / Manufacturer**: `Ronald Gosso`
- **Support / Website URL**: `https://ronaldgosso.github.io/hushloop_site/`
- **Help URL**: `https://github.com/ronaldgosso/hushloop/issues`
- **Icon**: Browse to `graphics\app_icon.ico`

#### 3. Package Type (Install Parameters)
- **Package Type**: **64-bit package (x64)**.
- **Installation Type**: **Per-user only** OR **Per-machine if user is administrator** (Recommended: *Per-machine with fallback to per-user*).
- **Application Folder**: `[ProgramFilesFolder]\HushLoop`

#### 4. Files & Folders
- In the left pane, navigate to **Application Folder** (`APPDIR`).
- Click **Add Folder** (or drag & drop).
- Select all contents of the `app\` directory (`HushLoop.exe`, `resources\`, `locales\`, DLL files, etc.).
- Ensure `HushLoop.exe` is marked as the **Main Executable**.

#### 5. Shortcuts
- Right-click `HushLoop.exe` in the Files view:
  - Select **New Shortcut To ➔ Desktop**: Name it `HushLoop`.
  - Select **New Shortcut To ➔ Start Menu - Programs**: Name it `HushLoop`.
- Shortcut Icon: Set to `graphics\app_icon.ico`.

#### 6. Dialogs & UI Theme
- Go to the **Themes** tab.
- Choose **Surface** or **Classic** (or **Metro**).
- Under Dialog Images:
  - **Sidebar / Welcome Image**: Select `graphics\dialog_sidebar.bmp`.
  - **Header Banner**: Select `graphics\header_banner.bmp`.
- Under **License Agreement**:
  - Point the EULA file to `eula\license.rtf`.

#### 7. Exit Dialog (Launch on Finish)
- In the **Dialogs** tab, go to **ExitDialog**.
- Check the option: **"Launch application at the end of installation"**.
- Target: `[#HushLoop.exe]`.

#### 8. Build
- Click **Build** (`F7`).
- Name the output file: `HushLoop-Setup-1.1.4.exe`.

---

## 🏷️ Releasing to GitHub

Once `HushLoop-Setup-1.1.4.exe` is generated:

1. Test installing on your Windows PC:
   - Run the installer.
   - Confirm desktop and Start Menu shortcuts are created.
   - Launch HushLoop and verify the glassmorphic window and tray icon appear.
2. Go to **GitHub ➔ ronaldgosso/hushloop ➔ Releases**:
   - Click **Draft a new release**.
   - Tag version: `v1.1.4`.
   - Title: `HushLoop v1.1.4 — Active Pomodoro Desktop Timer for Windows 11`.
   - Drag and drop `HushLoop-Setup-1.1.4.exe` into the release binaries section.
   - Publish the release!
