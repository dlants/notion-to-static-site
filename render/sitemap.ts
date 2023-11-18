import { SitemapStream, streamToPromise } from "sitemap";
import { Readable } from "stream";
import {
  DatabaseId,
  RenderContext,
  getPublishDatePropertyId,
  DatePageProperty,
} from "../util";
import _ from "lodash";
import { DbRenderOptions, getPagesForDb } from "./database";
import fs from "fs";
import path from "path";

export async function renderSitemap({
  databaseId,
  options,
  context,
}: {
  databaseId: DatabaseId;
  options: DbRenderOptions;
  context: RenderContext;
}) {
  const links = [];
  const { pages } = getPagesForDb(databaseId, options, context);
  const publishDatePropertyId = getPublishDatePropertyId({
    databaseId,
    context,
  });

  for (const page of pages) {
    const publisehdDateProp = _.find(
      _.values(page.properties),
      (prop): prop is DatePageProperty => prop.id == publishDatePropertyId,
    );
    const date = publisehdDateProp?.date?.start;

    if (date) {
      links.push({
        url: `/${page.id}.html`
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
