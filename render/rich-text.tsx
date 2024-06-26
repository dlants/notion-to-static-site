import { RichTextItemResponse } from "@notionhq/client/build/src/api-endpoints";
import * as React from "react";
import {
  RenderContext,
  assertUnreachable,
  PageWithChildren,
  DatabaseWithChildren,
  TitlePageProperty,
  getFilePath,
  getPageShortUrl,
} from "../util";
import { stylesheet } from "typestyle";
import { COLORS } from "./constants";
import _ from "lodash";
import { siteConfig } from "../config";

const css = stylesheet({
  mention: {
    $nest: {
      a: {
        color: COLORS.black.toString(),
        fontWeight: "bold",
        textDecorationColor: COLORS.lightgray.toString(),
        $nest: {
          "&:hover": {
            backgroundColor: COLORS.lightgray.toString(),
          },
        },
      },
    },
  },

  pageLink: {},
});

export function renderRichText(
  richText: RichTextItemResponse[],
  context: RenderContext,
) {
  return (
    <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {renderRichTextContents(richText, context)}
    </div>
  );
}

export function renderRichTextToPlainText(richText: RichTextItemResponse[]) {
  return richText.map((item) => item.plain_text).join();
}

const slugMap: { [slug: string]: true } = {};
export function slugify(richText: RichTextItemResponse[]) {
  const text = renderRichTextToPlainText(richText)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

  const slugBase = text.slice(0, 50);
  let slug = slugBase;
  let counter = 0;
  while (slugMap[slug]) {
    slug = slugBase + "_" + counter;
    counter += 1;
  }

  slugMap[slug] = true;
  return slug;
}
export function renderRichTextContents(
  richText: RichTextItemResponse[],
  context: RenderContext,
) {
  return richText.map((item) => renderRichTextElement(item, context));
}

function renderRichTextElement(
  item: RichTextItemResponse,
  context: RenderContext,
) {
  let content;
  switch (item.type) {
    case "text":
      content = item.text.content || item.plain_text;
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

  const itemStyles = getStyle(item.annotations);
  if (!_.isEmpty(itemStyles)) {
    content = <span style={itemStyles}>{content}</span>;
  }

  if (item.type == "text" && item.text.link) {
    content = <a href={item.text.link.url}>{content}</a>;
  }

  return content;
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
    properties.fontFamily = "'Roboto Mono', monospace;";
  }

  if (annotations.color != "default") {
    // TODO: not implemented
    console.warn("annotations.color not implemented");
  }

  return properties;
}

export function pageLink(page: PageWithChildren, context: RenderContext) {
  const title = _.find(
    _.values(page.properties),
    (p): p is TitlePageProperty => p.type == "title",
  );

  return (
    <a
      className={css.pageLink}
      href={
        "/" +
        getFilePath({
          type: "page",
          shortUrl: getPageShortUrl(page),
        })
      }
    >
      {page.id == "index"
        ? siteConfig.homeName
        : title
          ? renderRichTextContents(title.title, context)
          : "[Untitled Page]"}
    </a>
  );
}

export function databaseLink(db: DatabaseWithChildren, context: RenderContext) {
  return (
    <a
      className={css.pageLink}
      href={"/" + getFilePath({ type: "db", databaseId: db.id })}
    >
      {renderRichTextContents(db.title, context)}
    </a>
  );
}
