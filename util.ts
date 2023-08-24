import { BlockWithChildren, PageWithChildren } from "./fetch-page";

export type BlockId = string;
export type PageId = string;

/** BFS traversal of all the blocks in the page, without re-visiting the same block **/
export function* walkChildrenBFS(page: PageWithChildren) {
  const visitedBlocks: Set<BlockId> = new Set();
  visitedBlocks.add(page.id);

  const blocksToVisit: BlockWithChildren[] = page.children.slice() || [];

  while (true) {
    const block = blocksToVisit.pop();
    if (!block) {
      return;
    }
    if (visitedBlocks.has(block.id)) {
      continue;
    }
    visitedBlocks.add(block.id);

    if (block.children) {
      blocksToVisit.push(...block.children);
    }

    yield block;
  }
}

export function relativeToAbsoluteUrl({
  relativeUrl,
  pageDir,
}: {
  relativeUrl: string;
  pageDir: string;
}) {
  if (pageDir == "static/export") {
    return relativeUrl;
  }
  return encodeURI(pageDir.slice("static/export/".length)) + "/" + relativeUrl;
}

export function ensureEnvironmentVariable(varname: string) {
  if (process.env[varname] == undefined) {
    throw new Error(`Must define env variable ${varname}`);
  }

  return process.env[varname]!;
}

export type PageMap = {
  [pageId: PageId]: PageWithChildren;
};

export type BlockMap = {
  [blockId: BlockId]: BlockWithChildren;
};

export type RenderContext = {
  pages: PageMap;
  blocks: BlockMap;
};

export type AssetInfo = {
  originalUrl: string;
  url: string;
  basename: string;
};

export type UrlMap = {
  [originalUrl: string]: string;
};

// remap page Id from xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx to
// xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
export function normalizePageId(pageId: string) {
  if (pageId.length == 32) {
    return (
      pageId.slice(0, 8) +
      "-" +
      pageId.slice(8, 12) +
      "-" +
      pageId.slice(12, 16) +
      "-" +
      pageId.slice(16, 20) +
      "-" +
      pageId.slice(20)
    );
  } else {
    return pageId;
  }
}

export function generateBlockMap({ pages }: { pages: PageMap }): BlockMap {
  const blockMap: BlockMap = {};
  for (const pageId in pages) {
    for (const block of walkChildrenBFS(pages[pageId])) {
      blockMap[block.id] = block;
    }
  }

  return blockMap;
}

export function getBreadcrumbs({
  pageId,
  pages,
  blocks,
}: {
  pageId: PageId;
  pages: PageMap;
  blocks: BlockMap;
}) {
  const breadcrumbs: PageId[] = [];

  let currentLoc: Loc | undefined = { type: "pageId", pageId };

  while (currentLoc) {
    switch (currentLoc.type) {
      case "pageId":
        const page = pages[currentLoc.pageId];
        if (page.id != "index") {
          breadcrumbs.push(page.id);
        }
        currentLoc = getParentLoc(page.parent);
        break;

      case "blockId":
        const block = blocks[currentLoc.blockId];
        currentLoc = getParentLoc(block.parent);
        break;
    }
  }

  return breadcrumbs.reverse();
}

type Loc =
  | { type: "pageId"; pageId: PageId }
  | { type: "blockId"; blockId: BlockId };

function getParentLoc(
  parent: PageWithChildren["parent"] | BlockWithChildren["parent"],
): Loc | undefined {
  if (parent.type == "page_id") {
    return { type: "pageId", pageId: parent.page_id };
  } else if (parent.type == "block_id") {
    return { type: "blockId", blockId: parent.block_id };
  } else {
    return undefined;
  }
}

export function getSectionPages({ pages }: { pages: PageMap }): PageId[] {
  const sections = [];
  const indexPage = pages["index"];
  for (const block of walkChildrenBFS(indexPage)) {
    if (block.type == "child_page") {
      sections.push(block.id);
    }
  }
  return sections.reverse();
}

export function assertUnreachable(val: never) {
  throw new Error(`Unexpected value: ${val}`);
}
