import { Client, isFullBlock, iteratePaginatedAPI } from "@notionhq/client";
import {
  GetDatabaseResponse,
  GetPageResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";
import fs from "fs";
import path from "path";
import * as stream from "stream";
import { promisify } from "util";
import axios from "axios";
import url from "url";
import {
  BlockId,
  DatabaseId,
  BlockWithChildren,
  PageId,
  assertUnreachable,
} from "./util";
const finished = promisify(stream.finished);

type NodeToVisit =
  | { type: "page"; pageId: PageId }
  | { type: "database"; databaseId: DatabaseId };

export class NotionClientWrapper {
  private notionClient: Client;
  private nodesToVisit: NodeToVisit[] = [];

  private visitedNodes: Set<PageId | DatabaseId> = new Set();

  constructor(notionApiToken: string) {
    this.notionClient = new Client({
      auth: notionApiToken,
    });
  }

  async fetchPageAndChildren({ pageId }: { pageId: PageId }) {
    this.nodesToVisit = [];
    this.nodesToVisit.push({ type: "page", pageId });
    this.visitedNodes = new Set();

    while (true) {
      const nextNode = this.nodesToVisit.pop();
      if (!nextNode) {
        break;
      }

      await this.visitNode(nextNode);
    }
  }

  async visitNode(nodeToVisit: NodeToVisit) {
    const nodeId =
      nodeToVisit.type == "page" ? nodeToVisit.pageId : nodeToVisit.databaseId;
    if (this.visitedNodes.has(nodeId)) {
      return;
    }

    switch (nodeToVisit.type) {
      case "page": {
        const pageId = nodeToVisit.pageId;
        console.log(`fetching page ${pageId}`);
        const page = await this.notionClient.pages.retrieve({
          page_id: nodeToVisit.pageId,
        });
        await this.processPage(page);

        break;
      }

      case "database": {
        const databaseId = nodeToVisit.databaseId;
        console.log(`fetching db ${databaseId}`);
        const db = await this.notionClient.databases.retrieve({
          database_id: databaseId,
        });
        await this.processDatabase(db);
        break;
      }
    }
  }

  private async processPage(page: GetPageResponse) {
    if (this.visitedNodes.has(page.id)) {
      return;
    }
    const children = await this.getChildrenForBlock(page.id);

    fs.writeFileSync(
      path.join("cache", page.id + ".json"),
      JSON.stringify({ ...page, children }, null, 2),
    );
    console.log(`wrote page ${page.id}`);
    this.visitedNodes.add(page.id);
  }

  private async processDatabase(db: GetDatabaseResponse) {
    if (this.visitedNodes.has(db.id)) {
      return;
    }

    await this.visitChildrenForDatabase(db.id);

    fs.writeFileSync(
      path.join("cache", db.id + ".json"),
      JSON.stringify(db, null, 2),
    );
    console.log(`wrote db ${db.id}`);
    this.visitedNodes.add(db.id);
  }

  private async getChildrenForBlock(
    blockId: PageId | BlockId,
  ): Promise<BlockWithChildren[]> {
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
        this.nodesToVisit.push({ type: "page", pageId: block.id });
        result.push(block);
      } else if (block.type == "child_database") {
        this.nodesToVisit.push({ type: "database", databaseId: block.id });
        result.push(block);
      } else if (block.has_children) {
        const children = await this.getChildrenForBlock(block.id);
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

  private async visitChildrenForDatabase(
    databaseId: DatabaseId,
  ): Promise<void> {
    for await (const pageOrDatabase of iteratePaginatedAPI(
      this.notionClient.databases.query,
      {
        database_id: databaseId,
      },
    )) {
      switch (pageOrDatabase.object) {
        case "page":
          this.processPage(pageOrDatabase);
          break;
        case "database":
          this.processDatabase(pageOrDatabase);
          break;
        default:
          assertUnreachable(pageOrDatabase);
      }
    }
  }

  private findPageMentions(richText: RichTextItemResponse[]) {
    for (const element of richText) {
      if (element.type == "mention" && element.mention.type == "page") {
        this.nodesToVisit.push({
          type: "page",
          pageId: element.mention.page.id,
        });
      }

      if (element.type == "mention" && element.mention.type == "database") {
        this.nodesToVisit.push({
          type: "database",
          databaseId: element.mention.database.id,
        });
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
