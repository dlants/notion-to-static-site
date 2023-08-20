import { PageId, PageMap, walkChildrenBFS } from "./util";
import * as fs from "fs";
import * as path from "path";
import { PageWithChildren } from "./fetch-page";

export async function loadPages(rootPageId: string) {
  const pages: { [pageId: PageId]: PageWithChildren } = {};

  for await (const ent of await fs.promises.opendir("cache")) {
    const entPath = path.join("cache", ent.name);
    if (ent.isFile() && /\.json$/.test(entPath)) {
      const page: PageWithChildren = JSON.parse(
        fs.readFileSync(entPath).toString(),
      );
      pages[page.id] = page;
    } else {
      if (ent.isDirectory() && ent.name == "images") {
        continue;
      }

      throw new Error(`Unexpected file in cache directory ${entPath}`);
    }
  }

  remapId({ oldPageId: rootPageId, newPageId: "index", pages });

  return { pages };
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
