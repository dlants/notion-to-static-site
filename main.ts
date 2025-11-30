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
import { renderDbPage } from "./render/database";
import { siteConfig } from "./config";
import { renderTagPage } from "./render/tag-page";
import { renderSitemap } from "./render/sitemap";
dotenv.config();

yargs
  .command(
    "serve",
    "serve the site locally",
    (yargs) => {
      yargs.option("port", {
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
      const client = new NotionClientWrapper(NOTION_API_TOKEN);

      await $`rm -rf cache`;
      await $`mkdir -p cache/images`;
      await client.fetchPageAndChildren({
        pageId: siteConfig.rootPageId,
      });
    },
  )
  .command(
    "build",
    "take the content in the export directory and build it, placing the result in the dist directory",
    {},
    async (_argv) => {
      await $`rm -rf dist`;
      await $`mkdir -p dist/images`;
      await $`cp -f -r static/* dist`;
      await $`cp -f -r cache/images/* dist/images/`;

      const rootPageId = normalizePageId(siteConfig.rootPageId);
      const context = await loadPages(rootPageId);

      for (const pageId in context.pages) {
        const page = context.pages[pageId];
        console.log(`rendering ${page.id}`);
        renderPage(page, context);
      }

      for (const databaseId in context.dbs) {
        console.log(`rendering ${databaseId}`);
        renderDbPage(databaseId, context);
      }

      for (const tagId in siteConfig.tagMap) {
        const tagSiteConfigId = siteConfig.tagMap[tagId];
        console.log(`rendering ${tagSiteConfigId}`);
        renderTagPage(tagId, tagSiteConfigId, context);
      }

      if (siteConfig.buttondownId) {
        renderButtondown(context);
      }

      await renderSitemap({
        context,
        options: {},
        databaseId: siteConfig.rootDatabaseId,
      });
    },
  )
  .help().argv;
