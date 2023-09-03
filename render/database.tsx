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
  PropertyId,
  TagId,
  DatePageProperty,
} from "../util";
import { pageLayout } from "./util";
import { renderHeader } from "./header";
import * as React from "react";
import {
  pageLink,
  renderRichTextContents,
  renderRichTextToPlainText,
} from "./rich-text";
import * as csstips from "csstips";
import * as csx from "csx";
import fs from "fs";
import path from "path";
import _ from "lodash";
import { NOTION_BACKGROUND_COLORS } from "./constants";
import { renderDbFeed } from "./feed";
import { siteConfig } from "../config";

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
  feedLink: {
    ...csstips.content,
  },
});

export type DbRenderOptions = {
  filterTagId?: TagId;
};

export type SortOption = {
  propertyId: PropertyId;
  direction: "ascending" | "descending";
};

export function renderDbBlock(
  databaseId: DatabaseId,
  options: DbRenderOptions,
  context: RenderContext,
) {
  const db = context.dbs[databaseId];
  const { pages, tags: allTags } = getPagesForDb(databaseId, options, context);
  const title = renderRichTextContents(db.title, context);
  return (
    <div className={css.db}>
      <div className={css.dbTitleRow}>
        <span className={css.dbTitle}>{title}</span>
        {allTags ? renderTags(databaseId, allTags) : ""}
        <a
          className={css.feedLink}
          href={
            "/" +
            getFilePath({
              type: "db",
              databaseId,
              tagFilter: options.filterTagId,
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
              type: "db",
              databaseId,
              tagFilter: options.filterTagId,
              feedType: "rss",
            })
          }
        >
          atom
        </a>
      </div>
      <div className={css.dbRowContainer}>
        {pages.map((p) => renderPageRow(databaseId, p, context))}
      </div>
    </div>
  );
}

export function getPagesForDb(
  databaseId: DatabaseId,
  options: DbRenderOptions,
  context: RenderContext,
) {
  const db = context.dbs[databaseId];
  let pages = db.children.map((pageId) => context.pages[pageId]);
  if (options.filterTagId) {
    pages = pages.filter((page) => {
      const pageTags = getTags(page);
      return _.some(
        pageTags?.multi_select,
        (tag) => tag.id == options.filterTagId,
      );
    });
  }

  let sort: SortOption | undefined;
  const propertyName = siteConfig.publishDatePropertyName;
  if (db.properties[propertyName]) {
    sort = {
      propertyId: db.properties[propertyName].id,
      direction: "descending",
    };
  }

  if (sort) {
    // to make the typechecker believe us that this will stay defined
    const definedSort = sort;

    pages = _.chain(pages)
      .map((page) => {
        const publisehdDateProp = _.find(
          _.values(page.properties),
          (prop): prop is DatePageProperty => prop.id == definedSort.propertyId,
        );
        const date = publisehdDateProp?.date?.start;

        return {
          page,
          date,
        };
      })
      .filter(({ date }) => {
        return !!date;
      })
      .sortBy(({ date }) => {
        return (
          (definedSort.direction == "ascending" ? 1 : -1) *
          new Date(date!).getTime()
        );
      })
      .map(({ page }) => page)
      .value();
  }

  let tags = getDbTags(db)?.multi_select.options;
  if (options.filterTagId) {
    tags = tags?.filter((t) => t.id == options.filterTagId);
  }

  return { pages, tags };
}

export function renderDbPages(databaseId: DatabaseId, context: RenderContext) {
  const db = context.dbs[databaseId];

  const header = renderHeader(db, context);
  const content = [renderDbBlock(databaseId, {}, context)];
  const html = pageLayout({
    header,
    content,
    meta: {
      title: renderRichTextToPlainText(db.title),
    },
  });
  fs.writeFileSync(
    path.join(
      "dist",
      getFilePath({
        type: "db",
        databaseId,
      }),
    ),
    html,
  );
  renderDbFeed(databaseId, {}, context);

  // render a page for each tag
  const tags = getDbTags(db)?.multi_select.options;
  for (const tag of tags || []) {
    const content = [
      renderDbBlock(databaseId, { filterTagId: tag.id }, context),
    ];
    const html = pageLayout({ header, content, meta: {
      title: renderRichTextToPlainText(db.title) + ': ' + tag.name
    } });
    const outPath = path.join(
      "dist",
      getFilePath({
        type: "db",
        databaseId,
        tagFilter: tag.id,
      }),
    );

    fs.mkdirSync(path.dirname(outPath), {
      recursive: true,
    });
    fs.writeFileSync(outPath, html);

    renderDbFeed(databaseId, { filterTagId: tag.id }, context);
  }
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
  return tags.map((tag) => (
    <a
      className={css.tag}
      style={{
        background: NOTION_BACKGROUND_COLORS[tag.color].toString(),
      }}
      href={"/" + getFilePath({ type: "db", databaseId, tagFilter: tag.id })}
    >
      {tag.name}
    </a>
  ));
}
