import { PageWithChildren } from "../fetch-page";
import { RenderContext } from "../util";
import fs from "fs";
import path from "path";
import { renderToString } from "react-dom/server";
import * as React from "react";
import { stylesheet, getStyles, cssRule, media, extend } from "typestyle";
import * as csstips from "csstips";
import * as csx from "csx";
import { HEADER_HEIGHT_PX, MAX_WIDTH_PX, colors } from "./constants";
import { renderRichText } from "./rich-text";
import { renderBlock } from "./block";
import { renderHeader } from "./header";

// see https://typestyle.github.io/#/page
csstips.normalize();
csstips.setupPage("#root");

const css = stylesheet({
  page: {
    ...csstips.vertical,
  },

  contentContainer: {
    marginTop: csx.px(HEADER_HEIGHT_PX),
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
});

cssRule("html", {
  fontSize: csx.px(16),
  lineHeight: "1.5",
  $nest: {
    a: {
      color: colors.darkgray.toString(),
      textDecorationColor: colors.darkgray.toString(),
    },
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
          {page.children.map((block) => renderBlock(block, context))}
        </div>

        <div className={css.contentPadding} />
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
  <link href="https://fonts.googleapis.com/css2?family=Roboto" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono" rel="stylesheet">
</head>
<body>
  <div id="root">
    ${pageContent}
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join("dist", page.id + ".html"), html);
}
