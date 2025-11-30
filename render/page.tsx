import {
  BaseRenderContext,
  RenderContext,
  PageWithChildren,
  getPageTitleProperty,
  getPagePublishDateProperty,
  getFilePath,
  getPageShortUrl,
} from "../util";
import fs from "fs";
import path from "path";
import * as React from "react";
import * as csstips from "csstips";
import {
  pageLink,
  renderRichText,
  renderRichTextToPlainText,
} from "./rich-text";
import { renderBlocks } from "./block";
import { renderHeader } from "./header";
import { pageLayout } from "./util";

// see https://typestyle.github.io/#/page
csstips.normalize();
csstips.setupPage("#root");

export function renderPage(page: PageWithChildren, context: BaseRenderContext) {
  const pageContext: RenderContext = { ...context, currentPage: page };
  const header = renderHeader(page, pageContext);
  const titleProperty = getPageTitleProperty(page);
  const publishDateProperty = getPagePublishDateProperty(page);

  const content = [
    <h1>
      {titleProperty
        ? renderRichText(titleProperty.title, pageContext)
        : "[Untitled Page]"}
    </h1>,
    publishDateProperty?.date?.start && (
      <div style={{ color: '#666', fontSize: '0.9em', marginBottom: '1em' }}>
        {new Date(publishDateProperty.date.start).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </div>
    ),
    ...renderBlocks(page.children, pageContext),
  ];

  // for backwards compatibility, render redirect pages for all the old ids
  const redirectHtml = pageLayout({
    header,
    content: [<h1>Page has moved</h1>, <div>{pageLink(page, pageContext)} </div>],
    meta: {
      title: "page has moved",
    },
  });
  const redirectPath = path.join("dist", page.id + ".html");
  fs.writeFileSync(redirectPath, redirectHtml);
  console.log(`wrote ${redirectPath}`);

  const html = pageLayout({
    header,
    content,
    meta: {
      title: titleProperty
        ? renderRichTextToPlainText(titleProperty.title)
        : undefined,
    },
  });

  const filePath = path.join(
    "dist",
    getFilePath({
      type: "page",
      shortUrl: getPageShortUrl(page),
    }),
  );
  fs.writeFileSync(filePath, html);
  console.log(`wrote ${filePath}`);
}
