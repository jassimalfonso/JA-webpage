# JA-webpage

Personal site of Jassim Alfonso — minimal / punk, ink and paper, hand-coded. No framework, no build step: open `index.html`.

## What's where

| Path | What it is |
|---|---|
| `index.html` | Home: hero, work list, about, contact |
| `ikonplan.html`, `bankcal.html`, `scoreboard.html`, `passgen.html`, `counter.html`, `hometown.html` | One case study per project, each with a live demo |
| `css/style.css` | All styles. Colours are the three tokens at the top: `--k` ink, `--w` paper, `--g` pencil |
| `js/site.js` | Motion: page wipe, scramble headings, count-up numbers, scroll-speed ticker, cursor, hover previews |
| `js/demos.js` | The interactive demos, one function per project (`data-demo="…"` on the page picks it) |
| `assets/` | Logo, project screenshots (`ikonplan/` uses the tool's built-in sample plan only — no client data) |

## Versions

| Branch | What it is |
|---|---|
| `original` | The site exactly as it was before the 2026 revamp. Don't commit to it — treat it as a snapshot |
| `v2-revamp` | Snapshot of the minimal / punk revamp with case studies and demos |
| `v3-challenges` | Snapshot with challenges, The aForm Show, light mode, go-to menu and share images |
| `main` | What's live |

Optional, from your own PC — pin both snapshots as tags too:
`git fetch && git tag v1-original origin/original && git tag v2.0.0 origin/v2-revamp && git push origin --tags`

**Look at the original:** `git switch original` (then `git switch main` to come back).

**Start your own version from the original:** `git switch -c my-build original`, then build and commit there. To put it live, merge it into `main` or point Netlify at that branch.

**Put the original back live:** `git switch main`, then `git revert --no-edit original..main`, then `git push`. This adds a new commit that undoes the revamp, and keeps the revamp in history in case you want it back.


## Changing the project order or what is featured

Edit `projects.js` (one small file at the top level) — on GitHub, tap the pencil, change the two lists, commit. Netlify redeploys in about a minute.

- `order`: every project, top to bottom. Sets the numbers, the Work list, previous / next and the index.
- `featured`: the projects shown as big cards on the home page.

## Background sound

`/sound` in the nav turns on a quiet original music loop (`assets/sound/ambient.m4a`, ~65 s, seamless).
It is off until a visitor turns it on, remembers the choice, and carries on from the same spot on the next page.
It fades out whenever a demo makes sound (any unmuted audio/video, or a demo's Web Audio) and fades back in
a moment after the demo goes quiet. Logic: `js/sound.js` — it must load before `js/demos.js`.
