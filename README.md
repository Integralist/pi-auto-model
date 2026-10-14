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

1. Select `pi-auto-model/auto` from Pi's `/model` picker to enter Auto.
2. Select a physical model in `/model` to leave Auto. Change its effort with
   Pi's normal thinking control.
3. Use `/automodel status` to inspect the current mode, mappings and guidance.
   Use `/automodel configure` to edit the tier and classifier mappings, or
   `/automodel mode model-and-effort|effort-only` to choose the routing mode.

Auto does not provide an on/off command, shortcut, or automatic restoration.
Changing thinking while Auto is selected does not switch to a physical model.
A fresh session does not activate Auto just because preferences exist.

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
