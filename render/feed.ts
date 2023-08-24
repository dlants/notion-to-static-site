import { Feed } from "feed";
import { RenderContext } from "../util";
import _ from "lodash";
import { renderRichTextToPlainText } from "./rich-text";
import fs from "fs";
import path from "path";

export function renderFeeds(context: RenderContext) {
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

  const pages = _.sortBy(_.values(context.pages), (page) => {
    return new Date(page.created_time).getTime();
  });

  for (const page of pages) {
    if (page.id == "index") {
      continue;
    }

    feed.addItem({
      title: page.properties["title"]
        ? renderRichTextToPlainText((page.properties["title"] as any).title)
        : "",
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

  fs.writeFileSync(path.join("dist", "rss.xml"), feed.rss2());
  fs.writeFileSync(path.join("dist", "atom.xml"), feed.atom1());
  fs.writeFileSync(path.join("dist", "json1.json"), feed.json1());
}
