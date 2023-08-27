import { stylesheet } from "typestyle";
import { DatabaseId, PageWithChildren, RenderContext } from "../util";
import { pageLayout } from "./util";
import { renderHeader } from "./header";
import * as React from "react";
import { pageLink, renderRichTextContents } from "./rich-text";
import * as csstips from "csstips";
import fs from "fs";
import path from 'path'

const css = stylesheet({
  db: {
    ...csstips.vertical,
  },
  dbRowContainer: {
    ...csstips.content,
    ...csstips.vertical,
  },
  dbTitle: {
    ...csstips.content,
    ...csstips.horizontal,
  },
  dbRow: {
    ...csstips.content,
    ...csstips.horizontal,
  },
});

export function renderDbBlock(databaseId: DatabaseId, context: RenderContext) {
  const db = context.dbs[databaseId];
  const pages = db.children.map((pageId) => context.pages[pageId]);

  const title = renderRichTextContents(db.title, context);
  debugger;

  return (
    <div className={css.db}>
      <div className={css.dbTitle}>{title}</div>
      <div className={css.dbRowContainer}>
        {pages.map((p) => renderPageRow(p, context))}
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

function renderPageRow(page: PageWithChildren, context: RenderContext) {
  return <div className={css.dbRow}>{pageLink(page, context)}</div>;
}
