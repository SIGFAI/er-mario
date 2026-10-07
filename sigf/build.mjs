// ER Mario (deltarooo, MIT): play Elden Ring as Super Mario 64's Mario, through libsm64, as a Rust DLL loaded by me3.
// Bring your own ROM (Pj 2026-10-06, library/QC.md section 2): SIGF ships nothing Nintendo-derived.
//
// Upstream's er_mario.dll compiles libsm64 (decompiled SM64 code and Mario's mesh from the SM64 decompilation) into
// the mod, so neither it nor the author's release zip is ever used. Instead:
//   - SIGF builds er_mario.dll from the pinned commit + patches/0001-load-libsm64-from-sm64-dll-at-runtime.patch on a
//     disposable AWS builder (library/QC.md section 4; source.json "built"): the mod then loads libsm64 at runtime
//     from sm64.dll next to it and holds no libsm64 code (checked: linker map, exports, imports, strings; notes.md).
//   - player_build: sm64.dll is built on the player's PC from er-mario's own patched libsm64 (libsm64/ of the same
//     commit) + Mario's geometry files from n64decomp/sm64 06ec56d, with w64devkit 2.10.0 and Python 3.12.10
//     (build-sm64-dll.sh, ours, MIT), into the mod folder.
//   - own_copies: the player's own Super Mario 64 (USA) ROM, SHA-1 9bef1128...86ce, into the mod folder as
//     baserom.us.z64 (er_mario.ini rom = baserom.us.z64; paths.rs reads it and builds Mario's textures, sounds and
//     menu icons from it on the first launch, into the mod folder's package/).
// What SIGFAI/er-mario hosts (release v0.4.0), nothing else: er-mario-eldenring.zip (the SIGF er_mario.dll, me3
// profile, settings, README, licenses) and build-sm64-dll.sh.
//   SIGF_LIBRARY_BUILDS=<dir> node library/er-mario/build.mjs      (outputs: library/lib.mjs)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { asset, card, dl, emit, player, rawAt, zipAsset } from '../lib.mjs';
import { builtArtifacts, builtField, sourceOf } from '../um-gta5-passthrough/sigf-build.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ID = 'er-mario', VERSION = '0.4.0', NAME = 'ER Mario';
const SRC = sourceOf(ID);
const UP = { repo: SRC.repo, tag: SRC.release, commit: SRC.commit, authors: ['deltarooo'] };
const FSRS = { repo: 'https://github.com/vswarte/fromsoftware-rs', commit: '59fbd3b3b7daaf14aca47c9f73530493dba6bc79' }; // Cargo.toml
const DECOMP = { repo: 'https://github.com/n64decomp/sm64', commit: '06ec56df7f951f88da05f468cdcacecba496145a' }; // libsm64/import-mario-geo.py:6-7
const PATCH = '0001-load-libsm64-from-sm64-dll-at-runtime.patch';
const TAGLINE = 'Play Elden Ring as Super Mario 64\'s Mario: his real moveset, health meter and camera in the Lands Between, from your own ROM.';
// Build inputs, fetched by the app on the player's PC (never by SIGF for a release): sha256 and size read 2026-10-07
// (the er-mario archive twice, byte-identical; geo/model are the files import-mario-geo.py fetches, same pins as
// library/mario64-in-minecraft).
const INPUTS = [
  { name: 'libsm64', url: `${UP.repo}/archive/${UP.commit}.zip`, sha256: '386dcc925b3e5041d834176888c2ff728a9e375973308bf6453343588131eadc', size: 985330, unpack: true, root: `er-mario-${UP.commit}/libsm64` },
  { name: 'geo.inc.c', url: `https://raw.githubusercontent.com/n64decomp/sm64/${DECOMP.commit}/actors/mario/geo.inc.c`, sha256: 'fc276e326a9cb22f55dfae8349b0ff746b9a7db7c108074a47508f3e2b225364', size: 82801 },
  { name: 'model.inc.c', url: `https://raw.githubusercontent.com/n64decomp/sm64/${DECOMP.commit}/actors/mario/model.inc.c`, sha256: '3c28959f915121cd94daab7941e144078098b3cac668fdc70817f4127c549e8f', size: 382288 },
];
const ROM = { game: 'sm64', label: 'Super Mario 64 (USA)', names: ['super mario 64', 'mario 64', 'sm64'],
  rom: { as: 'baserom.us.z64', sha1: ['9bef1128717f958171a4afac3ed78ee2bb4e86ce'], extensions: ['.z64', '.v64', '.n64'], size: 8388608, format: 'n64' } };
