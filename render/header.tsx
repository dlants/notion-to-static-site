import {
  BaseRenderContext,
  getBreadcrumbs,
  PageWithChildren,
  assertUnreachable,
  DatabaseWithChildren,
  normalizePageId,
  getFilePath,
} from "../util";
import * as React from "react";
import { stylesheet, classes, media, extend } from "typestyle";
import * as csstips from "csstips";
import * as csx from "csx";
import { favicon } from "./favicon";
import { COLORS } from "./constants";
import { databaseLink, pageLink } from "./rich-text";
import { siteConfig } from "../config";
import _ from 'lodash'

const css = stylesheet({
  header: {
    ...csstips.content,
    ...csstips.vertical,
  },

  topHeaderRow: {
    background: COLORS.lightgray.toString(),
  },

  headerRow: {
    ...csstips.content,
    ...csstips.horizontal,
    ...csstips.horizontallySpaced(10),
    alignItems: "flex-end",
    paddingRight: csx.px(15),
    paddingLeft: csx.px(15),
    maxWidth: "100%",
    overflow: "hidden",
    flexWrap: "nowrap",
  },

  headerItem: {
    ...csstips.content,
    $nest: {
      a: {
        color: COLORS.black.toString(),
        textDecoration: "none",
        textDecorationColor: COLORS.lightgray.toString(),
        $nest: {
          "&:hover": {
            backgroundColor: COLORS.lightgray.toString(),
          },
        },
      },
    },
  },

  breadcrumb: {},

  section: {
    ...extend(media({ maxWidth: 690 }, { display: "none" })),
  },

  homeLink: {
    ...csstips.content,
    ...csstips.horizontal,
    ...csstips.horizontallySpaced(10),
    textDecoration: "none",
    alignItems: "center",
    $nest: {
      img: {
        maxHeight: csx.px(30),
      },
    },
  },

  divider: {
    ...csstips.flex,
  },

  subscribe: {},
});

export function renderHeader(
  node: PageWithChildren | DatabaseWithChildren | undefined,
  context: BaseRenderContext,
) {
  const breadcrumbs = node ? getBreadcrumbs(node.id, context) : undefined;
  const sectionPages = siteConfig.headerPageIds.map(normalizePageId);

  return (
    <div className={css.header}>
      <div className={classes(css.headerRow, css.topHeaderRow)}>
        <a className={css.homeLink} href="index.html">
          {favicon}
          <span>{siteConfig.homeName}</span>
        </a>
        <div className={css.divider} />
        {_.keys(siteConfig.tagMap).map((tagId) => {
          const tagSiteConfigId = siteConfig.tagMap[tagId];
          return <div className={classes(css.headerItem, css.section)}>
            <a href={"/" + getFilePath({ type: "tag", tag: tagSiteConfigId })}>
              {tagSiteConfigId}
            </a>
          </div>;
        })}
        {sectionPages.map((pageId) => (
          <div className={classes(css.headerItem, css.section)}>
            {pageLink(context.pages[pageId], context)}
          </div>
        ))}

        {siteConfig.buttondownId ? (
          <div className={classes(css.headerItem, css.subscribe)}>
            {"| "}
            <a href={"/" + getFilePath({ type: "feed", feedType: "rss" })}>rss</a>{" "}
            <a href={"/" + getFilePath({ type: "feed", feedType: "atom" })}>atom</a>{" "}
            <a href={"/" + getFilePath({ type: "newsletter" })}>newsletter</a>
          </div>
        ) : (
          ""
        )}
      </div>

      <div className={css.headerRow}>
        {(breadcrumbs || []).map((breadcrumb, idx) => {
          switch (breadcrumb.type) {
            case "page":
              return (
                <div className={classes(css.headerItem, css.breadcrumb)}>
                  {idx == 0 ? "" : " > "}
                  {pageLink(context.pages[breadcrumb.pageId], context)}
                </div>
              );
            case "database":
              return (
                <div className={classes(css.headerItem, css.breadcrumb)}>
                  {idx == 0 ? "" : " > "}
                  {databaseLink(context.dbs[breadcrumb.databaseId], context)}
                </div>
              );
            default:
              assertUnreachable(breadcrumb);
          }
        })}
      </div>
    </div>
  );
}
