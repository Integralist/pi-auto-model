import { Theme, type ExtensionUIContext } from "@earendil-works/pi-coding-agent";
import { TuiMainScreen, TuiAltScreen, type Component, type OverlayOptions, type OverlayHandle, type TUI, type Terminal } from "@earendil-works/pi-tui";

export function createUI(mode: "regular" | "fullscreen" = "regular") {
  const output: string[] = [];
  let input: ((data: string) => void) | undefined;
  const terminal: Terminal = {
    columns: 100, rows: 30, kittyProtocolActive: false,
    start(onInput) { input = onInput; }, stop() {}, drainInput: async () => {}, write: (text) => { output.push(text); },
    moveBy() {}, hideCursor() {}, showCursor() {}, clearLine() {}, clearFromCursor() {},
    clearScreen() {}, setTitle() {}, setProgress() {}, setProgramStatus() {},
  };
  const tui: TUI = mode === "regular" ? new TuiMainScreen(terminal) : new TuiAltScreen(terminal);
  const theme = new Theme(
    { accent: "#7a9cff", muted: "#888888", text: "#dddddd", thinkingXhigh: "#7a9cff" } as ConstructorParameters<typeof Theme>[0],
    { selectedBg: "#222222" } as ConstructorParameters<typeof Theme>[1], "truecolor",
  );
  const notices: { text: string; type?: string }[] = [], statuses = new Map<string, string | undefined>();
  const dialogs: { title: string; choices?: string[] }[] = [], answers: (string | boolean | undefined)[] = [];
  const widgets = new Map<string, Component & { dispose?(): void }>();
  const overlays: { component: Component; options?: OverlayOptions; handle: OverlayHandle }[] = [];
  const showOverlay = tui.showOverlay.bind(tui);
  tui.showOverlay = (component, options) => {
    const handle = showOverlay(component, options);
    overlays.push({ component, options, handle }); return handle;
  };
  const ui: ExtensionUIContext = {
    theme,
    select: async (title, choices) => { dialogs.push({ title, choices }); return answers.shift() as string | undefined; },
    input: async (title) => { dialogs.push({ title }); return answers.shift() as string | undefined; },
    confirm: async (title) => { dialogs.push({ title }); return answers.shift() === true; },
    notify: (text, type) => { notices.push({ text, type }); },
    setStatus: (key, value) => { statuses.set(key, value); },
    setWidget(key, content) {
      widgets.get(key)?.dispose?.(); widgets.delete(key);
      if (typeof content === "function") widgets.set(key, content(tui, theme));
    },
    custom: async () => { throw new Error("Passive Auto popup must not use custom UI."); },
    onTerminalInput: () => () => {}, setWorkingMessage() {}, setWorkingVisible() {},
    setWorkingIndicator() {}, setHiddenThinkingLabel() {}, setFooter() {}, setHeader() {},
    setTitle() {}, pasteToEditor() {}, setEditorText() {}, getEditorText: () => "",
    editor: async () => undefined, addAutocompleteProvider() {}, setEditorComponent() {},
    getEditorComponent: () => undefined, getAllThemes: () => [], getTheme: () => undefined,
    setTheme: () => ({ success: true }), getToolsExpanded: () => false, setToolsExpanded() {},
  };
  return { ui, tui, terminal, notices, statuses, dialogs, answers, widgets, overlays, output, sendInput(data: string) { input?.(data); } };
}
