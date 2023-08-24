import * as yargs from "yargs";
import { $ } from "zx";
import { ensureEnvironmentVariable, normalizePageId } from "./util";
import express from "express";
import _ from "lodash";
import dotenv from "dotenv";
import { NotionClientWrapper } from "./fetch-page";
import { loadPages } from "./load-page";
import { renderPage } from "./render/page";
import { renderButtondown } from "./render/buttondown";
dotenv.config();

yargs
  .command(
    "serve [port]",
    "serve the site locally",
    (yargs) => {
      yargs.positional("port", {
        describe: "port to bind on",
        default: 1337,
      });
    },
    async (argv) => {
      const app = express();

      app.use(
        "/",
        express.static("dist", {
          extensions: ["html"],
        }),
      );

      app.listen(argv.port);
      console.log(`Listening on port ${argv.port}`);
    },
  )
  .command(
    "fetch",
    "query the notion api for updates to the page",
    {},
    async (_argv) => {
      const NOTION_API_TOKEN = ensureEnvironmentVariable("NOTION_API_TOKEN");
      const ROOT_PAGE_ID = ensureEnvironmentVariable("ROOT_PAGE_ID");
      const client = new NotionClientWrapper(NOTION_API_TOKEN);

      await $`rm -rf cache`;
      await $`mkdir -p cache/images`;
      await client.fetchPageAndChildren({
        pageId: ROOT_PAGE_ID,
      });
    },
  )
  .command(
    "build",
    "take the content in the export directory and build it, placing the result in the dist directory",
    {
      forceDownload: {
        describe: "re-download all absolute assets?",
        type: "boolean",
      },
    },
    async (_argv) => {
      await $`rm -rf dist`;
      await $`mkdir -p dist/images`;
      await $`cp -f -r static/* dist`;
      await $`cp -f -r cache/images/* dist/images/`;

      const ROOT_PAGE_ID = normalizePageId(
        ensureEnvironmentVariable("ROOT_PAGE_ID"),
      );
      const context = await loadPages(ROOT_PAGE_ID);

      for (const pageId in context.pages) {
        const page = context.pages[pageId];
        console.log(`processing ${page.id}`);
        await renderPage(page, context);
      }

      renderButtondown(context);
    },
  )
  .help().argv;
