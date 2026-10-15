import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createAgentSessionFromServices,
  createAgentSessionRuntime,
  createAgentSessionServices,
  createSyntheticSourceInfo,
  ModelRuntime,
  SessionManager,
  SettingsManager,
  type ExtensionFactory,
  type Skill,
} from "@earendil-works/pi-coding-agent";
import {
  fauxAssistantMessage,
  fauxProvider,
  InMemoryCredentialStore,
  InMemoryModelsStore,
} from "@earendil-works/pi-ai";
import autoModel from "../../extensions/auto-model.ts";

type Options = {
  skills?: { name: string; description: string; tier?: unknown; body?: string }[];
  extensions?: ExtensionFactory[];
  beforeExtensions?: ExtensionFactory[];
  configuration?: unknown;
  sessionManager?: SessionManager;
  restore?: boolean;
  tools?: string[];
  retry?: boolean;
  physicalAuto?: boolean;
  physicalProvider?: string;
  setup?: (directory: string) => void;
  mode?: "tui" | "print" | "rpc" | "json";
  ui?: import("@earendil-works/pi-coding-agent").ExtensionUIContext;
};

export async function createFixture(options: Options = {}) {
  const dir = mkdtempSync(join(tmpdir(), "pi-auto-model-test-"));
  options.setup?.(dir);
  const physicalProvider = options.physicalProvider ?? "github-copilot";
  const fake = fauxProvider({
    provider: physicalProvider,
    models: [
      { id: "gpt-6.1-sol", reasoning: true },
      { id: "gpt-6-luna", reasoning: true },
    ],
    tokensPerSecond: 1000000,
  });
  for (const model of fake.models) model.thinkingLevelMap = { low: "low", high: "high", xhigh: "xhigh" };
  const runtime = await ModelRuntime.create({
    credentials: new InMemoryCredentialStore(),
    modelsStore: new InMemoryModelsStore(),
    modelsPath: null, refreshOnCreate: false, allowModelNetwork: false,
  });
  // Built-in providers can be configured from the test runner's environment.
  // Keep this offline fixture's catalog limited to its explicitly supplied fake.
  for (const provider of runtime.getProviders()) {
    runtime.registerNativeProvider({
      ...provider, auth: { apiKey: { name: "Offline fixture only", resolve: async () => undefined } },
      filterModels: () => [],
    });
  }
  runtime.registerNativeProvider(fake.provider);
  if (options.physicalAuto) {
    runtime.registerNativeProvider(fauxProvider({ provider: "pi-auto-model", models: [{ id: "auto", reasoning: true }] }).provider);
  }
  const settings = SettingsManager.inMemory({
    defaultProvider: physicalProvider, defaultModel: "gpt-6.1-sol", defaultThinkingLevel: "xhigh",
    compaction: { enabled: false },
    retry: { enabled: options.retry ?? false, maxRetries: 1, baseDelayMs: 1 },
    cacheWarming: "off",
  });
  const skills: Skill[] = (options.skills ?? []).map((skill) => {
    const baseDir = join(dir, "skills", skill.name);
    const filePath = join(baseDir, "SKILL.md");
    mkdirSync(baseDir, { recursive: true });
    const metadata = skill.tier === undefined ? "" : `metadata:\n  model-tier: ${JSON.stringify(skill.tier)}\n`;
    writeFileSync(filePath, `---\nname: ${skill.name}\ndescription: ${JSON.stringify(skill.description)}\n${metadata}---\n${skill.body ?? "OFFLINE_SKILL_BODY"}\n`);
    return {
      name: skill.name, description: skill.description, filePath, baseDir,
      disableModelInvocation: false,
      sourceInfo: createSyntheticSourceInfo(filePath, { source: "test", scope: "temporary", baseDir }),
    };
  });
  const errors: string[] = [];
  let first = true;
  try {
    const owner = await createAgentSessionRuntime(async ({ sessionManager, sessionStartEvent }) => {
      const services = await createAgentSessionServices({
        cwd: dir, agentDir: dir, modelRuntime: runtime, settingsManager: settings,
        resourceLoaderOptions: {
          noExtensions: true, noSkills: true, noPromptTemplates: true,
          noThemes: true, noContextFiles: true,
          extensionFactories: [...(options.beforeExtensions ?? []), (pi) => autoModel(pi, options.configuration, { directory: dir }), ...(options.extensions ?? [])],
          skillsOverride: () => ({ skills, diagnostics: [] }),
        },
      });
      errors.push(...services.diagnostics.filter((issue) => issue.type === "error").map((issue) => issue.message));
      const explicit = first && !options.restore;
      first = false;
      const result = await createAgentSessionFromServices({
        services, sessionManager, sessionStartEvent,
        model: explicit ? fake.getModel("gpt-6.1-sol")! : undefined,
        thinkingLevel: explicit ? "xhigh" : undefined,
        tools: options.tools ?? [],
      });
      return { ...result, services, diagnostics: services.diagnostics };
    }, { cwd: dir, agentDir: dir, sessionManager: options.sessionManager ?? SessionManager.inMemory(dir) });
    try {
      const bind = async (session: typeof owner.session) => {
        await session.bindExtensions({ mode: options.mode ?? "print", uiContext: options.ui, onError: (error) => errors.push(error.error) });
        await runtime.refresh({ allowNetwork: false });
      };
      owner.setRebindSession(bind);
      await bind(owner.session);
      let closed = false;
      return {
        get session() { return owner.session; },
        owner, runtime, faux: fake, errors, dir, skills,
        respond(text = "offline") { fake.setResponses([fauxAssistantMessage(text)]); },
        close() {
          if (closed) return;
          closed = true;
          owner.session.dispose();
          rmSync(dir, { recursive: true, force: true });
        },
      };
    } catch (error) {
      await owner.dispose();
      throw error;
    }
  } catch (error) {
    rmSync(dir, { recursive: true, force: true });
    throw error;
  }
}

export type Fixture = Awaited<ReturnType<typeof createFixture>>;
