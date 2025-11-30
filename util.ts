import {
  BlockObjectResponse,
  DatabaseObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import _ from "lodash";
import { siteConfig } from "./config";
import { renderRichTextToPlainText } from "./render/rich-text";

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
export type ShortUrl = string;
export type TagId = string;

/** One of the human-readable tag ids defined in the site config.
 */
export type TagSiteConfigId = string & { __siteConfigTagName: true };
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

export type BaseRenderContext = {
  pages: PageMap;
  blocks: BlockMap;
  dbs: DatabaseMap;
};

export type RenderContext = BaseRenderContext & {
  currentPage: PageWithChildren;
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
  context: BaseRenderContext,
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
export type Tag = Tags[number];

export type DatePageProperty = SelectProperty<
  PageObjectResponse["properties"]["key"],
  "date"
>;

export type FileLocation =
  | {
    type: "page";
    shortUrl: ShortUrl;
  }
  | {
    type: "db";
    databaseId: DatabaseId;
  }
  | {
    type: "tag";
    tag: TagSiteConfigId;
  }
  | {
    type: "feed";
    feedType: "rss" | "atom";
    tag?: TagSiteConfigId;
  }
  | {
    type: "newsletter";
    tag?: TagSiteConfigId;
  };

export function getPageTitleProperty(
  page: PageWithChildren,
): TitlePageProperty | undefined {
  const title = _.find(
    _.values(page.properties),
    (p): p is TitlePageProperty => p.type == "title",
  );

  if (title) {
    return title;
  }

  return page.properties["title"] as TitlePageProperty;
}

export function getPagePublishDateProperty(
  page: PageWithChildren,
): DatePageProperty | undefined {
  const publishDateProperty = page.properties[siteConfig.publishDatePropertyName];

  if (publishDateProperty && publishDateProperty.type == "date") {
    return publishDateProperty;
  }

  return undefined;
}


export function getFilePath(loc: FileLocation): string {
  switch (loc.type) {
    case "page":
      return loc.shortUrl + ".html";

    case "db":
      return loc.databaseId + ".html";

    case "feed":
      if (loc.tag) {
        return loc.tag + "/" + loc.feedType;
      } else {
        return loc.feedType;
      }

    case "tag":
      return loc.tag + ".html";

    case "newsletter":
      if (loc.tag) {
        return loc.tag + "/buttondown.html";
      } else {
        return "buttondown.html";
      }

    default:
      return assertUnreachable(loc);
  }
}

export function getPageShortUrl(page: PageWithChildren) {
  if (page.id == "index") {
    return page.id;
  }

  const shortUrlProperty = page.properties[siteConfig.shortUrlPropertyName];

  if (shortUrlProperty && shortUrlProperty.type == "rich_text") {
    return renderRichTextToPlainText(shortUrlProperty.rich_text);
  }

  const title = getPageTitle(page);
  if (title) {
    return title.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 10);
  }

  return page.id.toLowerCase().substring(0, 5);
}

export function getPageTitle(page: PageWithChildren) {
  const titleProperty = _.find(
    _.values(page.properties),
    (p): p is TitlePageProperty => p.type == "title",
  );
  if (titleProperty && titleProperty.type == "title") {
    return renderRichTextToPlainText(titleProperty.title);
  }
}

export function getPublishDatePropertyId({
  databaseId,
  context,
}: {
  databaseId: DatabaseId;
  context: BaseRenderContext;
}) {
  const db = context.dbs[databaseId];
  const propertyName = siteConfig.publishDatePropertyName;
  const propertyId = db.properties[propertyName].id;
  if (!propertyId) {
    throw new Error(`Expedted db to have property ${propertyName}`);
  }
  return propertyId;
}
