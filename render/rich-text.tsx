import { RichTextItemResponse } from "@notionhq/client/build/src/api-endpoints";
import * as React from "react";
import { RenderContext, assertUnreachable } from "../util";
import { stylesheet } from "typestyle";
import { colors } from "./constants";
import { pageLink } from "./common";
import _ from "lodash";

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
    let content;
    switch (item.type) {
      case "text":
        content = item.plain_text;
        break;
      case "mention":
        if (item.mention.type == "page") {
          const page = context.pages[item.mention.page.id];
          if (page) {
            content = (
              <span className={css.mention}>{pageLink(page, context)}</span>
            );
          } else {
            console.error(`did not find page ${item.mention.page.id}`);
            // TODO: fix this up
            content = item.plain_text;
          }
        } else {
          // TODO: maybe use default renderer here
          content = item.plain_text;
        }
        break;

      case "equation":
        content = item.plain_text;
        break;
      default:
        assertUnreachable(item);
    }

    if (!_.isEmpty(item.annotations)) {
      content = <span style={getStyle(item.annotations)}>{content}</span>;
    }

    return content
  });
}

function getStyle(
  annotations: RichTextItemResponse["annotations"],
): React.CSSProperties {
  const properties: React.CSSProperties = {};

  if (annotations.bold) {
    properties.fontWeight = 600;
  }

  if (annotations.italic) {
    properties.fontStyle = "italic";
  }

  if (annotations.strikethrough) {
    properties.textDecoration = "strikethrough";
  }

  if (annotations.underline) {
    properties.textDecoration = "underline";
  }

  if (annotations.code) {
    properties.fontFamily = "'Roboto Mono', monospace;"
  }

  if (annotations.color) {
    // TODO: not implemented
    console.warn('annotations.color not implemented')
  }

  return properties;
}
