import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function autoModel(pi: ExtensionAPI): void {
  pi.on("session_start", (_event, ctx) => {
    if (ctx.modelRegistry.find("github-copilot", "auto")) {
      throw new Error("github-copilot/auto already exists; choose a free ID");
    }
    pi.registerVirtualModel({
      provider: "github-copilot",
      id: "auto",
      name: "Auto",
      thinkingLevels: ["high", "xhigh"],
      route(_request, routeContext) {
        const model = routeContext.modelRegistry.find(
          "github-copilot", "gpt-6.1-sol",
        );
        if (!model || model.api === "pi-virtual") {
          throw new Error("Select an available physical startup model");
        }
        return { model, thinkingLevel: "xhigh" };
      },
    });
  });
}
