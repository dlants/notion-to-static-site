import { SitemapStream, streamToPromise } from "sitemap";
import { Readable } from "stream";
import {
  DatabaseId,
  BaseRenderContext,
  getPublishDatePropertyId,
  DatePageProperty,
  getFilePath,
  getPageShortUrl,
} from "../util";
import _ from "lodash";
import { DbRenderOptions } from "./database";
import fs from "fs";
import path from "path";

export async function renderSitemap({
  databaseId,
  context,
}: {
  databaseId: DatabaseId;
  options: DbRenderOptions;
  context: BaseRenderContext;
}) {
  const links = [];
  const publishDatePropertyId = getPublishDatePropertyId({
    databaseId,
    context,
  });

  for (const pageId in context.pages) {
    const page = context.pages[pageId];
    const publisehdDateProp = _.find(
      _.values(page.properties),
      (prop): prop is DatePageProperty => prop.id == publishDatePropertyId,
    );
    const date = publisehdDateProp?.date?.start;
    const filePath = getFilePath({
      type: "page",
      shortUrl: getPageShortUrl(page),
    })

    // some pages are not part of the main db, and so do not have a publishedDateProp
    if (!publisehdDateProp || date) {
      links.push({
        url: filePath
      });
    }
  }

  // Create a stream to write to
  const stream = new SitemapStream({ hostname: "https://dlants.me" });

  // Return a promise that resolves with your XML string
  const buf = await streamToPromise(Readable.from(links).pipe(stream));

  const sitemapPath = path.join("dist", "sitemap.xml");

  fs.writeFileSync(sitemapPath, buf);
}
