# ER Mario

Play Elden Ring as Super Mario 64's Mario: his real moveset, health meter and camera in the Lands Between, from your own ROM.

**ER Mario is made by [deltarooo](https://github.com/deltarooo).** All credit for the mod goes to them.

- Original project: https://github.com/deltarooo/er-mario
- Report bugs and ask questions there: https://github.com/deltarooo/er-mario/issues
- Upstream release packaged here: [v0.4.0](https://github.com/deltarooo/er-mario/releases/tag/v0.4.0) (commit [`89dd281`](https://github.com/deltarooo/er-mario/tree/89dd281f718f5fce55a239be12729b232e5b3b60))
- **Built by SIGF from commit [`89dd281f718f5fce55a239be12729b232e5b3b60`](https://github.com/deltarooo/er-mario/tree/89dd281f718f5fce55a239be12729b232e5b3b60)** with the changes described below, on a disposable build machine (AWS EC2 i-0e67d08436a64bcef (c6i.2xlarge, Windows Server 2022, terminated after the build); rustc 1.99.0, MSVC link 14.44.35229, clang-cl 23.1.3 (hudhook's MinHook, as upstream's build.ps1)). The app installs these SIGF builds, not binaries from the author.

> **Beta.** Nobody at SIGF has played this build yet. Back up your saves.
> Bugs in the mod itself go to the author's issue tracker above; problems with the one-click install go to this repository's issues.

## What you need

- **Elden Ring** ([Steam](https://store.steampowered.com/app/1245620/)): exe 2.7.1.0 (worldwide) or 2.7.1.1 (Japan) only: the mod stays off on any other version (src/version.rs, fromsoftware-rs 59fbd3b).
- **Super Mario 64** (your own US ROM: Mario's textures, animations, sounds and menu icons, read by the mod; never launched).
- me3 0.13.0: install it with me3_installer.exe: Play starts it from where its installer puts it, with er-mario.me3, offline with Easy Anti-Cheat off (https://github.com/garyttierney/me3/releases/tag/v0.13.0).
- sm64-rom: your own Super Mario 64 (USA) ROM (.z64, .v64 or .n64): the app finds it on your PC or you pick it, and checks it by SHA-1. SIGF never ships or downloads it.
- libsm64 er-mario 89dd281: sm64.dll is built on your PC by the app on first install, from er-mario's own patched libsm64 (https://github.com/deltarooo/er-mario/tree/89dd281f718f5fce55a239be12729b232e5b3b60/libsm64).
- Windows and the [SIGF app](https://sigf.ai).

## Install

In the SIGF app, open **ER Mario** in the catalog, press **Install**, then **Play**. **Restore** puts your game folders back exactly as they were.
The app follows `mashup.json` in this repository: every download is pinned by sha256. The files come from the release [`v0.4.0`](../../releases/tag/v0.4.0).

### How to play

- Play Elden Ring as Mario with Super Mario 64's real moveset: triple jumps, wall kicks, long jumps, ground pounds, punches and kicks that hurt enemies.
- Press Play: me3 starts Elden Ring offline. On an older SIGF app, open er-mario.me3 in %LOCALAPPDATA%\SIGF\profiles\sigf-er-mario\eldenring.
- First start: a box on the title screen builds Mario from your ROM. When it says Setup complete, press any button, then press Play again.
- Start a new character (the mod has its own save). SM64's 8-wedge health meter is your health; levels, weapons and stats change nothing.
- F9 switches between Lakitu's camera and Elden Ring's. Xbox pads work as they are; PlayStation and other pads through Steam Input.

### Good to know

- You need Elden Ring on Steam (exe 2.7.1.0, or 2.7.1.1 in Japan: on any other version the mod stays off), me3 0.13.0 installed with its me3_installer.exe, and your own Super Mario 64 (USA) ROM, which SIGF never ships or downloads.
- The first install builds Mario's library (sm64.dll) on your PC: the app downloads a compiler and Python once (about 80 MB) and the pinned libsm64 sources, then builds for a few minutes. SIGF built er_mario.dll from the author's source, changed only to load that library.
- Offline only, never online: me3 starts Elden Ring with Easy Anti-Cheat off and its own save ER0000_mario.sl2, so your normal save is untouched. Restore leaves that save.
- Work in progress: you may clip through some elevators, cutscenes show a crumpled Mario, and big bosses can go wild after a throw. Report bugs to the author with the two files of the logs folder in the profile folder.
- Streaming: use window or display capture, or the HUD does not show.

## Your own ROM, a library built on your PC

SIGF ships nothing from Nintendo. The author's `er_mario.dll` compiles libsm64 (decompiled Super Mario 64 code and Mario's mesh from the SM64 decompilation) into the mod, so SIGF built its own from the author's commit with one patch, `sigf/patches/0001-load-libsm64-from-sm64-dll-at-runtime.patch`: the mod loads libsm64 at runtime from `sm64.dll` next to it, with the same 30 functions, and holds none of its code. Nothing else differs from the author's source. The SIGF app then asks for two things and builds the second on your PC:

- **Your own Super Mario 64 (USA) ROM.** The app looks for it in your Downloads, Desktop, Documents and ROM folders (also inside a `.zip`), or you pick it. It checks the SHA-1 (`9bef1128717f958171a4afac3ed78ee2bb4e86ce`, after converting a `.v64` / `.n64` dump to `.z64` order) and copies it into the mod folder as `baserom.us.z64`. It is never uploaded. Restore deletes the copy.
- **`sm64.dll`**, built once on your PC by `build-sm64-dll.sh` (in the release) from the author's own patched libsm64 (the `libsm64/` folder of the same commit) and Mario's geometry from [n64decomp/sm64](https://github.com/n64decomp/sm64) `06ec56d`, all fetched by the app from those pinned commits and checked by sha256, with a compiler (w64devkit 2.10.0) and Python 3.12.10 the app downloads once from their official releases. That library holds decompiled Nintendo code, so SIGF never builds it for others and never hosts it.

## What this repository holds

ER Mario is MIT, but its repository holds libsm64 (decompiled Super Mario 64 code), which SIGF does not host, and the author's release DLL has that code and Mario's mesh compiled in, so SIGF installs neither. This repository holds **only SIGF's own files**, never the author's:

1. This README, `sigf/patches/` (our patch, applied to the author's commit before the build), `sigf/` (the script that built the recipe, for reference) and `mashup.json` (the SIGF app recipe).
2. The release `v0.4.0`:

| Asset | Size | sha256 | What it is |
|---|---|---|---|
| `er-mario-eldenring.zip` | 1381541 B | `b91367f039c850369044c4d2eee375666ae8a26c8dd4529ae146775656e40f88` | the mod folder (`ER-Mario/`, unpacked into the app's profile folder): the SIGF build of `er_mario.dll` from the pinned commit with our patch, the author's me3 profile `er-mario.me3`, `er_mario.ini` (the author's, with `rom = baserom.us.z64` and the update check off), the patched README, and under `licenses/` the licenses of er-mario, fromsoftware-rs, hudhook, MinHook, libsm64 and the list of Rust crates linked in. |
| `build-sm64-dll.sh` | 3105 B | `83075086673a2ea7d4deb5eddacd62fe1bb3cfd5269244c3a2ce8e6dee62e0b8` | ours (MIT): the script the SIGF app runs on the player's PC to build `sm64.dll`, with no network; see "Your own ROM, a library built on your PC". |

The sha256 of every file inside the zips is in `mashup.json` (`contents`).

## Licenses

| Part | License | Where |
|---|---|---|
| ER Mario (the SIGF build of `er_mario.dll`, the me3 profile, the settings, the README) | MIT, Copyright deltarooo | `ER-Mario/licenses/er-mario-MIT.txt` in the zip |
| fromsoftware-rs, hudhook, MinHook and the other Rust crates linked into `er_mario.dll` | MIT OR Apache-2.0 (fromsoftware-rs), MIT (hudhook), BSD-2-Clause (MinHook), each crate its own (listed) | `ER-Mario/licenses/` in the zip |
| `build-sm64-dll.sh`, `sigf/` (ours, the patch included) | MIT | this README |
| libsm64 and Mario's geometry (n64decomp/sm64), built on the player's PC | libsm64: CC0-1.0; the decompiled code and geometry are Nintendo's, licensed to nobody. Never stored here | https://github.com/deltarooo/er-mario/tree/89dd281f718f5fce55a239be12729b232e5b3b60/libsm64 |

## Why this repository exists

The SIGF app (https://sigf.ai) installs mods from recipes (`mashup.json`) whose downloads are pinned release files. This repository makes ER Mario installable in one click, credited to deltarooo. If you are the author and want anything changed or taken down, open an issue here.
