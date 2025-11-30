import * as React from "react";
import {
  renderRichText,
  renderRichTextContents,
  pageLink,
  slugify,
  renderRichTextToPlainText,
} from "./rich-text";
import { BlockWithChildren, RenderContext, assertUnreachable } from "../util";
import { stylesheet, media, extend } from "typestyle";
import { COLORS } from "./constants";
import { URL } from "url";
import * as csx from "csx";
import * as csstips from "csstips";
import { renderDbBlock } from "./database";

const css = stylesheet({
  columnList: {
    ...extend(
      csstips.horizontal,
      media({ minWidth: 0, maxWidth: 600 }, csstips.vertical),
    ),
  },
  column: {
    ...csstips.vertical,
    ...csstips.flex,
    padding: csx.px(15),
  },
  divider: {
    height: csx.em(1),
    ...csstips.horizontal,
    alignItems: "center",
    $nest: {
      div: {
        ...csstips.flex,
        width: "100%",
        height: csx.px(1),
        borderBottom: "1px solid " + COLORS.gray.toRGBA(),
      },
    },
  },
  heading: {
    $nest: {
      a: {
        color: "inherit",
        textDecoration: "none",
        $nest: {
          '&:hover': {
            textDecoration: 'underline'
          }
        }
      }
    }
  },
  video: {
    ...csstips.vertical,
    alignItems: "center",
  },
  embedContainer: {
    ...csstips.content,
    ...csstips.width(csx.percent(100)),
    ...csstips.height(0),
    minHeight: csx.px(100),
    position: "relative",
    paddingBottom: csx.percent(56.25),
    $nest: {
      iframe: {
        ...csstips.content,
        position: "absolute",
      },
    },
  },
  paragraph: {
    paddingTop: csx.px(3),
    paddingBottom: csx.px(3),
    minHeight: csx.em(1),
  },
  code: {
    display: "inline-block",
    whiteSpace: "pre",
    width: "100%",
    overflowX: "scroll",
    "-ms-overflow-style": "none", // hide scrollbar in IE and Edge
    scrollbarWidth: "none", // hide scrollbar in Firefox
    $nest: {
      "$::-webkit-scrollbar": {
        display: "none", // hide scrollbar in Chrome
      },
    },
    ...csstips.padding(csx.px(3)),
    border: "solid thin lightgray",
  },
  childPage: {
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
  quote: {
    borderLeft: csx.border({
      color: COLORS.darkgray.toString(),
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

  caption: {
    ...csstips.content,
    paddingTop: csx.px(6),
    paddingBottom: csx.px(6),
    color: COLORS.darkgray.toString(),
    fontSize: csx.px(14),
    marginLeft: csx.px(20),
  },

  bookmark: {},

  tableOfContents: {
    ...csstips.vertical,
    paddingTop: csx.px(10),
    paddingBottom: csx.px(10),
    $nest: {
      ul: {
        listStyle: "none",
        paddingLeft: 0,
      },
      li: {
        paddingTop: csx.px(4),
        paddingBottom: csx.px(4),
      },
      a: {
        color: COLORS.black.toString(),
        textDecoration: "none",
        $nest: {
          "&:hover": {
            textDecoration: "underline",
          },
        },
      },
    },
  },
});

type Chunk =
  | {
    type: "singleBlock";
    block: BlockWithChildren;
  }
  | {
    type: "numberedList";
    blocks: BlockWithChildren[];
  }
  | {
    type: "bulletList";
    blocks: BlockWithChildren[];
  };

type HeadingInfo = {
  level: 1 | 2 | 3;
  text: string;
  slug: string;
};

function renderTableOfContents(context: RenderContext) {
  const headings: HeadingInfo[] = [];

  for (const block of context.currentPage.children) {
    if (block.type === "heading_1") {
      headings.push({
        level: 1,
        text: renderRichTextToPlainText(block.heading_1.rich_text),
        slug: slugify(block.heading_1.rich_text),
      });
    } else if (block.type === "heading_2") {
      headings.push({
        level: 2,
        text: renderRichTextToPlainText(block.heading_2.rich_text),
        slug: slugify(block.heading_2.rich_text),
      });
    } else if (block.type === "heading_3") {
      headings.push({
        level: 3,
        text: renderRichTextToPlainText(block.heading_3.rich_text),
        slug: slugify(block.heading_3.rich_text),
      });
    }
  }

  if (headings.length === 0) {
    return undefined;
  }

  return (
    <div className={css.tableOfContents}>
      <ul>
        {headings.map((heading, i) => (
          <li key={i} style={{ paddingLeft: `${(heading.level - 1) * 20}px` }}>
            <a href={`#${heading.slug}_0`}>{heading.text}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function renderBlocks(
  blockList: BlockWithChildren[],
  context: RenderContext,
) {
  let currentChunk: Chunk | undefined;
  const remainingBlockList = blockList.slice().reverse();
  const output: (React.JSX.Element | string | undefined)[] = [];

  function renderChunk() {
    if (!currentChunk) {
      return;
    }

    switch (currentChunk.type) {
      case "singleBlock":
        output.push(renderBlock(currentChunk.block, context));
        return;
      case "numberedList":
        output.push(
          <ol>{currentChunk.blocks.map((b) => renderBlock(b, context))}</ol>,
        );
        return;
      case "bulletList":
        output.push(
          <ul>{currentChunk.blocks.map((b) => renderBlock(b, context))}</ul>,
        );
        return;
      default:
        assertUnreachable(currentChunk);
    }
  }

  while (true) {
    const block = remainingBlockList.pop();

    if (!block) {
      renderChunk();
      break;
    }

    switch (block.type) {
      case "numbered_list_item":
        if (currentChunk && currentChunk.type == "numberedList") {
          currentChunk.blocks.push(block);
        } else {
          renderChunk();
          currentChunk = {
            type: "numberedList",
            blocks: [block],
          };
        }
        break;

      case "bulleted_list_item":
        if (currentChunk && currentChunk.type == "bulletList") {
          currentChunk.blocks.push(block);
        } else {
          renderChunk();
          currentChunk = {
            type: "bulletList",
            blocks: [block],
          };
        }
        break;

      default:
        renderChunk();
        currentChunk = {
          type: "singleBlock",
          block,
        };
    }
  }

  return output;
}

/** See: https://developers.notion.com/reference/block
 */
function renderBlock(block: BlockWithChildren, context: RenderContext) {
  switch (block.type) {
    case "paragraph":
      return (
        <div className={css.paragraph}>
          {renderRichText(block.paragraph.rich_text, context)}
        </div>
      );
    case "heading_1":
      if (block.has_children) {
        console.warn(`block type ${block.type} with children not implemented`);
      }
      const slug = slugify(block.heading_1.rich_text);
      return (
        <h1 id={slug} className={css.heading}>
          <a href={"#" + slug}>
            {renderRichText(block.heading_1.rich_text, context)}
          </a>
        </h1>
      );

    case "heading_2":
      if (block.has_children) {
        console.warn(`block type ${block.type} with children not implemented`);
      }
      const slug2 = slugify(block.heading_2.rich_text);
      return (
        <h2 id={slug2} className={css.heading}>
          <a href={"#" + slug2}>
            {renderRichText(block.heading_2.rich_text, context)}
          </a>
        </h2>
      );

    case "heading_3":
      if (block.has_children) {
        console.warn(`block type ${block.type} with children not implemented`);
      }
      const slug3 = slugify(block.heading_3.rich_text);
      return (
        <h3 id={slug3} className={css.heading}>
          <a href={"#" + slug3}>
            {renderRichText(block.heading_3.rich_text, context)}
          </a>
        </h3>
      );

    case "bulleted_list_item":
      return (
        <li>
          {renderRichText(block.bulleted_list_item.rich_text, context)}
          {block.children ? renderBlocks(block.children, context) : undefined}
        </li>
      );
    case "numbered_list_item":
      return (
        <li>
          {renderRichText(block.numbered_list_item.rich_text, context)}
          {block.children ? renderBlocks(block.children, context) : undefined}
        </li>
      );

    case "quote":
      return (
        <blockquote className={css.quote}>
          {renderRichText(block.quote.rich_text, context)}
          {block.children ? renderBlocks(block.children, context) : undefined}
        </blockquote>
      );
    case "to_do":
    case "toggle":
    case "template":
    case "synced_block":
      console.warn(`block type ${block.type} not implemented`);
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
      return renderDbBlock(block.id, {}, context);

    case "equation":
      // TODO: add katex?
      return block.equation.expression;
    case "code":
      return (
        <code className={css.code}>
          {renderRichTextContents(block.code.rich_text, context)}
        </code>
      );
    case "divider":
      return (
        <div className={css.divider}>
          <div />
        </div>
      );
    case "table_of_contents":
      return renderTableOfContents(context);
    case "callout":
    case "breadcrumb":
    case "link_to_page":
    case "table":
    case "table_row":
    case "embed":
      return <div>{block.type} not implemented</div>;
    case "column":
      return (
        <div className={css.column}>
          {block.children ? renderBlocks(block.children, context) : undefined}
        </div>
      );

    case "column_list":
      return (
        <div className={css.columnList}>
          {block.children ? renderBlocks(block.children, context) : undefined}
        </div>
      );
    case "bookmark":
      return (
        <div className={css.bookmark}>
          <a href={block.bookmark.url}>{block.bookmark.url}</a>
          {block.bookmark.caption ? (
            <div className={css.caption}>
              {renderRichText(block.bookmark.caption, context)}
            </div>
          ) : (
            void 0
          )}
        </div>
      );
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
            <div className={css.caption}>
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
        const parsedUrl = new URL(url);
        let ytVideoId: string | undefined = undefined;

        if (
          url.startsWith("https://youtu.be") ||
          parsedUrl.pathname.startsWith("/shorts")
        ) {
          ytVideoId = parsedUrl.pathname.slice(
            parsedUrl.pathname.lastIndexOf("/") + 1,
          );
        } else if (parsedUrl.searchParams.get("v")) {
          ytVideoId = parsedUrl.searchParams.get("v") || undefined;
        }

        return (
          <div className={css.video}>
            {ytVideoId ? (
              <div className={css.embedContainer}>
                <iframe
                  width="100%"
                  height="100%"
                  src={"https://www.youtube.com/embed/" + ytVideoId}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen={true}
                  frameBorder="0"
                ></iframe>
              </div>
            ) : (
              <a href={url}>{url}</a>
            )}
            {block.video.caption ? (
              <div className={css.caption}>
                {renderRichText(block.video.caption, context)}
              </div>
            ) : (
              void 0
            )}
          </div>
        );
      }

      console.warn(`block type ${block.type} not implemented`);
      return <div>{block.type} not implemented</div>;

    case "pdf":
    case "file":
    case "audio":
    case "link_preview":
    case "unsupported":
      console.warn(`block type ${block.type} not implemented`);
      return <div>{block.type} not implemented</div>;
    default:
      assertUnreachable(block);
  }
}
