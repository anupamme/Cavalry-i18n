<!--
[INPUT]: 依赖 injector/native 候选源、Qt 6.9.2公开头与同bundle Cavalry 2.8 arm64 Frameworks。
[OUTPUT]: 说明字体、FPS、标题、帮助、布局和Fast候选的边界与回归要求。
[POS]: 原生候选模块入口；加载、搜索消费与生命周期由消费端另验。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
# Native font and help-popup candidate

## Scope

This module holds a Cavalry 2.8 macOS arm64 candidate.
It does not enter the Cavalry 2.7 build or release path.
The default shipped product does not consume it.
The explicit macOS native debug preview can embed the verified artifact at build time.
Its coordinator installs that artifact into a selected Cavalry 2.8 copy.
The candidate directory itself does not sign, install, or start an app.

The candidate reuses the existing Mach-O parser and UTF-8 glyph policy.
It verifies the native getter and four direct Skia targets.
It obtains the executable path with `_NSGetExecutablePath`, then canonicalizes that path.
It resolves `libCore`, `libExtensionLayer`, `libskia`, and `libApi` from that executable's bundle.
Only the exact derived `Contents/Frameworks` paths satisfy image lookup.
Another loaded image with the same basename cannot satisfy that lookup.
Original calls use two-level target imports and retain the existing forward design.
Static fixups prove binding scope, not every prior interposer-chain outcome.
The candidate build does not measure runtime chain behavior.

The combined candidate also contains one Fast Quick Add regular-expression adapter
and one source-bound help-popup layout adapter.
It uses typed Qt 6.9.2 public headers and the selected bundle's QtCore runtime.
The layout adapter also links the selected bundle's QtGui and QtWidgets runtimes.
The 2.7 translator and default release build do not consume this candidate.

## Runtime boundary

`activeLocale` remains the only language source.
The wrapper calls its original once, then publishes one `gLocale` snapshot for the exact Extension caller.
The wrapper does not catch or replace original getter exceptions.

GetPath accepts the FPS direct owner or the verified Core→cache→producer chain.
FPS requires Core return `+0x69a70` and Extension return `+0x23c7bc`.
The candidate verifies the FPS `MakePathFromText` call at Extension `+0x23c7b8`.
This owner stays separate from the Viewport quality cache owner.
It copies at most 512 UTF-8 bytes into the existing text snapshot.
It selects one of three 27-entry fixed UI lanes from `gLocale`.
The fixed lanes include Transform tool hints, Edit Shape tool hints, and Viewport quality text.
It replaces the font only for an exact owner and exact text match.
Unknown ABI, caller, owner, locale, text, font, or path forwards to the original.
The FPS owner accepts only the approved locale prefix and a non-empty suffix.
It does not parse or rewrite the formatted frame-rate suffix.

Timeline, Viewport, and GetPath share the existing verified-text fallback core.
The core tests the existing CoreText-resolved font first.
Only a whole-string coverage rejection enables three fixed PostScript names.
`CTFontCreateWithName` receives `PingFangSC-Regular`, `PingFangTC-Regular`, or `HiraginoSans-W3`.
It does not receive the family names `PingFang SC`, `PingFang TC`, or `Hiragino Sans`.
Hans order is PingFangSC-Regular, PingFangTC-Regular, then HiraginoSans-W3.
Hant order is PingFangTC-Regular, PingFangSC-Regular, then HiraginoSans-W3.
Japanese order is HiraginoSans-W3, PingFangTC-Regular, then PingFangSC-Regular.
Each candidate must cover the complete UTF-8 string before selection.
Font creation, cache, style, and size failures stop the candidate search.
The core keeps its eight font slots and acquires their lock once per call.
A selected font slot is created synchronously inside the verified draw or measure call.
The original call receives that font immediately; no later repaint is scheduled.
The exact native getter is the existing `registerNodesSetup` boundary before `Gui::setupGui`.
Static startup order is `loadPlugins` → `registerAppComponents` →
`registerNodesSetup` → `activeLocale`, then `Gui::setupGui`.
`CavalryApp` calls `loadPlugins` before `setupStyle` and `Gui::setupGui`.
That static ordering is not a live first-frame acceptance result.
Decision caching stays disabled.
No source text enters diagnostics or files.

## Main window title boundary

The candidate checks the arm64 `Gui::updateAppTitle` caller in the selected
`libExtensionLayer.dylib` and its two-level import of `fmt::v10::vformat`.
The check locks the caller return PC, format address and length, descriptor,
source-object copy/empty branches, fmt UUID, exported symbol, and entry bytes.
The candidate links only the same bundle's `libfmt.10.dylib`.

