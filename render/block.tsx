import { BlockWithChildren } from "../fetch-page";
import * as React from "react";
import { renderRichText, pageLink } from "./rich-text";
import { RenderContext, assertUnreachable } from "../util";
import { stylesheet } from "typestyle";
import { colors } from "./constants";
import * as csx from "csx";
import * as csstips from "csstips";

const css = stylesheet({
  video: {
    ...csstips.vertical,
    alignItems: "center",
    ...csstips.width("100%"),
    $nest: {
      iframe: {
        ...csstips.content,
      },
    },
  },
  paragraph: {
    paddingTop: csx.px(3),
    paddingBottom: csx.px(3),
    minHeight: csx.em(1)
  },
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
  quote: {
    borderLeft: csx.border({
      color: colors.darkgray.toString(),
      style: "solid",
      width: csx.px(2),
    }),
    paddingLeft: csx.px(20),
  },
  image: {
    ...csstips.vertical,
    alignItems: "center",
    ...csstips.width("100%"),
    $nest: {
      img: {
        ...csstips.content,
        maxWidth: "100%",
      },
    },
  },

  imageCaption: {
    paddingTop: csx.px(6),
    paddingBottom: csx.px(6),
    color: colors.darkgray.toString(),
    fontSize: csx.px(14),
    marginLeft: csx.px(20),
  },
});

/** See: https://developers.notion.com/reference/block
 */
export function renderBlock(block: BlockWithChildren, context: RenderContext) {
  switch (block.type) {
    case "paragraph":
      return (
        <div className={css.paragraph}>
          {renderRichText(block.paragraph.rich_text, context)}
        </div>
      );
    case "heading_1":
      // TODO: not implemented
      // need to add toggle heading / child support
      return <h1>{renderRichText(block.heading_1.rich_text, context)}</h1>;
    case "heading_2":
      return <h2>{renderRichText(block.heading_2.rich_text, context)}</h2>;
    case "heading_3":
      return <h3>{renderRichText(block.heading_3.rich_text, context)}</h3>;
    case "bulleted_list_item":
      return (
        <ul>
          <li>
            {renderRichText(block.bulleted_list_item.rich_text, context)}
            {(block.children || []).map((child) => renderBlock(child, context))}
          </li>
        </ul>
      );
    case "numbered_list_item":
      return <div>{block.type} not implemented</div>;
    case "quote":
      return (
        <blockquote className={css.quote}>
          {renderRichText(block.quote.rich_text, context)}
          {(block.children || []).map((child) => renderBlock(child, context))}
        </blockquote>
      );
    case "to_do":
    case "toggle":
    case "template":
    case "synced_block":
      return <div>{block.type} not implemented</div>;
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
      return <div>{block.type} not implemented</div>;
    case "equation":
      // TODO: add katex?
      return block.equation.expression;
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
    case "embed":
    case "bookmark":
      return <div>{block.type} not implemented</div>;
    case "image":
      if (block.image.type != "external") {
        console.warn(
          `Found a non-external image url for blockId ${block.id}. This image link will eventually expire.`,
        );
      }
      const url =
        block.image.type == "external"
          ? block.image.external.url
          : block.image.file.url;

      return (
        <div className={css.image}>
          <img src={url} />
          {block.image.caption ? (
            <div className={css.imageCaption}>
              {renderRichText(block.image.caption, context)}
            </div>
          ) : (
            void 0
          )}
        </div>
      );
    case "video":
      if (block.video.type == "external") {
        const url = block.video.external.url;
        return (
          <div className={css.video}>
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
      }

      return <div>{block.type} not implemented</div>;

    case "pdf":
    case "file":
    case "audio":
    case "link_preview":
    case "unsupported":
      return <div>{block.type} not implemented</div>;
    default:
      assertUnreachable(block);
  }
}
