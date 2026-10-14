import type { ExtensionAPI, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, type OverlayHandle, type TUI } from "@earendil-works/pi-tui";
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
      handle = localTui.showOverlay({
        invalidate() {},
        render(width) {
          try {
            const activeTheme = ctx.ui.theme ?? theme!;
            return ["Auto switch", "From " + formatPair(previous), "To   " + formatPair(pair)]
              .map((line, index) => truncateToWidth(activeTheme.fg(index === 0 ? "accent" : "muted", line), Math.max(0, width)));
          } catch { return []; }
        },
      }, { nonCapturing: true, anchor: "top-right", width: "70%", margin: 1 });
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
