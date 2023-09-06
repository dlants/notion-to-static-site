import { Feed } from "feed";
import {
  DatabaseId,
  DatePageProperty,
  RenderContext,
  getFilePath,
  getPageTitleProperty,
} from "../util";
import _ from "lodash";
import { renderRichTextToPlainText } from "./rich-text";
import fs from "fs";
import path from "path";
import { DbRenderOptions, getPagesForDb } from "./database";
import { siteConfig } from "../config";

export function renderDbFeed(
  databaseId: DatabaseId,
  options: DbRenderOptions,
  context: RenderContext,
) {
  const feed = new Feed({
    title: "dlants.me",
    description: "Writing about things that I feel like writing about",
    id: "https://dlants.me",
    link: "https://dlants.me",
    language: "en",
    image: "https://dlants.me/black-rectangle.svg",
    copyright: "All rights reserved, 2023, Denis Lantsman",
    generator: "awesome",
    feedLinks: {
      rss: "https://dlants.me/rss",
      atom: "https://dlants.me/atom",
      json: "https://dlants.me/json",
    },
    author: {
      name: "Denis Lantsman",
      email: "mail@mail.dlants.me",
      link: "https://dlants.me",
    },
  });

  ["Technology", "Education", "Climbing", "Training", "Tech", "Ed-Tech"].map(
    (c) => feed.addCategory(c),
  );

  const { pages } = getPagesForDb(databaseId, options, context);

  const db = context.dbs[databaseId];
  const propertyName = siteConfig.publishDatePropertyName;
  const propertyId = db.properties[propertyName].id;
  if (!propertyId) {
    throw new Error(`Expedted db to have property ${propertyName}`);
  }

  for (const page of pages) {
    if (page.id == "index") {
      continue;
    }

    const pageTitleProperty = getPageTitleProperty(page);
    const pageTitle = pageTitleProperty
      ? renderRichTextToPlainText(pageTitleProperty.title)
      : "[Untitled]";

    const publisehdDateProp = _.find(
      _.values(page.properties),
      (prop): prop is DatePageProperty => prop.id == propertyId,
    );
    const date = publisehdDateProp?.date?.start;

    if (date) {
      feed.addItem({
        title: pageTitle,
        id: page.id,
        link: `https://dlants.me/${page.id}.html`,
        description: "Read the full post at dlants.me",
        content: "Read the full post at dlants.me",
        author: [
          {
            name: "Denis Lantsman",
            email: "mail@mail.dlants.me",
            link: "https://dlants.me",
          },
        ],
        date: new Date(date),
      });
    }
  }

  const rssPath = path.join(
    "dist",
    getFilePath({
      type: "feed",
      tag: options.tagFilter?.tagSiteConfigId,
      feedType: "rss",
    }),
  );
  fs.mkdirSync(path.dirname(rssPath), { recursive: true });
  fs.writeFileSync(rssPath, feed.rss2());

  const atomPath = path.join(
    "dist",
    getFilePath({
      type: "feed",
      tag: options.tagFilter?.tagSiteConfigId,
      feedType: "atom",
    }),
  );
  fs.mkdirSync(path.dirname(atomPath), { recursive: true });
  fs.writeFileSync(atomPath, feed.atom1());
}
