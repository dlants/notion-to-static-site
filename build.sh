#!/bin/sh

npm install
npx tsx main.ts fetch
npx tsx main.ts build
