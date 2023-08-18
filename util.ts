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

export type Breadcrumb = {
  title: string;
  url: string;
};

export type PageInfo = {
  id: string;
  breadcrumbs: Breadcrumb[];
  title: string;
  originalPath: string;
  pageUrl: string;
  dir: string;
  assetDir: string;
};

export type AssetInfo = {
  originalPath: string;
  newPath: string;
  basename: string;
  dir: string;
};

export type UrlMap = {
  [originalUrl: string]: string;
};

export function generateUrlMap({
  pages,
  assets,
}: {
  pages: PageInfo[];
  assets: AssetInfo[];
}) {
  const urlMap: UrlMap = {};
  for (const page of pages) {
    urlMap[encodeURI(page.originalPath.replace(/^static\/export\//, ""))] =
      encodeURIComponent(page.pageUrl);
  }

  for (const asset of assets) {
    urlMap[encodeURI(asset.originalPath.replace(/^static\/export\//, ""))] =
      encodeURIComponent(asset.newPath);
  }

  return urlMap;
}