const DST = '{app}'; // the mod folder: er_mario.dll, sm64.dll and the ROM side by side (paths.rs mod_dir)

// Upstream's me3 profile (release v0.4.0 ER-Mario/er-mario.me3), unchanged: offline launch with Easy Anti-Cheat off,
// its own save ER0000_mario.sl2, the native DLL and the package folder the mod builds from the ROM.
const ME3 = [
  'profileVersion = "v1"',
  '# ER Mario. Offline only: me3 launches the game with Easy Anti-Cheat off.',
  '# A separate save file keeps your normal (online) save untouched.',
  'savefile = "ER0000_mario.sl2"',
  '',
  '[[supports]]',
  'game = "eldenring"',
  '',
  '[[natives]]',
  'path = "er_mario.dll"',
  '',
  '# Mario\'s model, textures and menu icons, built from your SM64 ROM on the first launch',
  '[[packages]]',
  'id = "er-mario"',
  'path = "package"',
  '',
].join('\n');
// Upstream's er_mario.ini (release v0.4.0) with two SIGF values: rom names the copy the app placed, and the update
// check is off (it points at the author's releases, whose DLL SIGF does not install; the app updates this one).
const INI = [
  '# ER Mario settings',
  '',
  '# Your Super Mario 64 ROM (US version, .z64, .n64 or .v64). Leave empty to use the ROM file',
  '# placed in this folder. Can be a full path.',
  '# (SIGF: the SIGF app places your own copy here as baserom.us.z64.)',
  'rom = baserom.us.z64',
  '',
  '# Camera: sm64 (Lakitu, default) or elden (Elden Ring\'s own). F9 switches in game.',
  'camera = sm64',
  '',
  '# Thrown bosses go limp (ragdoll) and get back up. off: they just land.',
  'boss_ragdoll = on',
  '',
  '# Bosses that never go ragdoll when Mario throws them (character ids, e.g. 4750, 3251).',
  'no_ragdoll =',
  '',
  '# Checks GitHub at launch and every 5 minutes, and says when a newer version is out (title',
  '# screen, and a small note in game).',
  '# off: never checks.',
  '# (SIGF: off, because a newer version comes through the SIGF app, not the author\'s release zip.)',
  'update_check = off',
  '',
  '# Developer keys (F3-F6, F8, F10-F12) and detailed logging. Leave at 0.',
  'debug = 0',
  '',
].join('\r\n');

const files = builtArtifacts(ID);
const text = (b) => Buffer.from(b.toString('utf8').replace(/\r\n/g, '\n').replace(/\n/g, '\r\n'));
const mod = zipAsset(`${ID}-eldenring.zip`, [
  { name: 'ER-Mario/er_mario.dll', data: files.get('er_mario.dll') },
  { name: 'ER-Mario/er-mario.me3', data: Buffer.from(ME3) },
  { name: 'ER-Mario/er_mario.ini', data: Buffer.from(INI) },
  { name: 'ER-Mario/README.md', data: files.get('README.md') },
  { name: 'ER-Mario/licenses/er-mario-MIT.txt', data: files.get('LICENSE') },
  { name: 'ER-Mario/licenses/rust-crates.txt', data: files.get('rust-crates.txt') },
  { name: 'ER-Mario/licenses/fromsoftware-rs-MIT.txt', data: text(await rawAt(FSRS.repo, FSRS.commit, 'LICENSE-MIT')) },
  { name: 'ER-Mario/licenses/hudhook-MIT.txt', data: text(await rawAt(UP.repo, UP.commit, 'vendor/hudhook/LICENSE')) },
  { name: 'ER-Mario/licenses/minhook-BSD-2-Clause.txt', data: text(await rawAt(UP.repo, UP.commit, 'vendor/hudhook/vendor/minhook/LICENSE.txt')) },
  { name: 'ER-Mario/licenses/libsm64-CC0.md', data: text(await rawAt(UP.repo, UP.commit, 'libsm64/LICENSE.md')) },
]);
// Ours, LF line endings whatever the checkout (the hash is the file's).
const script = asset('build-sm64-dll.sh', Buffer.from(fs.readFileSync(path.join(here, 'build-sm64-dll.sh'), 'utf8').replace(/\r\n/g, '\n')));
const assets = [mod, script];

