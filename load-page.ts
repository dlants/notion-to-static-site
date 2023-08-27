import {
  DatabaseMap,
  PageMap,
  PageWithChildren,
  RenderContext,
  generateBlockMap,
  walkChildrenBFS,
} from "./util";
import * as fs from "fs";
import * as path from "path";
import { DatabaseObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export async function loadPages(rootPageId: string): Promise<RenderContext> {
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
          children: []
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
    if (page.parent.type == 'database_id') {
      const db = dbs[page.parent.database_id];
      if (!db) {
        throw new Error(`Page ${pageId} is child of db ${page.parent.database_id} but that db is not loaded.`)
      }

      db.children.push(page.id);
    }
  }

  remapId({ oldPageId: rootPageId, newPageId: "index", pages });

  const blocks = generateBlockMap({ pages });

  return { pages, blocks, dbs };
}

function remapId({
  oldPageId,
  newPageId,
  pages,
}: {
  oldPageId: string;
  newPageId: string;
  pages: PageMap;
}) {
  for (const pageId in pages) {
    const page = pages[pageId];
    if (page.parent.type == "page_id" && page.parent.page_id == oldPageId) {
      page.parent.page_id = newPageId;
    }

    for (const block of walkChildrenBFS(page)) {
      if (block.type == "child_page" && block.id == oldPageId) {
        block.id = newPageId;
      }
    }
  }

  const page = pages[oldPageId];
  page.id = newPageId;
  for (const block of walkChildrenBFS(page)) {
    if (block.parent.type == "page_id" && block.parent.page_id == oldPageId) {
      block.parent.page_id = newPageId;
    }
  }

  pages[newPageId] = page;
  delete pages[oldPageId];
}
