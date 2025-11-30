import { siteConfig } from "../config";
import { BaseRenderContext, TagId, TagSiteConfigId, getFilePath } from "../util";
import { renderDbBlock } from "./database";
import { renderHeader } from "./header";
import { pageLayout } from "./util";
import { renderDbFeed } from "./feed";
import { stylesheet } from "typestyle";
import * as csstips from "csstips";
import * as React from "react";
import fs from "fs";
import path from "path";

const css = stylesheet({
  filterHeader: {
    ...csstips.content,
    ...csstips.vertical,
  },
  feedLink: {
    ...csstips.content,
  },
});

export function renderTagPage(
  tagId: TagId,
  tagSiteConfigId: TagSiteConfigId,
  context: BaseRenderContext,
) {
  const db = context.dbs[siteConfig.rootDatabaseId];
  const header = renderHeader(db, context);
  const content = [
    <div className={css.filterHeader}>
      <h1>{tagSiteConfigId}</h1>

      <div>
        Get notified about posts tagged "{tagSiteConfigId}" :{" "}
        <a
          href={
            "/" +
            getFilePath({
              type: "newsletter",
              tag: tagSiteConfigId,
            })
          }
        >
          newsletter
        </a>{" "}
        <a
          className={css.feedLink}
          href={
            "/" +
            getFilePath({
              type: "feed",
              tag: tagSiteConfigId,
              feedType: "rss",
            })
          }
        >
          rss
        </a>{" "}
        <a
          className={css.feedLink}
          href={
            "/" +
            getFilePath({
              type: "feed",
              tag: tagSiteConfigId,
              feedType: "atom",
            })
          }
        >
          atom
        </a>
      </div>
    </div>,
    renderDbBlock(
      siteConfig.rootDatabaseId,
      { tagFilter: { id: tagId, tagSiteConfigId } },
      context,
    ),
  ];

  const html = pageLayout({
    header,
    content,
    meta: {
      title: tagSiteConfigId,
    },
  });

  const outPath = path.join(
    "dist",
    getFilePath({
      type: "tag",
      tag: tagSiteConfigId,
    }),
  );

  fs.mkdirSync(path.dirname(outPath), {
    recursive: true,
  });
  fs.writeFileSync(outPath, html);

  renderDbFeed(db.id, { tagFilter: { id: tagId, tagSiteConfigId } }, context);
}
