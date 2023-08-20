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
import { stylesheet, getStyles, classes } from "typestyle";
import * as csstips from "csstips";

const css = stylesheet({
  page: {},
  content: {},

  navHeader: {
    ...csstips.pageTop,
    ...csstips.horizontal,
    ...csstips.horizontallySpaced(10),
  },
  headerItem: {
    ...csstips.content,
  },
  divider: {
    ...csstips.flex,
  },
  subscribe: {},
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
          return renderToString(await pageLink(renderer, page));
        } else {
          console.error(`did not find page ${data.mention.page.id}`)
          // TODO: fix this up
          return data.plain_text
        }
      } else {
        return data.plain_text
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
</head>
<body>
${pageContent}
</body>
</html>`;

  fs.writeFileSync(path.join("dist", page.id + ".html"), html);
}

async function pageLink(renderer: NotionRenderer, page: PageWithChildren) {
  const title = await renderPageTitle(renderer, page);
  return (
    <a
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
