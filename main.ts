import * as yargs from "yargs";
import { $ } from "zx";
import { AssetInfo, Breadcrumb, PageInfo, generateUrlMap } from "./util";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import express from "express";
import { insertHeader } from "./transforms/insert-header";
import _ from "lodash";
import { transformLinks } from "./transforms/links";
import { rewriteAbsoluteUrls } from "./transforms/download-images";

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
        "/export",
        express.static("static/export", {
          extensions: ["html"],
        }),
      );

      app.use(
        "/",
        express.static("static/dist", {
          extensions: ["html"],
        }),
      );

      app.listen(argv.port);
      console.log(`Listening on port ${argv.port}`);
    },
  )
  .command(
    "build",
    "take the content in the export directory and build it, placing the result in the dist directory",
    () => {},
    async () => {
      // read each file in the export directory, parse it, apply the transforms, then place the results in the
      // output directory
      await $`rm -rf static/dist`;
      await $`mkdir -p static/dist`;

      const { pages, assets, sectionPages } = await walkProject();

      for (const page of pages) {
        console.log(`processing ${page.originalPath}`);
        const $ = cheerio.load(fs.readFileSync(page.originalPath));

        transformLinks({ $, urlMap: generateUrlMap({ pages, assets }), page });
        await rewriteAbsoluteUrls({ $ });
        insertHeader({ $, page, sectionPages });

        const outPath = path.join("static/dist", page.newPath);
        fs.writeFileSync(outPath, $.html());
        console.log(`wrote ${outPath}`);
      }

      for (const asset of assets) {
        const outPath = path.join("static/dist", asset.newPath);
        fs.copyFileSync(asset.originalPath, outPath);
        console.log(`wrote ${outPath}`);
      }
    },
  )
  .help().argv;

async function walkProject() {
  // TODO:
  //    generate rss for each section
  //    fixup embeds (video, collapsible sections, etc...)
  const pages: PageInfo[] = [];
  const assets: AssetInfo[] = [];
  const sectionpages: PageInfo[] = [];

  const dirsToRead: {
    dirPath: string;
    breadcrumbs: Breadcrumb[];
  }[] = [{ dirPath: "static/export", breadcrumbs: [] }];
  const existingPaths = new Set<string>();

  while (dirsToRead.length) {
    const dirToRead = dirsToRead.pop();
    if (!dirToRead) {
      break;
    }

    const { dirPath, breadcrumbs } = dirToRead;

    for await (const ent of await fs.promises.opendir(dirPath)) {
      const entPath = path.join(dirPath, ent.name);
      if (ent.isFile()) {
        if (/\.html$/.test(entPath)) {
          const $ = cheerio.load(fs.readFileSync(entPath));
          const title = $(".page-title").text();
          let newPath;
          let index = 0;
          while (true) {
            newPath = title + (index == 0 ? "" : `(${index})`) + ".html";
            if (!existingPaths.has(newPath)) {
              existingPaths.add(newPath);
              break;
            }
          }

          const page: PageInfo = {
            originalPath: entPath,
            newPath,
            title,
            dir: dirPath,
            breadcrumbs,
            assetDir: entPath.replace(/\.html$/, ""),
          };
          // we list the export directory first. It should only have a single page inside of it, which will be inserted
          // into the pages array first. This is our index page.
          if (pages.length == 0) {
            page.newPath = "index.html";
          }

          pages.push(page);

          if (breadcrumbs.length == 1) {
            sectionpages.push(page);
          }

          const pageDir = entPath.slice(0, entPath.lastIndexOf(".html"));

          // there should be a corresponding directory for the page
          if (fs.existsSync(pageDir)) {
            dirsToRead.push({
              dirPath: pageDir,
              breadcrumbs: [
                ...breadcrumbs,
                {
                  title,
                  url: page.newPath,
                },
              ],
            });
          }
        } else {
          // assume ent is an asset
          const ext = path.extname(entPath);
          const name = path.basename(entPath, ext);
          let newPath;
          let index = 0;
          while (true) {
            newPath = name + (index == 0 ? "" : `(${index})`) + ext;
            if (!existingPaths.has(newPath)) {
              existingPaths.add(newPath);
              break;
            }
          }

          assets.push({
            originalPath: entPath,
            dir: dirPath,
            basename: path.basename(entPath),
            newPath,
          });
        }
      }
    }
  }

  return { pages, assets, sectionPages: sectionpages };
}
