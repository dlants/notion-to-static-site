import {
  DatabaseMap,
  PageMap,
  PageWithChildren,
  BaseRenderContext,
  generateBlockMap,
  walkChildrenBFS,
} from "./util";
import * as fs from "fs";
import * as path from "path";
import { DatabaseObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export async function loadPages(rootPageId: string): Promise<BaseRenderContext> {
  const pages: PageMap = {};
  const dbs: DatabaseMap = {};

  for await (const ent of await fs.promises.opendir("cache")) {
    const entPath = path.join("cache", ent.name);
    if (ent.isFile() && /\.json$/.test(entPath)) {
      const node: PageWithChildren | DatabaseObjectResponse = JSON.parse(
        fs.readFileSync(entPath).toString(),
      );
      if (node.object == "page") {
        pages[node.id] = node;
      } else {
        dbs[node.id] = {
          ...node,
          children: [],
        };
      }
    } else {
      if (ent.isDirectory() && ent.name == "images") {
        continue;
      }

      throw new Error(`Unexpected file in cache directory ${entPath}`);
    }
  }

  for (const pageId in pages) {
    const page = pages[pageId];
    if (page.parent.type == "database_id") {
      const db = dbs[page.parent.database_id];
      if (!db) {
        throw new Error(
          `Page ${pageId} is child of db ${page.parent.database_id} but that db is not loaded.`,
        );
      }

      db.children.push(page.id);
    }
  }

  const blocks = generateBlockMap({ pages });
  const context = { pages, blocks, dbs };

  remapId({ oldPageId: rootPageId, newPageId: "index", context });

  return context;
}

function remapId({
  oldPageId,
  newPageId,
  context,
}: {
  oldPageId: string;
  newPageId: string;
  context: BaseRenderContext;
}) {
  for (const pageId in context.pages) {
    const page = context.pages[pageId];
    if (page.parent.type == "page_id" && page.parent.page_id == oldPageId) {
      page.parent.page_id = newPageId;
    }

    for (const block of walkChildrenBFS(page)) {
      if (block.type == "child_page" && block.id == oldPageId) {
        block.id = newPageId;
      }
    }
  }

  for (const dbId in context.dbs) {
    const db = context.dbs[dbId];
    if (db.parent.type == "page_id" && db.parent.page_id == oldPageId) {
      db.parent.page_id = newPageId;
    }

    db.children = db.children.map((pageId) =>
      pageId == oldPageId ? newPageId : pageId,
    );
  }

  const page = context.pages[oldPageId];
  page.id = newPageId;
  for (const block of walkChildrenBFS(page)) {
    if (block.parent.type == "page_id" && block.parent.page_id == oldPageId) {
      block.parent.page_id = newPageId;
    }
  }

  context.pages[newPageId] = page;
  delete context.pages[oldPageId];
}
