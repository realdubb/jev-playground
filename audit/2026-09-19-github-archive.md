---
source: claude
created: 2026-09-19
type: audit
tags: [github, jev, cleanup]
---

# GitHub archive run, 2026-09-19

Decided by Jev (`typesafe/jev-1.13` via OpenRouter) using `src/github-prune.ts`. Only repos with verdict archive or delete at 80%+ confidence were touched, and every one was **archived, not deleted**. Each repo got the GitHub topic `jev-archived-2026-09` before archiving so the set is searchable.

Undo everything: `sh audit/2026-09-19-undo.sh`. Undo one: `gh repo unarchive realdubb/<name> --yes`.

Raw per-step log: `audit/2026-09-19-github-archive.jsonl`.

| Repo | Jev verdict | Confidence | Years idle | Private | Fork | Result |
|---|---|---|---|---|---|---|
| realdubb/.tmux | archive | 0.88 | 3.1 | no | yes | archived |
| realdubb/audio-guestbook | archive | 0.89 | 3.8 | no | yes | archived |
| realdubb/ts-test | delete | 0.84 | 4.1 | no | no | archived |
| realdubb/interactive-coding-challenges | archive | 0.89 | 5.4 | no | yes | archived |
| realdubb/blog | archive | 0.91 | 7.8 | no | yes | archived |
| realdubb/electron-react-boilerplate | archive | 0.84 | 7.9 | no | yes | archived |
| realdubb/github-tools-vsts | archive | 0.85 | 7.9 | no | yes | archived |
| realdubb/docker-elk | archive | 0.82 | 8 | no | yes | archived |
| realdubb/graphql | archive | 0.81 | 8.2 | no | yes | archived |
| realdubb/signature_pad | archive | 0.83 | 8.3 | no | yes | archived |
| realdubb/k8s-by-component | archive | 0.93 | 8.3 | no | yes | archived |
| realdubb/react-stepzilla | archive | 0.87 | 8.3 | no | yes | archived |
| realdubb/my-app-boilerplate | delete | 0.84 | 8.6 | no | no | archived |
| realdubb/login-flow | archive | 0.80 | 8.7 | no | yes | archived |
| realdubb/feathers-starter-react-redux-login-roles | archive | 0.84 | 8.8 | no | yes | archived |
| realdubb/env | delete | 0.91 | 8.8 | yes | no | archived |
| realdubb/airport-explorer-source | archive | 0.88 | 8.8 | no | yes | archived |
| realdubb/SwiftCheatsheet | archive | 0.90 | 8.8 | no | yes | archived |
| realdubb/js-file-download | delete | 0.85 | 9 | no | yes | archived |
| realdubb/public | delete | 0.86 | 9 | no | no | archived |
| realdubb/hotel | archive | 0.87 | 9.1 | no | yes | archived |
| realdubb/tribeca | archive | 0.94 | 9.2 | no | yes | archived |
| realdubb/digital_video_introduction | archive | 0.95 | 9.3 | no | yes | archived |
| realdubb/menu_monkey | delete | 0.89 | 9.4 | yes | no | archived |
| realdubb/catch-of-the-day | delete | 0.80 | 9.4 | no | no | archived |
| realdubb/scratch | delete | 1.00 | 9.4 | yes | no | archived |
| realdubb/6310 | delete | 0.98 | 9.6 | yes | no | archived |
| realdubb/name-contests | delete | 0.85 | 9.8 | no | yes | archived |
| realdubb/ember-bank | delete | 0.88 | 9.8 | no | no | archived |
| realdubb/product-app | archive | 0.81 | 9.8 | no | yes | archived |
| realdubb/react-native-redux-groceries | archive | 0.80 | 9.9 | no | yes | archived |
| realdubb/sunshine-app | delete | 0.81 | 10 | no | no | archived |
| realdubb/MiniKeePass | archive | 0.85 | 10 | no | yes | archived |
| realdubb/local-npm | archive | 0.91 | 10 | no | yes | archived |
| realdubb/synology-cast-photos | archive | 0.91 | 10.1 | no | yes | archived |
| realdubb/react-firebase-crud | archive | 0.81 | 10.1 | no | yes | archived |
| realdubb/snowflake-hapi-openshift | archive | 0.80 | 10.1 | no | yes | archived |
| realdubb/cs193p-Spring-2016 | archive | 0.95 | 10.3 | no | yes | archived |
| realdubb/synology-cast-photos-android | archive | 0.89 | 10.3 | no | yes | archived |
| realdubb/ElectroCRUD | archive | 0.88 | 10.3 | no | yes | archived |
| realdubb/rspec-best-practices | delete | 0.94 | 10.3 | no | yes | archived |
| realdubb/Materials-CS193A-Android-App-Development-Standford | archive | 0.93 | 10.3 | no | yes | archived |
| realdubb/hkids-app | archive | 0.82 | 10.4 | yes | no | archived |
| realdubb/angular2-tv-tracker | archive | 0.82 | 10.5 | no | yes | archived |
| realdubb/spartify | archive | 0.85 | 10.5 | no | yes | archived |
| realdubb/blackboard-binder | archive | 0.86 | 10.6 | no | yes | archived |
| realdubb/youtubeplayer | delete | 0.99 | 10.7 | no | no | archived |
| realdubb/sudoku | archive | 0.83 | 10.7 | no | yes | archived |
| realdubb/engineering-app | archive | 0.89 | 11 | no | yes | archived |
| realdubb/bookclub | delete | 0.90 | 11.3 | no | no | archived |
| realdubb/Searching-array-for-character-C-Program | delete | 0.86 | 11.4 | no | yes | archived |
| realdubb/tab-resize | archive | 0.80 | 11.5 | no | yes | archived |
| realdubb/realdubb.github.io | delete | 0.88 | 11.6 | yes | no | archived |
