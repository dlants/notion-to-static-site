import { PageWithChildren } from "../fetch-page";
import { RenderContext, getBreadcrumbs, getSectionPages } from "../util";
import * as React from "react";
import { stylesheet, classes, media, extend } from "typestyle";
import * as csstips from "csstips";
import * as csx from "csx";
import { favicon } from "./favicon";
import { colors } from "./constants";
import { pageLink } from "./rich-text";

const css = stylesheet({
  header: {
    ...csstips.content,
    ...csstips.vertical,
  },

  topHeaderRow: {
    background: colors.lightgray.toString(),
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
        color: colors.black.toString(),
        textDecoration: "none",
        textDecorationColor: colors.lightgray.toString(),
        $nest: {
          "&:hover": {
            backgroundColor: colors.lightgray.toString(),
          },
        },
      },
    },
  },

  breadcrumb: {},

  section: {
    ...extend(media({ maxWidth: 690 }, { display: "none" })),
  },

  homeImage: {
    ...csstips.content,
    ...csstips.horizontal,
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
  page: PageWithChildren | undefined,
  context: RenderContext,
) {
  const breadcrumbs = page
    ? getBreadcrumbs({
        pageId: page.id,
        pages: context.pages,
        blocks: context.blocks,
      })
    : undefined;
  const sectionPages = getSectionPages({ pages: context.pages });

  return (
    <div className={css.header}>
      <div className={classes(css.headerRow, css.topHeaderRow)}>
        <a className={css.homeImage} href="index.html">
          {favicon}
        </a>
        <div className={css.divider} />
        {sectionPages.map((pageId) => (
          <div className={classes(css.headerItem, css.section)}>
            {pageLink(context.pages[pageId], context)}
          </div>
        ))}
        <div className={classes(css.headerItem, css.subscribe)}>
          <a href="/buttondown.html">✉️ newsletter</a>
        </div>
      </div>

      <div className={css.headerRow}>
        {(breadcrumbs || []).map((pageId, idx) => (
          <div className={classes(css.headerItem, css.breadcrumb)}>
            {idx == 0 ? "" : " > "}
            {pageLink(context.pages[pageId], context)}
          </div>
        ))}
      </div>
    </div>
  );
}
