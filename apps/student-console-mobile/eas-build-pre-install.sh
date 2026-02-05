#!/usr/bin/env bash
set -euo pipefail

# Just verify what EAS has already set up
corepack enable
pnpm --version