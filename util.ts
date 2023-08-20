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

export type Breadcrumb = {
  title: string;
  url: string;
};

export type PageMap = {
  [pageId: PageId]: PageWithChildren;
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

// export function generateUrlMap({
//   pages,
//   assets,
// }: {
//   pages: PageInfo[];
//   assets: AssetInfo[];
// }) {
//   const urlMap: UrlMap = {};
//   for (const page of pages) {
//     urlMap[encodeURI(page.originalPath.replace(/^static\/export\//, ""))] =
//       encodeURIComponent(page.pageUrl);
//   }
//
//   for (const asset of assets) {
//     urlMap[encodeURI(asset.originalUrl.replace(/^static\/export\//, ""))] =
//       encodeURIComponent(asset.url);
//   }
//
//   return urlMap;
// }
