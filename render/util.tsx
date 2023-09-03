import * as React from "react";
import { getStyles, cssRule, stylesheet, media, extend } from "typestyle";
import { COLORS } from "./constants";
import * as csstips from "csstips";
import * as csx from "csx";
import { renderToString } from "react-dom/server";
import { MAX_WIDTH_PX } from "./constants";
import { siteConfig } from "../config";

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

cssRule("html", {
  fontSize: csx.px(16),
  lineHeight: "1.5",
  $nest: {
    a: {
      color: COLORS.darkgray.toString(),
      textDecorationColor: COLORS.darkgray.toString(),
    },
    ol: {
      listStyleType: "decimal",
      $nest: {
        ol: {
          listStyleType: "lower-alpha",
          $nest: {
            ol: {
              listStyleType: "lower-roman",
              $nest: {
                ol: {
                  listStyleType: "decimal",
                  $nest: {
                    ol: {
                      listStyleType: "lower-alpha",
                      $nest: {
                        ol: {
                          listStyleType: "lower-roman",
                          // 6 layers deep should be enough
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

export type PageMetadata = {
  title?: string;
};

export function pageLayout({
  header,
  content,
  meta,
}: {
  header: JSX.Element;
  content: (string | JSX.Element | undefined)[];
  meta: PageMetadata;
}) {
  const pageContent = renderToString(
    <div className={css.page}>
      {header}
      <div className={css.contentContainer}>
        <div className={css.contentPadding} />

        <div className={css.content}>{...content}</div>

        <div className={css.contentPadding} />
      </div>

      <div className={css.footer} />
    </div>,
  );

  return pageTemplate(pageContent, meta);
}

export function pageTemplate(pageContent: string, meta?: PageMetadata) {
  return `\
<!DOCTYPE html>
<html>
<head>
  ${meta?.title ? `<title>${meta.title}</title>` : ""}
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
  ${
    siteConfig.goatCounter
      ? `<script data-goatcounter="${siteConfig.goatCounter.scriptData}"
    async src="${siteConfig.goatCounter.scriptSrc}"></script>`
      : ""
  }
</head>
<body>
  ${`<a rel="me" style="display: none" href="${siteConfig.mastodonHref}">Mastodon</a>`}
  <div id="root">
    ${pageContent}
  </div>
</body>
</html>`;
}
