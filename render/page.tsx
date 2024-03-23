import {
  RenderContext,
  PageWithChildren,
  getPageTitleProperty,
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

export function renderPage(page: PageWithChildren, context: RenderContext) {
  const header = renderHeader(page, context);
  const titleProperty = getPageTitleProperty(page);
  const content = [
    <h1>
      {titleProperty
        ? renderRichText(titleProperty.title, context)
        : "[Untitled Page]"}
    </h1>,
    ...renderBlocks(page.children, context),
  ];

  // for backwards compatibility, render redirect pages for all the old ids
  const redirectHtml = pageLayout({
    header,
    content: [<h1>Page has moved</h1>, <div>{pageLink(page, context)} </div>],
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
