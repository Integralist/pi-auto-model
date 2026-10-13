import assert from "node:assert/strict";
import { After, Given, Then, When } from "@cucumber/cucumber";
import { createFixture, type Fixture } from "../../test/support/session.ts";

type World = { fixture?: Fixture };

After(function (this: World) {
  this.fixture?.close();
});

Given("an isolated Pi session starts on physical Sol at xhigh", async function (this: World) {
  this.fixture = await createFixture();
  assert.equal(this.fixture.session.model?.id, "gpt-6.1-sol");
  assert.equal(this.fixture.session.thinkingLevel, "xhigh");
});

When("I explicitly select native Auto and send an offline request", async function (this: World) {
  const fixture = this.fixture!;
  const auto = fixture.runtime.getModel("github-copilot", "auto");
  assert.ok(auto, "registered native Auto");
  await fixture.session.setModel(auto);
  assert.equal(fixture.session.model?.id, "auto");
  fixture.respond();
  await fixture.session.prompt("offline boundary proof");
});

Then("selection is Auto and the physical response is Sol at xhigh", function (this: World) {
  const fixture = this.fixture!;
  const response = fixture.session.messages
    .filter((message) => message.role === "assistant").at(-1);
  assert.equal(fixture.session.model?.id, "auto");
  assert.equal(response?.provider, "github-copilot");
  assert.equal(response?.model, "gpt-6.1-sol");
  assert.equal(response?.thinkingLevel, "xhigh");
  assert.equal(response?.stopReason, "stop");
});

Then("no extension error or live provider request occurs", function (this: World) {
  assert.deepEqual(this.fixture!.errors, []);
  assert.equal(this.fixture!.faux.state.callCount, 1);
});
