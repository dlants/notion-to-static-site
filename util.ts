import {
  BlockObjectResponse,
  DatabaseObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

export type BlockWithChildren = BlockObjectResponse & {
  children?: BlockWithChildren[];
};

export type PageWithChildren = PageObjectResponse & {
  children: BlockWithChildren[];
};

export type DatabaseWithChildren = DatabaseObjectResponse & {
  children: PageId[];
};

export type BlockId = string;
export type PageId = string;
export type TagId = string;
export type DatabaseId = string;
export type PropertyId = string;

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

export type DatabaseMap = {
  [databaseId: DatabaseId]: DatabaseWithChildren;
};

export type BlockMap = {
  [blockId: BlockId]: BlockWithChildren;
};

export type RenderContext = {
  pages: PageMap;
  blocks: BlockMap;
  dbs: DatabaseMap;
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

export type Breadcrumb =
  | {
      type: "page";
      pageId: PageId;
    }
  | {
      type: "database";
      databaseId: DatabaseId;
    };

export function getBreadcrumbs(
  nodeId: PageId | DatabaseId,
  context: RenderContext,
): Breadcrumb[] {
  const breadcrumbs: Breadcrumb[] = [];

  let currentLoc: Loc | undefined;
  if (context.pages[nodeId]) {
    currentLoc = { type: "pageId", pageId: nodeId };
  } else if (context.dbs[nodeId]) {
    currentLoc = { type: "databaseId", databaseId: nodeId };
  } else {
    throw new Error(
      `Must find breadcrumb for page or db id, but ${nodeId} was neither`,
    );
  }

  while (currentLoc) {
    switch (currentLoc.type) {
      case "pageId":
        const page = context.pages[currentLoc.pageId];
        if (page.id != "index") {
          breadcrumbs.push({ type: "page", pageId: page.id });
        }
        currentLoc = getParentLoc(page.parent);
        break;

      case "databaseId":
        const db = context.dbs[currentLoc.databaseId];
        breadcrumbs.push({ type: "database", databaseId: db.id });
        currentLoc = getParentLoc(db.parent);
        break;

      case "blockId":
        const block = context.blocks[currentLoc.blockId];
        currentLoc = getParentLoc(block.parent);
        break;
    }
  }

  return breadcrumbs.reverse();
}

type Loc =
  | { type: "pageId"; pageId: PageId }
  | { type: "databaseId"; databaseId: DatabaseId }
  | { type: "blockId"; blockId: BlockId };

function getParentLoc(
  parent: PageWithChildren["parent"] | BlockWithChildren["parent"],
): Loc | undefined {
  if (parent.type == "page_id") {
    return { type: "pageId", pageId: parent.page_id };
  } else if (parent.type == "block_id") {
    return { type: "blockId", blockId: parent.block_id };
  } else if (parent.type == "database_id") {
    return { type: "databaseId", databaseId: parent.database_id };
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

export function assertUnreachable(val: never): never {
  throw new Error(`Unexpected value: ${val}`);
}

// *** Typescript magic ***
// see: https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#inferring-within-conditional-types
type SelectProperty<Type, Selector> = Type extends { type: Selector }
  ? Type
  : never;

export type TitlePageProperty = SelectProperty<
  PageObjectResponse["properties"]["key"],
  "title"
>;

export type MultiSelectPageProperty = SelectProperty<
  PageObjectResponse["properties"]["key"],
  "multi_select"
>;

export type MultiSelectDbProperty = SelectProperty<
  DatabaseObjectResponse["properties"]["key"],
  "multi_select"
>;

export type Tags = MultiSelectDbProperty["multi_select"]["options"];

export type DatePageProperty = SelectProperty<
  PageObjectResponse["properties"]["key"],
  "date"
>;

export type FileLocation =
  | {
      type: "page";
      pageId: PageId;
    }
  | {
      type: "db";
      databaseId: DatabaseId;
      tagFilter?: TagId;
      feedType?: "rss" | "atom";
    };

export function getFilePath(loc: FileLocation): string {
  switch (loc.type) {
    case "page":
      return loc.pageId + ".html";
    case "db":
      return `${loc.databaseId}${loc.tagFilter ? `/${loc.tagFilter}` : ""}.${
        loc.feedType ? loc.feedType : "html"
      }`;

    default:
      return assertUnreachable(loc);
  }
}
