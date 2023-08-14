import * as yargs from "yargs";
import { $ } from "zx";
import { walk } from "./util";
// import axios from "axios";
import * as cheerio from 'cheerio'
import * as fs from "fs";
import * as path from "path";
import express from "express";
import { insertHeader } from "./transforms/insert-header";

// const url =
//   "https://amethyst-colossus-e0c.notion.site/Amusements-ef63da75f05145d49829963c2d1f929f";

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

        app.use("/static", express.static("static"));
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

        for await (const docPath of walk("static/export")) {
          console.log(`processing ${docPath}`);
          const $ = cheerio.load(
            fs.readFileSync(docPath),
          );
          // TODO: apply transforms
          await insertHeader($)

          const outPath = docPath.replace(/^static\/export/, "static/dist");
          fs.mkdirSync(path.dirname(outPath), {recursive: true})
          fs.writeFileSync(outPath, $.html());
          console.log(`wrote ${outPath}`);
        }
      },
    )
    .help().argv;

  // const res = await axios.get(url);
  // const doc = htmlparser2.parseDocument(res.data);
  // const output = render(doc);
  // if (!fs.existsSync("dist")) {
  //   fs.mkdirSync("dist");
  // }
  // fs.writeFileSync(path.join("dist", "staticsite.html"), output);
}

run();
// .then(
//   () => process.exit(0),
//   (err) => {
//     console.error(err);
//     process.exit(1);
//   },
// );
