import { RenderContext, PageWithChildren } from "../util";
import fs from "fs";
import path from "path";
import * as React from "react";
import * as csstips from "csstips";
import { renderRichText } from "./rich-text";
import { renderBlocks } from "./block";
import { renderHeader } from "./header";
import { pageLayout } from "./util";

// see https://typestyle.github.io/#/page
csstips.normalize();
csstips.setupPage("#root");

export function renderPage(
  page: PageWithChildren,
  context: RenderContext,
) {
  const header = renderHeader(page, context);
  const content = [
    <h1>
      {page.properties["title"]
        ? renderRichText((page.properties["title"] as any).title, context)
        : ""}
    </h1>,
    ...renderBlocks(page.children, context),
  ];

  const html = pageLayout({ header, content });

  fs.writeFileSync(path.join("dist", page.id + ".html"), html);
}
