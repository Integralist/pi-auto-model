import type { ExtensionAPI, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth, type OverlayHandle, type TUI } from "@earendil-works/pi-tui";
import type { Configuration, PhysicalPair } from "./policy.ts";
import { formatPair } from "./settings.ts";

const auto = (ctx: ExtensionContext) => ctx.model?.provider === "pi-auto-model" && ctx.model.id === "auto" && ctx.model.api === "pi-virtual";
const key = (pair: PhysicalPair) => pair.provider + "\0" + pair.model + "\0" + pair.effort;

export function registerPopups(pi: ExtensionAPI, hooks: {
  policy(ctx: ExtensionContext): Configuration;
  current(ctx: ExtensionContext): PhysicalPair | undefined;
}) {
  let tui: TUI | undefined, theme: Theme | undefined, prior: PhysicalPair | undefined;
  let handle: OverlayHandle | undefined, timer: ReturnType<typeof setTimeout> | undefined;
  let generation = 0, sessionId: string | undefined;
  function clear() {
    generation++; if (timer) clearTimeout(timer); timer = undefined;
    const old = handle; handle = undefined;
    try { old?.hide(); } catch { /* Rendering failures cannot change routing. */ }
  }
  function observe(pair: PhysicalPair, ctx: ExtensionContext) {
    const previous = prior; prior = pair;
    if (!previous || key(previous) === key(pair) || !auto(ctx) || ctx.mode !== "tui" || !tui || !theme) return;
    clear();
    try {
      const settings = hooks.policy(ctx).switchPopup;
      if (!settings.enabled) return;
      const owner = generation, origin = sessionId, deadline = performance.now() + settings.durationMs;
      const localTui = tui;
      const from = "From " + formatPair(previous), to = "To   " + formatPair(pair);
      const boxWidth = Math.max("Auto switch".length + 2, visibleWidth(from), visibleWidth(to)) + 4;
      handle = localTui.showOverlay({
        invalidate() {},
        render(width) {
          try {
            const activeTheme = ctx.ui.theme ?? theme!, max = Math.max(0, width);
            if (max < 4) {
              return ["Auto switch", from, to]
                .map((line, index) => truncateToWidth(activeTheme.fg(index === 0 ? "accent" : "muted", line), max));
            }
            const inner = max - 4, border = (s: string) => activeTheme.fg("muted", s);
            const row = (raw: string, color: "muted" | "text") => {
              const clipped = truncateToWidth(raw, inner);
              return truncateToWidth(border("│ ") + activeTheme.fg(color, clipped) + " ".repeat(Math.max(0, inner - visibleWidth(clipped))) + border(" │"), max);
            };
            const label = truncateToWidth(" Auto switch ", Math.max(0, max - 3));
            const top = truncateToWidth(border("╭─") + activeTheme.fg("accent", label) + border("─".repeat(Math.max(0, max - 3 - visibleWidth(label))) + "╮"), max);
            const bottom = truncateToWidth(border("╰" + "─".repeat(Math.max(0, max - 2)) + "╯"), max);
            return [top, row(from, "muted"), row(to, "text"), bottom];
          } catch { return []; }
        },
      }, { nonCapturing: true, anchor: "top-right", width: boxWidth, margin: 1 });
      const expire = () => {
        if (owner !== generation || origin !== sessionId) return;
        const remaining = deadline - performance.now();
        if (remaining <= 0) { clear(); return; }
        timer = setTimeout(expire, Math.min(remaining, 2147483647)); timer.unref();
      };
      expire();
    } catch { clear(); }
  }
  pi.on("session_start", (_event, ctx) => {
    clear(); prior = hooks.current(ctx); sessionId = ctx.sessionManager.getSessionId();
    tui = undefined; theme = undefined;
    if (ctx.mode !== "tui") return;
    ctx.ui.setWidget("pi-auto-model.popup-host", (injectedTui, injectedTheme) => {
      tui = injectedTui; theme = injectedTheme;
      return { render: () => [], invalidate() {}, dispose() { clear(); tui = undefined; theme = undefined; } };
    });
  });
  pi.on("message_end", (event, ctx) => {
    if (!auto(ctx) || event.message.role !== "assistant") return;
    const model = ctx.modelRegistry.find(event.message.provider, event.message.model);
    const effort = event.message.thinkingLevel;
    if (!model || model.api === "pi-virtual" || !effort || effort === "max") return;
    observe({ provider: model.provider, model: model.id, effort }, ctx);
  });
  pi.on("model_select", (_event, ctx) => { clear(); prior = hooks.current(ctx); });
  pi.on("session_tree", (_event, ctx) => { clear(); prior = hooks.current(ctx); });
  pi.on("session_shutdown", () => { clear(); prior = undefined; tui = undefined; theme = undefined; sessionId = undefined; });
  return { clear };
}
