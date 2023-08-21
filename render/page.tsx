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
import { pageLink } from "./common";
import { renderBlock } from "./block";

// see https://typestyle.github.io/#/page
csstips.normalize();
csstips.setupPage("#root");

const css = stylesheet({
  page: {
    ...csstips.vertical,
    alignItems: "center",
  },

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

  content: {
    ...csstips.flex,
    marginTop: csx.px(HEADER_HEIGHT_PX),
    marginLeft: csx.px(20),
    marginRight: csx.px(20),
    maxWidth: csx.px(MAX_WIDTH_PX),
  },

  subscribe: {},
});

cssRule("figure img", {
  ...csstips.horizontallyCenterSelf,
  ...csstips.width("100%"),
});

cssRule("html", {
  fontSize: "min(max(12px, 3vw), 18px);",
  lineHeight: "1.5",
  $nest: {
    a: {
      color: colors.darkgray.toString(),
      textDecorationColor: colors.darkgray.toString(),
    },
  },
});

cssRule(".notion-code", {
  background: colors.lightgray.toString(),
  paddingLeft: csx.px(15),
  overflow: "scroll",
});

cssRule("blockquote", {
  borderLeft: csx.border({
    color: colors.darkgray.toString(),
    style: "solid",
    width: csx.px(2),
  }),
  paddingLeft: csx.px(20),
});

export async function renderPage(
  page: PageWithChildren,
  context: RenderContext,
) {
  const breadcrumbs = getBreadcrumbs({
    pageId: page.id,
    pages: context.pages,
    blocks: context.blocks,
  });
  const sectionPages = getSectionPages({ pages: context.pages });

  const pageContent = renderToString(
    <div className={css.page}>
      <div className={css.navHeader}>
        <a className={css.homeImage} href="index.html">
          {favicon}
        </a>
        {await Promise.all(
          breadcrumbs.map(async (pageId, idx) => (
            <div className={css.headerItem}>
              {idx == 0 ? "" : ">"}
              {pageLink(context.pages[pageId], context)}
            </div>
          )),
        )}
        <div className={css.divider} />
        {await Promise.all(
          sectionPages.map(async (pageId) => (
            <div className={css.headerItem}>
              {pageLink(context.pages[pageId], context)}
            </div>
          )),
        )}
        <div className={classes(css.headerItem, css.subscribe)}>
          <a href="https://buttondown.email/dlants">get emails</a>
        </div>
      </div>
      <div className={css.content}>
        {page.children.map((block) => renderBlock(block, context))}
      </div>
    </div>,
  );

  const html = `\
<!DOCTYPE html>
<html>
<head>
  <style>${getStyles()}</style>
  <style>
    html { font-family: 'Roboto', sans-serif; }
  </style>
  <link rel="icon" href="./black-rectangle.svg">
  <meta name="viewport" content="width=device-width">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet">
</head>
<body>
  <div id="root">
    ${pageContent}
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join("dist", page.id + ".html"), html);
}
