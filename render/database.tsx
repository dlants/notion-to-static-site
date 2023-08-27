import { stylesheet } from "typestyle";
import { DatabaseId, PageWithChildren, RenderContext } from "../util";
import * as React from "react";
import { pageLink, renderRichTextContents } from "./rich-text";
import * as csstips from "csstips";

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

export function renderDb(databaseId: DatabaseId, context: RenderContext) {
  const db = context.dbs[databaseId];
  const pages = db.children.map((pageId) => context.pages[pageId]);

  const title = renderRichTextContents(db.title, context);
  debugger

  return (
    <div className={css.db}>
      <div className={css.dbTitle}>{title}</div>
      <div className={css.dbRowContainer}>
        {pages.map((p) => renderPageRow(p, context))}
      </div>
    </div>
  );
}

function renderPageRow(page: PageWithChildren, context: RenderContext) {
  return <div className={css.dbRow}>{pageLink(page, context)}</div>;
}
