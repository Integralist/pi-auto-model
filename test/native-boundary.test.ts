import { expect, test } from "vitest";
import { createFixture } from "./support/session.ts";

test("native Auto is opt-in and dispatches a physical baseline pair", async () => {
  const fixture = await createFixture();
  try {
    expect(fixture.session.model?.id).toBe("gpt-6.1-sol");
    const auto = fixture.runtime.getModel("pi-auto-model", "auto");
    expect(auto, "registered native Auto").toBeDefined();
    if (!auto) return;
    await fixture.session.setModel(auto);
    expect(fixture.session.model?.id).toBe("auto");
    fixture.respond();
    await fixture.session.prompt("offline boundary proof", { source: "extension" });
    const response = fixture.session.messages
      .filter((message) => message.role === "assistant").at(-1);
    expect(fixture.session.model?.id).toBe("auto");
    expect(response?.provider).toBe("github-copilot");
    expect(response?.model).toBe("gpt-6.1-sol");
    expect(response?.thinkingLevel).toBe("xhigh");
    expect(response?.stopReason).toBe("stop");
    expect(fixture.faux.state.callCount).toBe(1);
    expect(fixture.errors).toEqual([]);
  } finally {
    fixture.close();
  }
});
