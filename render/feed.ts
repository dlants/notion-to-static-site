import { Feed } from "feed";
import {
  DatabaseId,
  RenderContext,
  getFilePath,
  getPageTitleProperty,
} from "../util";
import _ from "lodash";
import { renderRichTextToPlainText } from "./rich-text";
import fs from "fs";
import path from "path";
import { DbRenderOptions, getPagesForDb } from "./database";

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

  for (const page of pages) {
    if (page.id == "index") {
      continue;
    }

    const pageTitleProperty = getPageTitleProperty(page);
    const pageTitle = pageTitleProperty
      ? renderRichTextToPlainText(pageTitleProperty.title)
      : "[Untitled]";

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
      date: new Date(page.created_time),
    });
  }

  fs.writeFileSync(
    path.join(
      "dist",
      getFilePath({
        type: "db",
        databaseId,
        tagFilter: options.filterTagId,
        feedType: "rss",
      }),
    ),
    feed.rss2(),
  );
  fs.writeFileSync(
    path.join(
      "dist",
      getFilePath({
        type: "db",
        databaseId,
        tagFilter: options.filterTagId,
        feedType: "atom",
      }),
    ),
    feed.rss2(),
  );
}
