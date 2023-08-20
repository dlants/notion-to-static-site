import { Client, isFullBlock, iteratePaginatedAPI } from "@notionhq/client";
import {
  BlockObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import fs from "fs";
import path from "path";
import { $ } from "zx";
import * as stream from "stream";
import { promisify } from "util";
import axios from "axios";
import url from "url";
const finished = promisify(stream.finished);

export type BlockWithChildren = BlockObjectResponse & {
  children?: BlockWithChildren[];
};

export type PageWithChildren = PageObjectResponse & {
  children: BlockWithChildren[];
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
      path.join("cache", page.id + ".json"),
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

      if (block.type == "image") {
        const imgUrl =
          block.image.type == "external"
            ? block.image.external.url
            : block.image.file.url;

        const fileName = await downloadFile(imgUrl);

        block.image = {
          type: "external",
          external: {
            url: path.basename(fileName),
          },
          caption: block.image.caption,
        };
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

export async function downloadFile(fileUrl: string): Promise<any> {
  const parsed = new url.URL(fileUrl, "https://www.bogus.com");
  const fileName = path.join("cache", "images", path.basename(parsed.pathname!));

  const writer = fs.createWriteStream(fileName);
  return axios({
    method: "get",
    url: fileUrl,
    responseType: "stream",
  }).then(async (response) => {
    response.data.pipe(writer);
    await finished(writer);
    return fileName;
  });
}
