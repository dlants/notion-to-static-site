import * as React from "react";
import { getStyles, cssRule, stylesheet, media, extend } from "typestyle";
import { COLORS } from "./constants";
import * as csstips from "csstips";
import * as csx from "csx";
import { renderToString } from "react-dom/server";
import { MAX_WIDTH_PX } from "./constants";

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

export function pageLayout({
  header,
  content,
}: {
  header: JSX.Element;
  content: (string | JSX.Element | undefined)[];
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

  return pageTemplate(pageContent);
}

export function pageTemplate(pageContent: string) {
  return `\
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
}
