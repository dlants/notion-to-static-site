import { CheerioAPI } from "cheerio";
import * as stream from "stream";
import { promisify } from "util";
import axios from "axios";
import * as path from "path";
import url from "url";
import fs from "fs";

const finished = promisify(stream.finished);

export async function downloadFile(
  fileUrl: string,
  outputLocationPath: string,
): Promise<any> {
  const writer = fs.createWriteStream(outputLocationPath);
  return axios({
    method: "get",
    url: fileUrl,
    responseType: "stream",
  }).then((response) => {
    response.data.pipe(writer);
    return finished(writer); //this is a Promise
  });
}

export async function preDownloadAssets({
  $,
  forceDownload
}: {
  $: CheerioAPI;
  forceDownload?: boolean;
}) {
  const urlMap: {
    [originalUrl: string]: string;
  } = {};
  await Promise.all(
    $("img").map(async (_, i) => {
      const src = i.attribs.src;
      if (src.startsWith("http")) {
        // the url is absolute so the second param shouldn't matter
        const parsed = new url.URL(src, "https://www.bogus.com");
        const fileName = path.basename(parsed.pathname!);
        const outPath = path.join("static/dist", fileName);
        if (!forceDownload && fs.existsSync(outPath)) {
          console.log(`skipping ${src} because ${outPath} already exists`)
        } else {
          console.log(`downloading ${src} to ${outPath}`);
          await downloadFile(src, outPath);
          $(i).attr("src", encodeURIComponent(fileName));
          urlMap[src] = encodeURIComponent(fileName);
        }
      }
    }),
  );

  // images are nested inside a elements that link to the image
  await Promise.all(
    $("a").map(async (_, a) => {
      const href = a.attribs.href;
      if (urlMap[href]) {
        $(a).attr("href", urlMap[href]);
      }
    }),
  );
}
