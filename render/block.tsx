import { BlockWithChildren } from "../fetch-page";
import * as React from "react";
import { renderRichText } from "./rich-text";
import { RenderContext, assertUnreachable } from "../util";
import { stylesheet } from "typestyle";
import { colors } from "./constants";
import { pageLink } from "./common";

const css = stylesheet({
  embed: {},
  childPage: {
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

export function renderBlock(block: BlockWithChildren, context: RenderContext) {
  switch (block.type) {
    case "paragraph":
      return <p>{renderRichText(block.paragraph.rich_text, context)}</p>;
    case "heading_1":
      return <h1>{renderRichText(block.heading_1.rich_text, context)}</h1>;
    case "heading_2":
      return <h2>{renderRichText(block.heading_2.rich_text, context)}</h2>;
    case "heading_3":
      return <h3>{renderRichText(block.heading_3.rich_text, context)}</h3>;
    case "bulleted_list_item":
    case "numbered_list_item":
    case "quote":
    case "to_do":
    case "toggle":
    case "template":
    case "synced_block":
      return <div>Not implemented</div>;
    case "child_page":
      const childPage = context.pages[block.id];
      if (!childPage) {
        console.warn(`Unable to find page with id ${block.id}`);
        return <div>Unable to find page with id {block.id}</div>;
      }
      return (
        <div className={css.childPage}>{pageLink(childPage, context)}</div>
      );
    case "child_database":
    case "equation":
    case "code":
    case "callout":
    case "divider":
    case "breadcrumb":
    case "table_of_contents":
    case "column_list":
    case "column":
    case "link_to_page":
    case "table":
    case "table_row":
      return <div>Not implemented</div>;
    case "embed":
      const url = block.embed.url;
      return (
        <div className={css.embed}>
          {url.startsWith("https://youtu.be") ? (
            <iframe
              width="560"
              height="315"
              src={
                "https://www.youtube.com/embed" +
                url.slice(url.lastIndexOf("/"))
              }
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen={true}
              frameBorder="0"
            ></iframe>
          ) : (
            <a href={url}>{url}</a>
          )}
        </div>
      );

    case "bookmark":
    case "image":
    case "video":
    case "pdf":
    case "file":
    case "audio":
    case "link_preview":
    case "unsupported":
      return <div>Not implemented</div>;
    default:
      assertUnreachable(block);
  }
}
