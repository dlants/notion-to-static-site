import { stylesheet } from "typestyle";
import {
  DatabaseId,
  DatabaseWithChildren,
  PageWithChildren,
  MultiSelectPageProperty,
  BaseRenderContext,
  getFilePath,
  MultiSelectDbProperty,
  Tags,
  PropertyId,
  TagSiteConfigId,
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
});

export type DbRenderOptions = {
  tagFilter?: {
    id: string;
    tagSiteConfigId: TagSiteConfigId;
  };
};

export type SortOption = {
  propertyId: PropertyId;
  direction: "ascending" | "descending";
};

export function renderDbBlock(
  databaseId: DatabaseId,
  options: DbRenderOptions,
  context: BaseRenderContext,
) {
  const db = context.dbs[databaseId];
  const { pages } = getPagesForDb(databaseId, options, context);
  const title = renderRichTextContents(db.title, context);
  return (
    <div className={css.db}>
      <div className={css.dbTitleRow}>
        <span className={css.dbTitle}>{title}</span>
      </div>
      <div className={css.dbRowContainer}>
        {pages.map((p) => renderPageRow(p, context))}
      </div>
    </div>
  );
}

export function getPagesForDb(
  databaseId: DatabaseId,
  options: DbRenderOptions,
  context: BaseRenderContext,
) {
  const db = context.dbs[databaseId];
  let pages = db.children.map((pageId) => context.pages[pageId]);
  if (options.tagFilter) {
    const targetId = options.tagFilter.id;
    pages = pages.filter((page) => {
      const pageTags = getTags(page);
      return _.some(pageTags?.multi_select, (tag) => tag.id == targetId);
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
  if (options.tagFilter) {
    const targetId = options.tagFilter.id;
    tags = tags?.filter((t) => t.id == targetId);
  }

  return { pages, tags };
}

export function renderDbPage(databaseId: DatabaseId, context: BaseRenderContext) {
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
  const filePath = path.join(
    "dist",
    getFilePath({
      type: "db",
      databaseId,
    }),
  );
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, html);
  renderDbFeed(databaseId, {}, context);
}

export function getDbTags(db: DatabaseWithChildren) {
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

function renderPageRow(page: PageWithChildren, context: BaseRenderContext) {
  const tags = getTags(page);
  return (
    <div className={css.dbRow}>
      {pageLink(page, context)}
      {tags ? renderTags(tags.multi_select) : ""}
    </div>
  );
}

function renderTags(tags: Tags) {
  return tags.map((tag) => {
    const tagSiteConfigId = siteConfig.tagMap[tag.id];
    if (tagSiteConfigId) {
      return (
        <a
          className={css.tag}
          style={{
            background: NOTION_BACKGROUND_COLORS[tag.color].toString(),
          }}
          href={"/" + getFilePath({ type: "tag", tag: tagSiteConfigId })}
        >
          {tag.name}
        </a>
      );
    } else {
      return (
        <span
          className={css.tag}
          style={{
            background: NOTION_BACKGROUND_COLORS[tag.color].toString(),
          }}
        >
          {tag.name}
        </span>
      );
    }
  });
}
