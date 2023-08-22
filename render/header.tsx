import { PageWithChildren } from "../fetch-page";
import { RenderContext, getBreadcrumbs, getSectionPages } from "../util";
import * as React from "react";
import { stylesheet, classes, media, extend } from "typestyle";
import * as csstips from "csstips";
import * as csx from "csx";
import { favicon } from "./favicon";
import { HEADER_HEIGHT_PX, colors } from "./constants";
import { pageLink } from "./rich-text";

const css = stylesheet({
  header: {
    ...csstips.content,
    ...csstips.pageTop,
    ...csstips.horizontal,
    ...csstips.horizontallySpaced(10),
    paddingRight: csx.px(15),
    paddingLeft: csx.px(15),
    alignItems: "flex-end",
    paddingBottom: csx.px(10),
    height: csx.px(HEADER_HEIGHT_PX),
    background: colors.lightgray.toString(),
  },

  headerItem: {
    ...csstips.content,
    $nest: {
      a: {
        marginLeft: "10px",
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

  breadcrumb: {
    ...extend(media({ maxWidth: 1200 }, { display: "none" })),
  },

  section: {
    ...extend(media({ maxWidth: 800}, { display: "none" })),
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

export function renderHeader(page: PageWithChildren, context: RenderContext) {
  const breadcrumbs = getBreadcrumbs({
    pageId: page.id,
    pages: context.pages,
    blocks: context.blocks,
  });
  const sectionPages = getSectionPages({ pages: context.pages });

  return (
    <div>
      <div className={css.header}>
        <a className={css.homeImage} href="index.html">
          {favicon}
        </a>
        {breadcrumbs.map((pageId, idx) => (
          <div className={classes(css.headerItem, css.breadcrumb)}>
            {idx == 0 ? "" : ">"}
            {pageLink(context.pages[pageId], context)}
          </div>
        ))}
        <div className={css.divider} />
        {sectionPages.map((pageId) => (
          <div className={classes(css.headerItem, css.section)}>
            {pageLink(context.pages[pageId], context)}
          </div>
        ))}
        <div className={classes(css.headerItem, css.subscribe)}>
          <a href="https://buttondown.email/dlants">✉️ newsletter</a>
        </div>
      </div>
    </div>
  );
}
