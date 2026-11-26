# Pi Auto Model

Pi Auto Model routes the main conversation through configured physical model
and effort pairs. It uses shared task-tier metadata when available and a bounded
classifier otherwise. The extension is opt-in; Pi owns model selection.

A switch re-sends the whole conversation without the provider's prompt cache.
So for an hour after an answer, a typed task or a `/skill:` command only
switches up to a bigger tier; a same-size or smaller one keeps the current
pair. Editing a mapping, switching the persisted provider, or applying a
temporary preset still takes effect on the next task.

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

- `status` shows the selected model, mode, effective mappings, active provider
  or temporary preset, and availability guidance.
- `configure` edits and saves the global four tier mappings and classifier pair.
- `provider gpt`, `provider bedrock`, or `provider gemini` persists that preset
  as the default for this and future sessions.
- `provider clear` removes the persisted provider and returns to saved/default
  mappings.
- `temp gpt`, `temp bedrock`, or `temp gemini` uses that preset only in the
  current session.
- `temp clear` removes the session preset and returns to the persisted provider
  or saved/default mappings.

If Auto is already selected with `model-and-effort`, repeating that mode command
can look like a no-op: it saves the current mode but does not change selection.
Run `/automodel status` to check the result. A fresh session does not select Auto
just because a mode preference exists.

There is no `/automodel on` or `/automodel off` option. Select Auto or a physical
model with Pi's `/model` picker.

## Default GPT mappings

The built-in defaults use the `github-copilot` provider:

| Use        | Model           | Effort  |
| ---------- | --------------- | ------- |
| Trivial    | `gpt-6-luna`    | `high`  |
| Moderate   | `gpt-6.2-sol`   | `low`   |
| Complex    | `gpt-6.2-sol`   | `xhigh` |
| Frontier   | `gpt-6.2-astra` | `high`  |
| Classifier | `gpt-6-luna`    | `low`   |

## Provider presets (persisted and session-only)

You can switch Auto across three built-in presets: `gpt` (the default
`github-copilot` mappings above), `bedrock`, and `gemini`.

To switch permanently across new sessions (for example, to spend a week on a
different provider):

```txt
/automodel provider gpt
/automodel provider bedrock
/automodel provider gemini
/automodel provider clear
```

To override mappings only in the current session without changing shared
settings:

```txt
/automodel temp gpt
/automodel temp bedrock
/automodel temp gemini
/automodel temp clear
```

Precedence from highest to lowest:

1. Session-only `/automodel temp` preset.
2. Persisted `/automodel provider` preset.
3. Saved global policy in `pi-auto-model.json`.
4. Built-in GPT defaults.

The `bedrock` preset uses provider `amazon-bedrock` with these exact pairs:

| Use        | Model                         | Effort  |
| ---------- | ----------------------------- | ------- |
| Trivial    | `anthropic.claude-haiku-5-5`  | `high`  |
| Moderate   | `anthropic.claude-sonnet-5-5` | `high`  |
| Complex    | `anthropic.claude-opus-5-5`   | `high`  |
| Frontier   | `anthropic.claude-opus-5-5`   | `xhigh` |
| Classifier | `anthropic.claude-haiku-5-5`  | `low`   |

The `gemini` preset uses provider `google-vertex` with these exact pairs:

| Use        | Model               | Effort   |
| ---------- | ------------------- | -------- |
| Trivial    | `gemini-4-hydrogen` | `medium` |
| Moderate   | `gemini-4-hydrogen` | `high`   |
| Complex    | `gemini-4-neon`     | `high`   |
| Frontier   | `gemini-4-neon`     | `xhigh`  |
| Classifier | `gemini-4-hydrogen` | `low`    |

All five pairs must be available in Pi's configured catalog before activation.
This checks configured availability, not live entitlement, and sends no model
request. Neither `provider` nor `temp` selects Auto or changes your routing
mode. In `effort-only` mode, the main conversation keeps its known physical
model and uses the active preset's tier efforts.

A persisted provider is stored in `pi-auto-model-provider.json` in Pi's agent
directory, so it survives `/reload` and applies to every new session until you
change or clear it. A temporary preset is stored in session history only: it
survives `/reload` and resuming the same session, follows the active branch,
and leaves other sessions unaffected. With `--no-session`, a temporary preset
cannot survive closing Pi.

Use `/automodel status` to check which mappings are effective. Busy-session
changes wait for a safe idle point. `/automodel configure` still edits
`pi-auto-model.json`; saving it does not clear an active persisted provider or
temporary preset.

## Configuration and removal

Files stored in Pi's agent directory:

- `pi-auto-model.json` stores the global routing policy saved by
  `/automodel configure`.
- `pi-auto-model-state.json` stores mode preferences.
- `pi-auto-model-provider.json` stores the persisted provider preset saved by
  `/automodel provider`.

Without these files, Auto uses its built-in defaults without creating any files.
Removing the package does not delete them. To remove the Git installation,
select a physical model, then run:

```sh
pi remove git:github.com/Integralist/pi-auto-model
```

Start a new Pi process after removal. Delete the policy, mode preferences, or
persisted provider files only if you intend to discard those settings.

## Live classifier checks

`PI_AUTO_MODEL_LIVE_EVAL=1 make test-unit` sends 16 live requests using the
default classifier and configured credentials; provider charges may apply.
