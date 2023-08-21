import { Client, isFullBlock, iteratePaginatedAPI } from "@notionhq/client";
import {
  BlockObjectResponse,
  PageObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";
import fs from "fs";
import path from "path";
import * as stream from "stream";
import { promisify } from "util";
import axios from "axios";
import url from "url";
import { PageId } from "./util";
const finished = promisify(stream.finished);

export type BlockWithChildren = BlockObjectResponse & {
  children?: BlockWithChildren[];
};

export type PageWithChildren = PageObjectResponse & {
  children: BlockWithChildren[];
};

export class NotionClientWrapper {
  private notionClient: Client;
  private pagesToVisit: Set<PageId> = new Set();
  private visitedPages: Set<PageId> = new Set();

  constructor(notionApiToken: string) {
    this.notionClient = new Client({
      auth: notionApiToken,
    });
  }

  async fetchPageAndChildren({ pageId }: { pageId: string }) {
    this.pagesToVisit = new Set();
    this.pagesToVisit.add(pageId);
    this.visitedPages = new Set();

    while (true) {
      const [nextPageId] = this.pagesToVisit;
      if (!nextPageId) {
        break;
      }
      this.pagesToVisit.delete(nextPageId)

      await this.visitPage(nextPageId);
    }
  }

  async visitPage(pageId: string) {
    if (this.visitedPages.has(pageId)) {
      return;
    }
    this.visitedPages.add(pageId);

    console.log(`fetching page ${pageId}`);
    const page = await this.notionClient.pages.retrieve({
      page_id: pageId,
    });

    const children = await this.getBlockChildren(pageId);

    fs.writeFileSync(
      path.join("cache", page.id + ".json"),
      JSON.stringify({ ...page, children }, null, 2),
    );
  }

  private async getBlockChildren(blockId: string): Promise<BlockWithChildren[]> {
    const result: BlockWithChildren[] = [];
    for await (const block of iteratePaginatedAPI(
      this.notionClient.blocks.children.list,
      {
        block_id: blockId,
      },
    )) {
      if (!isFullBlock(block)) {
        throw new Error("Expected full block response but got partial.");
      }

      if (block.type == "image") {
        const imgUrl =
          block.image.type == "external"
            ? block.image.external.url
            : block.image.file.url;

        const imageUrl = await downloadFile(imgUrl);

        block.image = {
          type: "external",
          external: {
            url: encodeURIComponent(imageUrl),
          },
          caption: block.image.caption,
        };
      }

      // TODO: do any block types contain rich_text in other places?
      if ((block as any)[block.type].rich_text) {
        this.findPageMentions((block as any)[block.type].rich_text);
      }

      if (block.type == "child_page") {
        this.pagesToVisit.add(block.id);
        result.push(block);
      } else if (block.has_children) {
        const children = await this.getBlockChildren(block.id);
        result.push({
          ...block,
          children,
        });
      } else {
        result.push(block);
      }
    }

    return result;
  }

  private findPageMentions(richText: RichTextItemResponse[]) {
    for (const element of richText) {
      if (element.type == 'mention' && element.mention.type == 'page') {
        this.pagesToVisit.add(element.mention.page.id)
      }
    }
  }


}

export async function downloadFile(fileUrl: string): Promise<any> {
  const parsed = new url.URL(fileUrl, "https://www.bogus.com");
  const imageUrl = path.join("images", path.basename(parsed.pathname!));

  const writer = fs.createWriteStream(path.join("cache", imageUrl));
  return axios({
    method: "get",
    url: fileUrl,
    responseType: "stream",
  }).then(async (response) => {
    response.data.pipe(writer);
    await finished(writer);
    return imageUrl;
  });
}
