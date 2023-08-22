import { PageWithChildren } from "../fetch-page";
import { RenderContext, getBreadcrumbs, getSectionPages } from "../util";
import fs from "fs";
import path from "path";
import { renderToString } from "react-dom/server";
import * as React from "react";
import { stylesheet, getStyles, classes, cssRule } from "typestyle";
import * as csstips from "csstips";
import * as csx from "csx";
import { favicon } from "./favicon";
import { HEADER_HEIGHT_PX, MAX_WIDTH_PX, colors } from "./constants";
import { pageLink, renderRichText } from "./rich-text";
import { renderBlock } from "./block";

// see https://typestyle.github.io/#/page
csstips.normalize();
csstips.setupPage("#root");

const css = stylesheet({
  navHeader: {
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
    <div className={css.navHeader}>
      <a className={css.homeImage} href="index.html">
        {favicon}
      </a>
      {breadcrumbs.map((pageId, idx) => (
        <div className={css.headerItem}>
          {idx == 0 ? "" : ">"}
          {pageLink(context.pages[pageId], context)}
        </div>
      ))}
      <div className={css.divider} />
      {sectionPages.map((pageId) => (
        <div className={css.headerItem}>
          {pageLink(context.pages[pageId], context)}
        </div>
      ))}
      <div className={classes(css.headerItem, css.subscribe)}>
        <a href="https://buttondown.email/dlants">get emails</a>
      </div>
    </div>
  );
}
