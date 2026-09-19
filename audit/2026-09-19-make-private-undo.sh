#!/bin/bash
# Undo script for audit/make-private.py run on 2026-09-19
# Restores each repo to public (and prior archived state).
set -e

# --- ts-test ---
gh repo unarchive realdubb/ts-test --yes
gh repo edit realdubb/ts-test --visibility public --accept-visibility-change-consequences
gh repo archive realdubb/ts-test --yes

# --- webhook-as-service ---
gh repo edit realdubb/webhook-as-service --visibility public --accept-visibility-change-consequences

# --- mssql-server-linux-fts ---
gh repo edit realdubb/mssql-server-linux-fts --visibility public --accept-visibility-change-consequences

# --- monorepo ---
gh repo edit realdubb/monorepo --visibility public --accept-visibility-change-consequences

# --- my-app-boilerplate ---
gh repo unarchive realdubb/my-app-boilerplate --yes
gh repo edit realdubb/my-app-boilerplate --visibility public --accept-visibility-change-consequences
gh repo archive realdubb/my-app-boilerplate --yes

# --- storybook-playground ---
gh repo edit realdubb/storybook-playground --visibility public --accept-visibility-change-consequences

# --- public ---
gh repo unarchive realdubb/public --yes
gh repo edit realdubb/public --visibility public --accept-visibility-change-consequences
gh repo archive realdubb/public --yes

# --- catch-of-the-day ---
gh repo unarchive realdubb/catch-of-the-day --yes
gh repo edit realdubb/catch-of-the-day --visibility public --accept-visibility-change-consequences
gh repo archive realdubb/catch-of-the-day --yes

# --- flask-microblog ---
gh repo edit realdubb/flask-microblog --visibility public --accept-visibility-change-consequences

# --- ember-library-tutorial ---
gh repo edit realdubb/ember-library-tutorial --visibility public --accept-visibility-change-consequences

# --- mywebpack ---
gh repo edit realdubb/mywebpack --visibility public --accept-visibility-change-consequences

# --- workspace ---
gh repo edit realdubb/workspace --visibility public --accept-visibility-change-consequences

# --- json-server-api ---
gh repo edit realdubb/json-server-api --visibility public --accept-visibility-change-consequences

# --- ember-bank ---
gh repo unarchive realdubb/ember-bank --yes
gh repo edit realdubb/ember-bank --visibility public --accept-visibility-change-consequences
gh repo archive realdubb/ember-bank --yes

# --- sunshine-app ---
gh repo unarchive realdubb/sunshine-app --yes
gh repo edit realdubb/sunshine-app --visibility public --accept-visibility-change-consequences
gh repo archive realdubb/sunshine-app --yes

# --- datastructure ---
gh repo edit realdubb/datastructure --visibility public --accept-visibility-change-consequences

# --- imbi ---
gh repo edit realdubb/imbi --visibility public --accept-visibility-change-consequences

# --- youtubeplayer ---
gh repo unarchive realdubb/youtubeplayer --yes
gh repo edit realdubb/youtubeplayer --visibility public --accept-visibility-change-consequences
gh repo archive realdubb/youtubeplayer --yes

# --- bookclub ---
gh repo unarchive realdubb/bookclub --yes
gh repo edit realdubb/bookclub --visibility public --accept-visibility-change-consequences
gh repo archive realdubb/bookclub --yes

# --- OS-Project-2 ---
gh repo edit realdubb/OS-Project-2 --visibility public --accept-visibility-change-consequences

