import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fauxProvider } from "@earendil-works/pi-ai";
import { expect, test } from "vitest";
import { validateConfiguration, type RoutingRegistry } from "../src/policy.ts";
import { automaticEfforts, formatPair, physicalCatalog, readSettings, validateMappings, validatePreferences, writeSettings } from "../src/settings.ts";

function registry(): RoutingRegistry {
  const one = fauxProvider({ provider: "one", models: [{ id: "alpha", name: "Alpha writer", reasoning: true }] });
  const two = fauxProvider({ provider: "two", models: [{ id: "beta", name: "Beta thinker", reasoning: true }] });
  one.models[0]!.thinkingLevelMap = { minimal: null, low: null, medium: null, high: "high", xhigh: null };
  two.models[0]!.thinkingLevelMap = { high: "high", xhigh: "xhigh" };
  const virtual = { ...one.models[0]!, provider: "pi-auto-model", id: "auto", api: "pi-virtual" };
  const models = [...one.models, ...two.models, virtual];
  return {
    getAvailable: () => models,
    find: (provider, id) => models.find((model) => model.provider === provider && model.id === id),
    hasConfiguredAuth: (model) => model.provider !== "missing",
  };
}

test.each(["one", "alpha", "writer", "one alpha"])("physical catalog search matches %s and excludes virtual entries", (search) => {
  const r = registry();
  expect(physicalCatalog(r, search).map((model) => model.provider + "/" + model.id)).toEqual(["one/alpha"]);
  expect(physicalCatalog(r).map((model) => model.id)).toEqual(["alpha", "beta"]);
  expect(physicalCatalog(r, "absent")).toEqual([]);
});

test("automatic effort offers exact supported non-max values", () => {
  expect(automaticEfforts(registry().find("one", "alpha")!)).toEqual(["off", "high"]);
  expect(formatPair({ provider: "one", model: "alpha", effort: "high" })).toBe("one/alpha (high)");
});

test.each([null, [], {}, { version: 2, enabled: true, mode: "effort-only" },
  { version: 1, enabled: "true", mode: "model-and-effort" },
  { version: 1, enabled: false, mode: "other" },
  { version: 1, enabled: false, mode: "effort-only", extra: true }])("invalid preferences are actionable (%j)", (raw) => {
  expect(() => validatePreferences(raw)).toThrow(/Invalid Auto preferences/);
});

test.each(["model-and-effort", "effort-only"])("preferences retain only %s mode; legacy enabled never survives validation", (mode) => {
  expect(validatePreferences({ version: 2, mode })).toEqual({ version: 2, mode });
  for (const enabled of [false, true]) {
    expect(validatePreferences({ version: 1, enabled, mode })).toEqual({ version: 2, mode });
  }
});

test.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, "10000"])("popup duration rejects %s", (durationMs) => {
  const r = registry(), raw = { ...validateConfiguration(undefined, r), switchPopup: { enabled: true, durationMs } };
  expect(() => validateConfiguration(raw, r)).toThrow(/switchPopup.durationMs/);
});

test("popup defaults are opt-out and unchanged by loading legacy policy", () => {
  const r = registry(), raw = validateConfiguration(undefined, r);
  expect(raw.switchPopup).toEqual({ enabled: true, durationMs: 10000 });
  const { switchPopup: _popup, ...old } = raw;
  expect(validateConfiguration(old, r).switchPopup).toEqual(raw.switchPopup);
  expect(() => validateConfiguration({ ...raw, switchPopup: { enabled: "yes", durationMs: 10000 } }, r)).toThrow(/switchPopup.enabled/);
});

test("validated catalog-backed mappings preserve summary, bounds, mode and popup", () => {
  const r = registry(), raw = validateConfiguration(undefined, r), pair = { provider: "two", model: "beta", effort: "high" };
  for (const tier of Object.keys(raw.tiers) as (keyof typeof raw.tiers)[]) raw.tiers[tier] = { ...pair, effort: "high" };
  raw.classifier = { ...raw.classifier, ...pair, effort: "high" };
  expect(validateMappings(raw, r)).toEqual(raw);
  raw.classifier.effort = "xhigh";
  expect(validateMappings(raw, r).classifier.effort).toBe("xhigh");
  raw.classifier.model = "missing";
  expect(() => validateMappings(raw, r)).toThrow(/Unavailable exact Auto mapping/);
});

test("settings reads distinguish absence, bad JSON and inaccessible file types", async () => {
  const dir = mkdtempSync(join(tmpdir(), "auto-settings-"));
  try {
    expect(await readSettings(join(dir, "absent.json"))).toBeUndefined();
    writeFileSync(join(dir, "bad.json"), "{");
    await expect(readSettings(join(dir, "bad.json"))).rejects.toThrow(/Correct or remove/);
    await expect(readSettings(dir)).rejects.toThrow(/Correct or remove/);
    writeFileSync(join(dir, "valid.json"), '{"a":1}');
    expect(await readSettings(join(dir, "valid.json"))).toEqual({ a: 1 });
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("atomic settings save replaces the complete file with restrictive permissions and cleans temporary files", async () => {
  const dir = mkdtempSync(join(tmpdir(), "auto-settings-")), path = join(dir, "policy.json");
  try {
    writeFileSync(path, '{"old":true}');
    await writeSettings(path, { next: true });
    expect(JSON.parse(readFileSync(path, "utf8"))).toEqual({ next: true });
    expect(statSync(path).mode & 0o777).toBe(0o600);
    expect(readdirSync(dir)).toEqual(["policy.json"]);
    await expect(writeSettings(path, { bad: true }, () => false)).rejects.toThrow(/Previous settings are unchanged/);
    expect(JSON.parse(readFileSync(path, "utf8"))).toEqual({ next: true });
    expect(readdirSync(dir)).toEqual(["policy.json"]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("atomic rename failure preserves the previous path and removes its temporary file", async () => {
  const dir = mkdtempSync(join(tmpdir(), "auto-settings-")), path = join(dir, "destination");
  try {
    mkdirSync(path); writeFileSync(join(path, "old"), "keep");
    await expect(writeSettings(path, { bad: true })).rejects.toThrow(/Previous settings are unchanged/);
    expect(readFileSync(join(path, "old"), "utf8")).toBe("keep");
    expect(readdirSync(dir)).toEqual(["destination"]);
    await expect(writeSettings(join(path, "old", "nested.json"), {})).rejects.toThrow();
    expect(readFileSync(join(path, "old"), "utf8")).toBe("keep");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
