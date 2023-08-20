import { NotionRenderer, createBlockRenderer } from "@notion-render/client";
import { PageWithChildren } from "./fetch-page";
import { PageId, getBreadcrumbs, getSectionPages } from "./util";
import fs from "fs";
import path from "path";
import {
  ChildPageBlockObjectResponse,
  MentionRichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { renderToString } from "react-dom/server";
import * as React from "react";
import { stylesheet, getStyles, classes, cssRule } from "typestyle";
import * as csstips from "csstips";
import * as csx from "csx";

// see https://typestyle.github.io/#/page
csstips.normalize();
csstips.setupPage("#root");

const HEADER_HEIGHT_PX = 30;

const colors = {
  black: csx.hsl(0, 0, 0),
  lightgray: csx.hsl(0, 0, 0.9),
  darkgray: csx.hsl(0, 0, 0.4),
  gray: csx.hsl(0, 0, 0.6),
};

const css = stylesheet({
  page: {
    ...csstips.vertical,
  },

  navHeader: {
    ...csstips.content,
    ...csstips.pageTop,
    ...csstips.horizontal,
    ...csstips.horizontallySpaced(10),
    paddingRight: csx.px(10),
    alignItems: "center",
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
        maxHeight: csx.px(HEADER_HEIGHT_PX),
      },
    },
  },

  divider: {
    ...csstips.flex,
  },

  content: {
    ...csstips.flex,
    ...csstips.horizontallyCenterSelf,
    width: "80%",
    marginTop: csx.px(HEADER_HEIGHT_PX),
  },

  subscribe: {},

  mention: {
    $nest: {
      a: {
        color: colors.black.toString(),
        fontWeight: "bold",
        textDecorationColor: colors.lightgray.toString(),
        $nest: {
          "&:hover": {
            backgroundColor: colors.lightgray.toString(),
          },
        },
      },
    },
  },

  pageLink: {},
});

cssRule("figure img", {
  ...csstips.horizontallyCenterSelf,
  ...csstips.width("100%"),
});

export async function renderPage({
  page,
  pages,
}: {
  page: PageWithChildren;
  pages: { [pageId: PageId]: PageWithChildren };
}) {
  const childPageRenderer = createBlockRenderer<ChildPageBlockObjectResponse>(
    "child_page",
    async (data, renderer) => {
      const childPage = pages[data.id];
      return renderToString(
        <div className="child_page">{await pageLink(renderer, childPage)}</div>,
      );
    },
  );

  const mentionRenderer = createBlockRenderer<MentionRichTextItemResponse>(
    "mention",
    async (data, renderer) => {
      if (data.mention.type == "page") {
        const page = pages[data.mention.page.id];
        if (page) {
          return renderToString(
            <span className={css.mention}>
              {await pageLink(renderer, page)}
            </span>,
          );
        } else {
          console.error(`did not find page ${data.mention.page.id}`);
          // TODO: fix this up
          return data.plain_text;
        }
      } else {
        // TODO: maybe use default renderer here
        return data.plain_text;
      }
    },
  );

  const renderer = new NotionRenderer({
    renderers: [childPageRenderer, mentionRenderer],
  });

  const breadcrumbs = getBreadcrumbs({ pageId: page.id, pages });
  const sectionPages = getSectionPages({ pages });

  const pageContent = renderToString(
    <div className={css.page}>
      <div className={css.navHeader}>
        <a className={css.homeImage} href="index.html">
          <img src="/favicon.png" />
        </a>
        {await Promise.all(
          breadcrumbs.map(async (pageId, idx) => (
            <div className={css.headerItem}>
              {idx == 0 ? "" : ">"}
              {await pageLink(renderer, pages[pageId])}
            </div>
          )),
        )}
        <div className={css.divider} />
        {await Promise.all(
          sectionPages.map(async (pageId) => (
            <div className={css.headerItem}>
              {await pageLink(renderer, pages[pageId])}
            </div>
          )),
        )}
        <div className={classes(css.headerItem, css.subscribe)}>
          <a href="https://buttondown.email/dlants">get emails</a>
        </div>
      </div>
      <div
        className={css.content}
        dangerouslySetInnerHTML={{
          __html: await renderer.render(...page.children),
        }}
      />
    </div>,
  );

  const html = `\
<!DOCTYPE html>
<html>
<head>
  <style>${getStyles()}</style>
  <link rel="icon" type="image/x-icon" href="/favicon.png"></link>
  <meta name="viewport" content="width=device-width">
</head>
<body>
  <div id="root">
    ${pageContent}
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join("dist", page.id + ".html"), html);
}

async function pageLink(renderer: NotionRenderer, page: PageWithChildren) {
  const title = await renderPageTitle(renderer, page);
  return (
    <a
      className={css.pageLink}
      href={page.id + ".html"}
      dangerouslySetInnerHTML={{
        __html: title,
      }}
    />
  );
}

function renderPageTitle(renderer: NotionRenderer, page: PageWithChildren) {
  return renderer.render(...(page.properties["title"] as any).title);
}
