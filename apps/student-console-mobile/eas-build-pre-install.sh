#!/usr/bin/env bash
set -euo pipefail

# Enable Corepack to use pnpm
corepack enable
corepack prepare pnpm@10.28.0 --activate

# Verify pnpm is available
pnpm --version
