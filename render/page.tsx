import { RenderContext, PageWithChildren } from "../util";
import fs from "fs";
import path from "path";
import { renderToString } from "react-dom/server";
import * as React from "react";
import { stylesheet, media, extend } from "typestyle";
import * as csstips from "csstips";
import * as csx from "csx";
import { MAX_WIDTH_PX } from "./constants";
import { renderRichText } from "./rich-text";
import { renderBlocks } from "./block";
import { renderHeader } from "./header";
import { pageTemplate } from "./util";

// see https://typestyle.github.io/#/page
csstips.normalize();
csstips.setupPage("#root");

const css = stylesheet({
  page: {
    ...csstips.vertical,
  },

  contentContainer: {
    ...csstips.flex,
    ...csstips.horizontal,
  },

  contentPadding: {
    ...csstips.flex,
  },

  content: {
    ...csstips.content,
    ...extend(
      media(
        { minWidth: MAX_WIDTH_PX + 21 },
        {
          maxWidth: csx.px(MAX_WIDTH_PX),
        },
      ),
      media(
        { minWidth: 0, maxWidth: MAX_WIDTH_PX + 20 },
        {
          width: "100%",
          paddingLeft: csx.px(10),
          paddingRight: csx.px(10),
        },
      ),
    ),
  },

  footer: {
    ...csstips.content,
    height: csx.px(300),
  },
});

export async function renderPage(
  page: PageWithChildren,
  context: RenderContext,
) {
  const pageContent = renderToString(
    <div className={css.page}>
      {renderHeader(page, context)}
      <div className={css.contentContainer}>
        <div className={css.contentPadding} />

        <div className={css.content}>
          <h1>
            {page.properties["title"]
              ? renderRichText((page.properties["title"] as any).title, context)
              : ""}
          </h1>
          {renderBlocks(page.children, context)}
        </div>

        <div className={css.contentPadding} />
      </div>

      <div className={css.footer} />
    </div>,
  );

  const html = pageTemplate(pageContent);

  fs.writeFileSync(path.join("dist", page.id + ".html"), html);
}
