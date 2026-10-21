# Pi Auto Model

Pi Auto Model routes the main conversation through configured physical model
and effort pairs. It uses shared task-tier metadata when available and a bounded
classifier otherwise. The extension is opt-in; Pi owns model selection.

A switch re-sends the whole conversation without the provider's prompt cache.
So for an hour after an answer, a typed task or a `/skill:` command only
switches up to a bigger tier; a same-size or smaller one keeps the current
pair. Editing a mapping or applying a temporary preset still takes effect on
the next task.

For selection, routing, and fallback rules, see the
[model state diagrams](docs/model-state.md).

## Requirements

- Pi 1.2.0. Newer host versions have not been verified.
- Node.js `>=24.6.0 <25`.

## Install from Git

```sh
pi install git:github.com/Integralist/pi-auto-model
```

Pi installs the package from this GitHub repository. The release commit must be
pushed before Pi can install it.

## Use Auto

Enter and leave Auto through Pi's model picker:

1. Run `/model` and select `pi-auto-model/auto` to enter Auto. If Auto is
   missing from `Scoped`, press Tab to switch to `All`, search `auto`, and select
   `auto [pi-auto-model]`.
2. To add Auto to `Scoped`, run `/scoped-models` and search for
   `pi-auto-model/auto`. If its row is not checked, press Enter to enable it;
   press Ctrl+S to save the scope. This adds Auto to the model cycle; it does
   not select Auto or set it as the startup default. In `/model`, Ctrl+S sets
   the selected model as the default for new sessions.
3. Run `/model` and select a physical model to leave Auto. Then use Pi's normal
   thinking control to set its effort.

`/automodel mode` chooses how Auto routes requests. It saves a preference; it
does **not** select Auto or turn routing on.

- `model-and-effort` (default) uses each task tier's configured physical model
  and effort.
- `effort-only` keeps the known physical model and uses the configured effort
  for each task tier. If no physical model is known, select one with `/model`.

The other `/automodel` options are:

- `status` shows the selected model, mode, effective mappings, active temporary
  preset, and availability guidance.
- `configure` edits and saves the global four tier mappings and classifier pair.
- `temp bedrock` or `temp gemini` uses that preset only in the current session.
- `temp clear` removes the active preset and returns to saved/default mappings.

If Auto is already selected with `model-and-effort`, repeating that mode command
can look like a no-op: it saves the current mode but does not change selection.
Run `/automodel status` to check the result. A fresh session does not select Auto
just because a mode preference exists.

There is no `/automodel on` or `/automodel off` option. Select Auto or a physical
model with Pi's `/model` picker.

## Session-only presets

Use different Auto mappings in two repos without changing their shared settings:

```txt
/automodel temp bedrock
/automodel temp gemini
```

The `bedrock` preset uses provider `amazon-bedrock` with these exact pairs:

| Use        | Model                         | Effort   |
| ---------- | ----------------------------- | -------- |
| Trivial    | `anthropic.claude-haiku-5-5`  | `medium` |
| Moderate   | `anthropic.claude-sonnet-5-5` | `high`   |
| Complex    | `anthropic.claude-opus-5-5`   | `high`   |
| Frontier   | `anthropic.claude-opus-5-5`   | `xhigh`  |
| Classifier | `anthropic.claude-haiku-5-5`  | `low`    |

All five pairs must be available in Pi's configured catalog before activation.
This checks configured availability, not live entitlement, and sends no model
request. The preset does not select Auto or change your routing mode. In
`effort-only` mode, the main conversation keeps its known physical model and
uses the preset's tier efforts.

The override survives `/reload` and resuming the same session. It follows the
active session branch; a genuinely new session has no override. It is stored in
session history, not the global settings files. Other sessions are unaffected.
With `--no-session`, it cannot survive closing Pi.

The `gemini` preset uses provider `google-vertex` with these exact pairs:

| Use        | Model              | Effort   |
| ---------- | ------------------ | -------- |
| Trivial    | `gemini-3.8-flash` | `medium` |
| Moderate   | `gemini-3.8-flash` | `high`   |
| Complex    | `gemini-4-argon`   | `high`   |
| Frontier   | `gemini-4-argon`   | `high`   |
| Classifier | `gemini-3.8-flash` | `low`    |

The exact models and efforts must be available in Pi's configured catalog
before activation. This checks configured availability, not live entitlement,
and sends no model request.

Use `/automodel temp clear` to return to the global mappings and
`/automodel status` to check which mappings are effective. Busy-session changes
wait for a safe idle point. `/automodel configure` still edits the global
mappings; saving them does not remove an active temporary preset.

## Configuration and removal

The routing policy is stored in `pi-auto-model.json`; mode preferences are
stored separately in `pi-auto-model-state.json` in Pi's agent directory.
Without a policy file, Auto uses its built-in defaults without creating a file.
Saving through `/automodel configure` creates or replaces the global policy.
Removing the package does not delete either file. To remove the Git
installation, select a physical model, then run:

```sh
pi remove git:github.com/Integralist/pi-auto-model
```

Start a new Pi process after removal. Delete the policy or preferences files
only if you intend to discard those settings.
