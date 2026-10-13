import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createAgentSession,
  DefaultResourceLoader,
  ModelRuntime,
  SessionManager,
  SettingsManager,
} from "@earendil-works/pi-coding-agent";
import {
  fauxAssistantMessage,
  fauxProvider,
  InMemoryCredentialStore,
  InMemoryModelsStore,
} from "@earendil-works/pi-ai";
import autoModel from "../../extensions/auto-model.ts";

export async function createFixture() {
  const dir = mkdtempSync(join(tmpdir(), "pi-auto-model-test-"));
  const faux = fauxProvider({
    provider: "github-copilot",
    models: [
      { id: "gpt-6.1-sol", reasoning: true },
      { id: "gpt-6-luna", reasoning: true },
    ],
    tokensPerSecond: 1000000,
  });
  for (const model of faux.models) {
    model.thinkingLevelMap = { high: "high", xhigh: "xhigh" };
  }
  const runtime = await ModelRuntime.create({
    credentials: new InMemoryCredentialStore(),
    modelsStore: new InMemoryModelsStore(),
    modelsPath: null,
    refreshOnCreate: false,
    allowModelNetwork: false,
  });
  runtime.registerNativeProvider(faux.provider);
  const settings = SettingsManager.inMemory({
    compaction: { enabled: false },
    retry: { enabled: false },
    cacheWarming: "off",
  });
  const errors: string[] = [];
  const loader = new DefaultResourceLoader({
    cwd: dir,
    agentDir: dir,
    settingsManager: settings,
    noExtensions: true,
    noSkills: true,
    noPromptTemplates: true,
    noThemes: true,
    noContextFiles: true,
    extensionFactories: [autoModel],
  });
  try {
    await loader.reload();
    const { session } = await createAgentSession({
      cwd: dir,
      agentDir: dir,
      modelRuntime: runtime,
      resourceLoader: loader,
      settingsManager: settings,
      sessionManager: SessionManager.inMemory(dir),
      model: faux.getModel("gpt-6.1-sol")!,
      thinkingLevel: "xhigh",
      tools: [],
    });
    try {
      await session.bindExtensions({
        mode: "print",
        onError: (error) => errors.push(error.error),
      });
      await runtime.refresh({ allowNetwork: false });
      let closed = false;
      return {
        session, runtime, faux, errors, dir,
        respond(text = "offline") {
          faux.setResponses([fauxAssistantMessage(text)]);
        },
        close() {
          if (closed) return;
          closed = true;
          session.dispose();
          rmSync(dir, { recursive: true, force: true });
        },
      };
    } catch (error) {
      session.dispose();
      throw error;
    }
  } catch (error) {
    rmSync(dir, { recursive: true, force: true });
    throw error;
  }
}

export type Fixture = Awaited<ReturnType<typeof createFixture>>;
