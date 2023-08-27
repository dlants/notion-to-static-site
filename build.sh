#!/bin/bash
set -euxo pipefail

npm install
npx tsx main.ts fetch
npx tsx main.ts build
