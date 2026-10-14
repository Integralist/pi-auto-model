import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { Configuration, PhysicalPair, Tier } from "./policy.ts";
import { automaticEfforts, formatPair, physicalCatalog, validateMappings } from "./settings.ts";

const slots: readonly (Tier | "classifier")[] = ["trivial", "moderate", "complex", "frontier", "classifier"];

export async function configureMappings(
  ctx: ExtensionContext, config: Configuration, valid: () => boolean,
): Promise<Configuration | undefined> {
  if (ctx.mode !== "tui") throw new Error("Use the policy JSON file for headless/RPC configuration.");
  if (!physicalCatalog(ctx.modelRegistry).length) throw new Error("No physical models are available. Configure a provider in Pi before /automodel configure.");
  const draft = structuredClone(config);
  while (valid()) {
    const labels = slots.map((slot) => slot + ": " + formatPair(slot === "classifier" ? draft.classifier : draft.tiers[slot]));
    const selection = await ctx.ui.select("Auto mappings — configured availability, not live entitlement", [...labels, "Review and save", "Cancel"]);
    if (!valid() || selection === undefined || selection === "Cancel") return undefined;
    if (selection === "Review and save") {
      if (!await ctx.ui.confirm("Save all Auto mappings?", labels.join("\n"))) return undefined;
      if (!valid()) return undefined;
      return validateMappings(draft, ctx.modelRegistry);
    }
    const index = labels.indexOf(selection);
    if (index < 0) continue;
    const slot = slots[index]!;
    const search = await ctx.ui.input("Search provider, model ID or display name", "Blank lists all available physical models");
    if (!valid() || search === undefined) return undefined;
    const models = physicalCatalog(ctx.modelRegistry, search);
    if (!models.length) {
      ctx.ui.notify("No matching physical model. Configure the requested combination in Pi; Auto cannot create providers.", "warning");
      continue;
    }
    const modelLabels = models.map((model) => model.provider + "/" + model.id + " — " + model.name);
    const selected = await ctx.ui.select("Choose a physical model", modelLabels);
    if (!valid() || selected === undefined) return undefined;
    const model = models[modelLabels.indexOf(selected)];
    if (!model) continue;
    const chosen = await ctx.ui.select("Choose exact automatic effort (no max)", automaticEfforts(model));
    if (!valid() || chosen === undefined) return undefined;
    if (!automaticEfforts(model).includes(chosen as PhysicalPair["effort"])) throw new Error("Selected effort is no longer supported. Choose an exact effort again.");
    const pair: PhysicalPair = { provider: model.provider, model: model.id, effort: chosen as PhysicalPair["effort"] };
    if (slot === "classifier") draft.classifier = { ...draft.classifier, ...pair };
    else draft.tiers[slot] = pair;
  }
  return undefined;
}
