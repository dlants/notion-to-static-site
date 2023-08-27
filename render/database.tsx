import { stylesheet } from "typestyle";
import {
  DatabaseId,
  DatabaseWithChildren,
  PageWithChildren,
  MultiSelectPageProperty,
  RenderContext,
  getFilePath,
  MultiSelectDbProperty,
  Tags,
} from "../util";
import { pageLayout } from "./util";
import { renderHeader } from "./header";
import * as React from "react";
import { pageLink, renderRichTextContents } from "./rich-text";
import * as csstips from "csstips";
import * as csx from "csx";
import fs from "fs";
import path from "path";
import _ from "lodash";
import { NOTION_BACKGROUND_COLORS } from "./constants";

const css = stylesheet({
  db: {
    ...csstips.vertical,
    ...csstips.verticallySpaced(10),
  },
  dbRowContainer: {
    ...csstips.content,
    ...csstips.vertical,
    ...csstips.verticallySpaced(5),
  },
  dbTitleRow: {
    ...csstips.content,
    ...csstips.horizontal,
    ...csstips.horizontallySpaced(10),
    whiteSpace: "nowrap",
  },
  dbTitle: {
    ...csstips.content,
  },
  dbRow: {
    ...csstips.content,
    ...csstips.horizontal,
    ...csstips.horizontallySpaced(10),
    whiteSpace: "nowrap",
  },
  tag: {
    ...csstips.content,
    height: csx.em(1.2),
    borderRadius: csx.px(3),
  },
});

export function renderDbBlock(databaseId: DatabaseId, context: RenderContext) {
  const db = context.dbs[databaseId];
  const pages = db.children.map((pageId) => context.pages[pageId]);

  const allTags = getDbTags(db);
  const title = renderRichTextContents(db.title, context);
  return (
    <div className={css.db}>
      <div className={css.dbTitleRow}>
        <span className={css.dbTitle}>{title}</span>
        {allTags ? renderTags(databaseId, allTags.multi_select.options) : ""}
      </div>
      <div className={css.dbRowContainer}>
        {pages.map((p) => renderPageRow(databaseId, p, context))}
      </div>
    </div>
  );
}

export function renderDbPage(databaseId: DatabaseId, context: RenderContext) {
  const db = context.dbs[databaseId];
  const header = renderHeader(db, context);
  const content = [renderDbBlock(databaseId, context)];

  const html = pageLayout({ header, content });

  fs.writeFileSync(path.join("dist", db.id + ".html"), html);
}

function getDbTags(db: DatabaseWithChildren) {
  return _.find(
    _.values(db.properties),
    (p): p is MultiSelectDbProperty => p.type == "multi_select",
  );
}

function getTags(page: PageWithChildren) {
  return _.find(
    _.values(page.properties),
    (p): p is MultiSelectPageProperty => p.type == "multi_select",
  );
}

function renderPageRow(
  databaseId: DatabaseId,
  page: PageWithChildren,
  context: RenderContext,
) {
  const tags = getTags(page);
  return (
    <div className={css.dbRow}>
      {pageLink(page, context)}
      {tags ? renderTags(databaseId, tags.multi_select) : ""}
    </div>
  );
}

function renderTags(databaseId: DatabaseId, tags: Tags) {
  debugger;
  return tags.map((tag) => (
    <a
      className={css.tag}
      style={{
        background: NOTION_BACKGROUND_COLORS[tag.color].toString(),
      }}
      href={getFilePath({ type: "db", databaseId, tagFilter: tag.id })}
    >
      {tag.name}
    </a>
  ));
}