The adapter calls the original formatter once. It then projects only the
`Project` and `Scene` labels and true empty project/scene placeholders.
It reads 24-byte libc++ source objects at `values+0xd8` and `values+0xc0`.
The caller keeps those objects alive until `Gui::updateAppTitle` returns.
The adapter accepts the short-string empty tag only with the exact borrowed
address and fallback text. Pointer identity alone does not distinguish short
user names from fallbacks. A real `None` or `Untitled` name remains byte-for-byte
unchanged. The Restricted suffix also remains unchanged.
The adapter reuses the existing `gLocale` snapshot and does not inspect or
write project, scene, profile, or model state.

The display labels reuse `colorWindow.header.project` and
`colorWindow.header.scene`. The empty project value reuses the native
`cli.log.none` equivalent; the empty scene name reuses `recovery.untitled`.
The compiled title policy is a display projection, not a new catalog consumer.
Its static tests do not prove a loaded runtime hook or a live window title.

## Help description boundary

The build-time producer binds 512 reviewed descriptions to official metadata.
The main `addCompletionsToTextEdit` caller requests the four API namespaces.
The `formatForCompleter` caller adds `cavalry/ctx/def` only for the exact
`javaScriptDeformer` condition. Both paths call the same metadata loader and
the same `TextEdit::addScriptDocumentationEntry` import.
The generated tables keep 384 main roots and 17 def roots separate.
`getBoundingBox` occurs in both namespaces with different English sources.
The 111 nested class descriptions remain outside both proven root consumers.
The 384+17 roots still do not prove all 512 reviewed descriptions are consumed.

The candidate source links the same bundle's `libCavalryUI.dylib`.
It checks the Extension/UI identities, the def condition and both exact callers.
It uses the existing `gLocale`; it does not add a language getter.
Only an exact runtime key and exact English description admit a projection.
A shadow object copies each C++ member and changes description at offset zero.
The input object, keys and other fields retain their values.
The original is called once and original exceptions propagate.
The vendor return type is not proven.
The two verified callers do not consume returned registers.
Only their exact return PCs enter the C++ description dispatcher.
The dispatcher selects the main or def table by caller identity.
An arm64 veneer forwards every other caller directly to the original UI import.
It uses only x16/x17 to compare LR and retains argument/result registers,
stack/frame pointers, original LR, and the vendor return path.
The combined candidate must still pass a new live help readback for each artifact.
The generated table and hidden fixture do not prove popup consumption.

## Help popup layout boundary

The same metadata producer emits a second compile-time table with all 401 root
API names, kinds, parameter rows, and return rows. This table contains no help
body, translation, user input, or runtime file path.

The adapter interposes `QLayout::activate` but changes a layout only when its
return address equals the reviewed `DocumentationPopup::setContent` call site.
The constructor binds the original QtWidgets export from the selected bundle
and checks the CavalryUI call bytes, import stub, UUIDs, and Qt version.
An unknown call invokes the original `activate` exactly once.

The first approved popup measures the 401 metadata rows with hidden QLabel
probes that inherit the current popup's font, text format, style, padding, and
alignment. The process retains one integer width. The adapter performs no
catalog scan, locale lookup, or file I/O after that measurement.

The shared catalog width is an upper bound, not a fixed width. Each description
keeps its natural width when it fits. A wider description wraps inside the
remaining row width. The title aligns with the first body line. The adapter
does not set a fixed height, font, style sheet, hard line break, padding, or
line height. It activates only parameter and return row layouts whose wrapper
widgets are not explicitly hidden. The vendor root activation and `adjustSize`
remain in their original order and each runs once. No event loop is pumped.

The hidden Qt fixture exercises the 401-row table and source-bound long/short
help examples in Hans, Hant, and Japanese. It checks the width ceiling, the
host minimum-width property, full visible-label geometry, no early wrapping,
stable wrapping and natural heights across content changes, and one cached
width per locale. It compares fresh and reused geometry for
`getBoundingBox` → `getChildren` and `addDynamic` → `addPreCompOverride`,
and checks hidden-row restoration. These assertions do not guarantee
pixel-identical rendering.
The fixture uses the Qt-host test font, not Cavalry's rendered font; it does
not replace live three-language or font-matrix acceptance.

## Fast Quick Add boundary

The adapter admits only the fixed arm64 `libExtensionLayer.dylib` UUID and
the reviewed options instruction, C1 call, and import stub.
It changes options from zero to `UseUnicodePropertiesOption` only at the exact
Fast return PC and only for the exact pattern `[\\s\\-_\\W]`.
It checks the caller, original options, and admission before comparing the
pattern, so unrelated C1 calls take the shortest pass-through path.
Unknown callers, nonzero options, and failed admission call the original C1.
The original constructor runs once, and its exceptions propagate.
The adapter does not rewrite plugin names, model data, or search results.