const make = (urls, set) => {
  const z = set.find(a => a.name.endsWith('.zip'));
  const sh = set.find(a => a.name.endsWith('.sh'));
  return {
    id: `sigf/${ID}`,
    version: VERSION,
    name: NAME,
    tagline: player(ID).tagline ?? TAGLINE,
    how_to_play: player(ID).howToPlay,
    kind: 'mashup', // SM64 does not run: libsm64 reads Mario's textures, animations and audio from the player's ROM
    games: [
      { game: 'eldenring', role: 'host', label: 'Elden Ring', engine: 'Elden Ring (FromSoftware) + me3 native DLL (Rust) + libsm64 (C)', apps: { steam: '1245620' },
        runtime: 'exe 2.7.1.0 (worldwide) or 2.7.1.1 (Japan) only: the mod stays off on any other version (src/version.rs, fromsoftware-rs 59fbd3b)' },
      { game: 'sm64', role: 'guest', label: 'Super Mario 64', uses: 'your own US ROM: Mario\'s textures, animations, sounds and menu icons, read by the mod; never launched' },
    ],
    requires: [
      { id: 'me3', version: '0.13.0', license: 'Apache-2.0; linked, not shipped', page: 'https://github.com/garyttierney/me3/releases/tag/v0.13.0',
        note: 'install it with me3_installer.exe: Play starts it from where its installer puts it, with er-mario.me3, offline with Easy Anti-Cheat off' },
      { id: 'sm64-rom', note: 'your own Super Mario 64 (USA) ROM (.z64, .v64 or .n64): the app finds it on your PC or you pick it, and checks it by SHA-1. SIGF never ships or downloads it' },
      { id: 'libsm64', version: `er-mario ${UP.commit.slice(0, 7)}`, license: 'CC0-1.0; built on your PC, never shipped', page: `${UP.repo}/tree/${UP.commit}/libsm64`,
        note: 'sm64.dll is built on your PC by the app on first install, from er-mario\'s own patched libsm64' },
    ],
    install: [
      { game: 'eldenring', strategy: 'profile', loader: 'me3', files: [
        { src: z.name, dst: '{app}', root: 'ER-Mario', unpack: true, contents: z.contents, ...dl(z, urls) },
      ] },
    ],
    own_copies: [{ ...ROM, step: 'eldenring', to: DST }],
    player_build: [{
      id: 'sm64-dll', label: 'Mario\'s library (sm64.dll)', step: 'eldenring', minutes: 5,
      toolchain: ['w64devkit-2.10.0', 'python-3.12.10'],
      script: { name: sh.name, ...dl(sh, urls) },
      inputs: INPUTS,
      outputs: [{ name: 'sm64.dll', to: DST }],
    }],
    // me3 launch (SIGF app 0.1.2+): the player's me3 (me3_installer.exe) with upstream's er-mario.me3 from the profile
    // folder, offline, its own save. Older apps ignore the field: the card notes keep the manual way (open the file).
    launch: [{ game: 'eldenring', me3: { profile: '{app}/er-mario.me3' } }],
    platforms: ['windows'],
    files: set.map(a => ({ name: a.name, ...dl(a, urls) })),
    source: {
      repo: UP.repo, license: 'MIT', upstream_license: SRC.license, tag: UP.tag, commit: UP.commit,
      hosted: `https://github.com/SIGFAI/${ID}`,
      patches: [`sigf/patches/${PATCH}`],
      built: builtField(ID),
      linked: [
        { name: 'libsm64 (er-mario\'s patched copy, libsm64/)', repo: UP.repo, commit: UP.commit, license: 'CC0-1.0 (built on the player\'s PC, never shipped)' },
        { name: 'n64decomp/sm64 (Mario geometry, actors/mario)', repo: DECOMP.repo, commit: DECOMP.commit, license: 'none (built on the player\'s PC, never shipped)' },
        { name: 'fromsoftware-rs', repo: FSRS.repo, commit: FSRS.commit, license: 'MIT OR Apache-2.0 (linked into er_mario.dll)' },
      ],
    },
    media: {},
    built_by: { author: UP.authors[0], authors: [...UP.authors, 'libsm64 contributors', 'Vincent Swarte (fromsoftware-rs)'], packaged_by: 'SIGF' },
    idea_by: UP.authors[0],
    built_at: '2026-10-07T00:00:00.000Z',
    // Never installed together (the app refuses either order): Minecraft-Ring's dinput8.dll proxy loads into every Elden Ring start, me3's included.
    conflicts: ['sigf/minecraft-ring'],
    ...card(UP.repo),
    notes: player(ID).notes,
  };
};

emit({ slug: ID, version: VERSION, assets, fixtureAssets: null, make });
