import * as yargs from "yargs";
import { $ } from "zx";
import { PageInfo, UrlMap } from "./util";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import express from "express";
import { transformHeader } from "./transforms/insert-header";
import _ from "lodash";
import { transformLinks } from "./transforms/links";

async function run() {
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

        // TODO: generate structure
        //    figure out title + url for each page
        //    figure out site sections (provided via config file?)
        //    generate header, add to each page
        //    remap urls to new locations
        //    download all images, remap image urls
        //    fixup embeds (video, collapsible sections, etc...)
        const pages: PageInfo[] = [];
        const sectionpages: PageInfo[] = [];

        const dirsToRead = [{ dirPath: "static/export", depth: 0 }];
        while (dirsToRead.length) {
          const dirToRead = dirsToRead.pop();
          if (!dirToRead) {
            break;
          }

          const { dirPath, depth } = dirToRead;

          for await (const ent of await fs.promises.opendir(dirPath)) {
            const entPath = path.join(dirPath, ent.name);
            if (ent.isFile() && /\.html$/.test(entPath)) {
              const $ = cheerio.load(fs.readFileSync(entPath));
              const title = $(".page-title").text();

              const page: PageInfo = {
                originalPath: entPath,
                newPath: title + ".html",
                title,
                dir: dirPath,
                assetDir: entPath.replace(/\.html$/, ""),
              };
              pages.push(page);

              if (depth == 1) {
                sectionpages.push(page);
              }
            } else if (ent.isDirectory()) {
              dirsToRead.push({ dirPath: entPath, depth: depth + 1 });
            }
          }
        }

        // we list the export directory first. It should only have a single page inside of it, which will be inserted
        // into the pages array first. This is our index page.
        const homePage = pages[0];
        homePage.newPath = "index.html";
        const urlMap: UrlMap = {};

        // TODO: handle duplicate titles
        for (const page of pages) {
          urlMap[page.originalPath] = page.newPath;
        }

        for (const page of pages) {
          console.log(`processing ${page.originalPath}`);
          const $ = cheerio.load(fs.readFileSync(page.originalPath));

          transformHeader($, sectionpages);
          transformLinks($, urlMap);

          const outPath = path.join("static/dist", page.newPath);
          fs.mkdirSync(path.dirname(outPath), { recursive: true });
          fs.writeFileSync(outPath, $.html());
          console.log(`wrote ${outPath}`);
        }
      },
    )
    .help().argv;
}