The explicit build requires a public-header prefix with QtCore, QtGui, and
QtWidgets headers from Qt 6.9.2. It links the selected App's QtCore, QtGui, and
QtWidgets framework binaries.
The candidate uses versioned `@rpath` framework install names, with
`@loader_path` and `@executable_path/../Frameworks` runpaths.
The static contract requires one two-level import from each selected 6.9.2
QtCore, QtGui, and QtWidgets framework. It rejects an absolute build path and a
flat namespace. No second Qt runtime is bundled.
The C1 policy test checks only the option gate, single original call, and
exception propagation. It is not evidence of a loaded hook or live search.

## Migration regression rule

Freeze the successful source and artifact before moving this code.
Reuse its verified adapters instead of replacing them by assumed equivalence.
For each new artifact, check Simplified Chinese, Traditional Chinese, and Japanese across Timeline list names/time-bar names (including measurement and drawing), Viewport names/quality text, and fixed tool hints.
Recheck one approved visible Fast search label in each locale, its exact result, and same-owner clear restoration.
The JA canary result does not transfer to the merged candidate.
A merged candidate has since passed one visible Twist-name query and same-owner clear in each target locale.
That bounded readback does not complete the font matrix, title/help regression, hidden plug-ins, English aliases, or first paint.
A hidden plug-in counts only when the same owner proves its query result.
A compile or static ABI pass does not replace these live checks.
A failed artifact cannot inherit a successful predecessor's acceptance.
Record stable display and first visible paint separately.
Delivery requires correct glyphs on the first visible paint after injection.
A later repaint, a test helper, or a different app process does not satisfy that requirement.
Do not add a timer or post-window resource rewrite to hide an initial glyph failure.

## Candidate build

Run the explicit arm64-only candidate gate with a read-only Cavalry 2.8 Frameworks directory and explicit Qt 6.9.2 public-header prefix:

```sh
CAVALRY_QT_PREFIX=/path/to/qt-6.9.2-header-prefix \
  bash injector/native/build_candidate.sh /path/to/Cavalry.app/Contents/Frameworks
```

The prefix must contain `include/QtCore/qconfig.h`; the build verifies its
6.9.2 macros. It never links QtCore from that prefix.

The build creates a fresh temporary dylib.
It checks vendor arm64 identities, required exports, two-level Api/Skia/fmt/UI/QtCore fixups, and the exact three-instruction GetPath veneer.
It generates separate 384-main and 17-def help tables plus a 401-root layout
table from official MetaData.
It compiles and runs the pure getter/GOT/FPS-owner, Fast C1 policy, help
shadow, and hidden Qt layout tests.
It links the real help veneer to a vendor-free register probe.
That probe checks unknown-caller argument, return and indirect-result transparency,
plus exact main/def LR dispatch.
The fixup gate separately checks the real UI import binding.
It compiles a target-arm64 `fmt::v10::vformat` ABI probe and records its assembly
with the exact caller and fmt entry bytes in `title-format-abi-proof.json`.
It rejects a UUID that belongs to another FAT slice, using the actual checker.
It never loads the candidate or starts Cavalry.

x86_64 has no verified ABI contract.
Do not create an x86 candidate by guessing offsets or bytes.
Do not add this command to `npm run build:injector` or a release workflow.

## Acceptance boundary

The candidate source and temporary build alone do not prove product consumption.
The retained 5009 artifact predates the FPS owner source and remains unchanged.
The FPS owner candidate has passed a fresh build and static contracts.
The same candidate now shows readable FPS labels and changing numbers in all three languages.
Each language run also records advancing playback time and the enabled display setting.
Japanese OCR recognizes the ASCII colon as a fullwidth colon; exact punctuation remains unverified.
These scoped stable-display results do not prove first paint or the combined font matrix.
Earlier results remain bound to their recorded source and artifact.
They do not transfer to this merged candidate.
Each combined title/help/layout/Fast artifact requires its own build and
three-language acceptance. Bind results to the exact artifact.
Current scoped live results and unverified surfaces are recorded in the
project migration ledger; they do not transfer to another artifact.
The coordinator uses a disposable fixed-layout profile and does not start Cavalry.
Normal bundle loading, GUI behavior, app lifecycle, and whole-UI first paint require separate live acceptance.
The current 2.7 translator remains the only shipped injector.

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
