import * as fs from "fs";
import * as path from "path";

export async function* walk(dir: string): AsyncGenerator<string> {
  for await (const ent of await fs.promises.opendir(dir)) {
    const entry = path.join(dir, ent.name);
    if (ent.isDirectory()) yield* walk(entry);
    else if (ent.isFile()) yield entry;
  }
}

export function relativeToAbsoluteUrl({
  relativeUrl,
  pageDir,
}: {
  relativeUrl: string;
  pageDir: string;
}) {
  if (pageDir == "static/export") {
    return relativeUrl;
  }
  return encodeURI(pageDir.slice("static/export/".length)) + "/" + relativeUrl;
}

export type PageInfo = {
  title: string;
  originalPath: string;
  newPath: string;
  dir: string;
  assetDir: string;
};

export type UrlMap = {
  [originalUrl: string]: string;
};

export function generateUrlMap(pages: PageInfo[]) {
  const urlMap: UrlMap = {};
  for (const page of pages) {
    urlMap[encodeURI(page.originalPath.replace(/^static\/export\//, ""))] =
      encodeURIComponent(page.newPath);
  }

  return urlMap;
}
