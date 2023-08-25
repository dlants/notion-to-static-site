import { getStyles, cssRule } from "typestyle";
import { colors } from "./constants";
import * as csx from "csx";

cssRule("html", {
  fontSize: csx.px(16),
  lineHeight: "1.5",
  $nest: {
    a: {
      color: colors.darkgray.toString(),
      textDecorationColor: colors.darkgray.toString(),
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
