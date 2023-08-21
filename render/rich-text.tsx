import { RichTextItemResponse } from "@notionhq/client/build/src/api-endpoints";
import * as React from "react";
import { RenderContext, assertUnreachable } from "../util";
import { stylesheet } from "typestyle";
import { colors } from "./constants";
import { pageLink } from "./common";

const css = stylesheet({
  mention: {
    $nest: {
      a: {
        color: colors.black.toString(),
        fontWeight: "bold",
        textDecorationColor: colors.lightgray.toString(),
        $nest: {
          "&:hover": {
            backgroundColor: colors.lightgray.toString(),
          },
        },
      },
    },
  },
});

export function renderRichText(
  richText: RichTextItemResponse[],
  context: RenderContext,
) {
  return richText.map((item) => {
    switch (item.type) {
      case "text":
        return item.plain_text;
      case "mention":
        if (item.mention.type == "page") {
          const page = context.pages[item.mention.page.id];
          if (page) {
            return <span className={css.mention}>{pageLink(page, context)}</span>;
          } else {
            console.error(`did not find page ${item.mention.page.id}`);
            // TODO: fix this up
            return item.plain_text;
          }
        } else {
          // TODO: maybe use default renderer here
          return item.plain_text;
        }

      case "equation":
        return item.plain_text;
      default:
        assertUnreachable(item);
    }
  });
}
