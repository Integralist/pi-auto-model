import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { getSupportedThinkingLevels, type Api, type Model } from "@earendil-works/pi-ai";
import { validateConfiguration, type Configuration, type PhysicalPair, type RoutingRegistry } from "./policy.ts";

export type Preferences = { version: 2; mode: Configuration["mode"] };

export function validatePreferences(raw: unknown): Preferences {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Invalid Auto preferences: expected an object.");
  const value = raw as Record<string, unknown>;
  const keys = Object.keys(value).sort().join(",");
  const current = value.version === 2 && keys === "mode,version";
  const legacy = value.version === 1 && keys === "enabled,mode,version" && typeof value.enabled === "boolean";
  if ((!current && !legacy) || typeof value.mode !== "string"
    || !["model-and-effort", "effort-only"].includes(value.mode)) {
    throw new Error("Invalid Auto preferences: expected version 2 and a supported mode.");
  }
  // Old development preferences can retain mode, but never select Auto.
  return { version: 2, mode: value.mode as Preferences["mode"] };
}

export async function readSettings(path: string): Promise<unknown> {
  try { return JSON.parse(await readFile(path, "utf8")); }
  catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return undefined;
    throw new Error("Cannot read Auto settings at " + path + ". Correct or remove this file.", { cause: error });
  }
}

export async function writeSettings(path: string, value: unknown, valid: () => boolean = () => true): Promise<void> {
  const data = JSON.stringify(value, null, 2) + "\n";
  const temporary = join(dirname(path), "." + path.split(/[\\/]/).at(-1) + "." + randomUUID() + ".tmp");
  let created = false;
  try {
    await mkdir(dirname(path), { recursive: true });
    const handle = await open(temporary, "wx", 0o600);
    created = true;
    try { await handle.writeFile(data, "utf8"); await handle.sync(); }
    finally { await handle.close(); }
    if (!valid()) throw new Error("Originating Auto control was canceled before save.");
    await rename(temporary, path);
  } catch (error) {
    throw new Error("Cannot save Auto settings at " + path + ". Previous settings are unchanged.", { cause: error });
  } finally {
    if (created) await unlink(temporary).catch(() => undefined);
  }
}

export function physicalCatalog(registry: RoutingRegistry, search = ""): Model<Api>[] {
  const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return registry.getAvailable().filter((model) => model.api !== "pi-virtual" && registry.hasConfiguredAuth(model)
    && terms.every((term) => [model.provider, model.id, model.name].join(" ").toLowerCase().includes(term)))
    .sort((a, b) => (a.provider + "/" + a.id).localeCompare(b.provider + "/" + b.id));
}

export function automaticEfforts(model: Model<Api>) {
  return getSupportedThinkingLevels(model).filter((level) => level !== "max");
}

export function validateMappings(raw: unknown, registry: RoutingRegistry): Configuration {
  const config = validateConfiguration(raw, registry);
  const available = physicalCatalog(registry);
  for (const pair of [...Object.values(config.tiers), config.classifier]) {
    const model = available.find((model) => model.provider === pair.provider && model.id === pair.model);
    if (!model || !automaticEfforts(model).includes(pair.effort)) {
      throw new Error("Unavailable exact Auto mapping " + formatPair(pair) + ". Configure this physical provider/model/effort in Pi first.");
    }
  }
  return config;
}

export function formatPair(pair: { provider: string; model: string; effort: string }) { return pair.provider + "/" + pair.model + " (" + pair.effort + ")"; }
