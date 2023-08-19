import { Client, isFullBlock, iteratePaginatedAPI } from "@notionhq/client";
import {
  BlockObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import fs from "fs";
import path from "path";
import { $ } from "zx";

export type BlockWithChildren = BlockObjectResponse & {
  children?: BlockWithChildren[];
};

export type PageWithChildren = PageObjectResponse & {
  children?: BlockWithChildren[];
};

export class NotionClientWrapper {
  private notionClient: Client;
  private pagesToVisit: string[] = [];
  private visitedPages: Set<string> = new Set();

  constructor(notionApiToken: string) {
    this.notionClient = new Client({
      auth: notionApiToken,
    });
  }

  async fetchPageAndChildren({ pageId }: { pageId: string }) {
    await $`rm -rf cache`;
    await $`mkdir -p cache`;
    this.pagesToVisit = [pageId];
    this.visitedPages = new Set();

    while (true) {
      const nextPageId = this.pagesToVisit.pop();
      if (!nextPageId) {
        break;
      }

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
      path.join("cache", pageId + ".json"),
      JSON.stringify({ ...page, children }, null, 2),
    );
  }

  async getBlockChildren(blockId: string): Promise<BlockWithChildren[]> {
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

      if (block.type == "child_page") {
        this.pagesToVisit.push(block.id);
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
}
