#!/bin/bash
set -euxo pipefail

yarn install
npx tsx main.ts fetch
npx tsx main.ts build
