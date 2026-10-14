# Pi Auto Model

Pi Auto Model routes the main conversation through configured physical model
and effort pairs. It uses shared task-tier metadata when available and a bounded
classifier otherwise. The extension is opt-in; Pi owns model selection.

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

- `status` shows the selected model, mode, mappings, and availability guidance.
- `configure` lets you edit the four tier mappings and classifier pair.

If Auto is already selected with `model-and-effort`, repeating that mode command
can look like a no-op: it saves the current mode but does not change selection.
Run `/automodel status` to check the result. A fresh session does not select Auto
just because a mode preference exists.

There is no `/automodel on` or `/automodel off` option. Select Auto or a physical
model with Pi's `/model` picker.

## Configuration and removal

The routing policy is stored in `pi-auto-model.json`; mode preferences are
stored separately in `pi-auto-model-state.json` in Pi's agent directory.
Removing the package does not delete either file. To remove the Git
installation, select a physical model, then run:

```sh
pi remove git:github.com/Integralist/pi-auto-model
```

Start a new Pi process after removal. Delete the policy or preferences files
only if you intend to discard those settings.
