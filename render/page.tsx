import {
  BaseRenderContext,
  RenderContext,
  PageWithChildren,
  getPageTitleProperty,
  getPagePublishDateProperty,
  getFilePath,
  getPageShortUrl,
  getAdjacentPosts,
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
import { siteConfig } from "../config";

// see https://typestyle.github.io/#/page
csstips.normalize();
csstips.setupPage("#root");

function renderPostNavigation(page: PageWithChildren, context: BaseRenderContext) {
  const { previous, next } = getAdjacentPosts(page, siteConfig.rootDatabaseId, context);

  if (!previous && !next) {
    return undefined;
  }

  return (
    <div style={{
      marginTop: '3em',
      paddingTop: '1em',
      borderTop: '1px solid #ddd',
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '0.9em'
    }}>
      <div style={{ flex: 1 }}>
        {previous && (
          <div>
            <div style={{ color: '#666', marginBottom: '0.25em' }}>← Previous</div>
            {pageLink(previous, context)}
          </div>
        )}
      </div>
      <div style={{ flex: 1, textAlign: 'right' }}>
        {next && (
          <div>
            <div style={{ color: '#666', marginBottom: '0.25em' }}>Next →</div>
            {pageLink(next, context)}
          </div>
        )}
      </div>
    </div>
  );
}

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
    renderPostNavigation(page, context),
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
