import { TagSiteConfigId, normalizePageId } from "./util";

/** Put everything site-specific into this configuration file
 */
export type SiteConfig = {
  /** The id of the page that should become the "index.html" file.
   */
  rootPageId: string;

  /** the feed for this db should become the '/rss' path.
   */
  rootDatabaseId: string;

  /** These tags will get separate filtered post pages, feeds and tagged newsletters. The TagName will also be used
   * to create a human-readable url.
   *
   * Since the TagNames are going to be persisted (in bookmarks, rss readers and url histories / bookmarks), do not
   * change this lightly!
   */
  tagMap: {
    [tagId: string]: TagSiteConfigId;
  };

  /** This string will appear in the header next to the favicon, and in the breadcrumbs.
   */
  homeName: string;

  /** Location of the favicon file. Should be an svg file in the static directory.
   */
  faviconPath: string;

  /** List of pageIds for the header nav bar.
   */
  headerPageIds: string[];

  /** Your buttondown id.
   */
  buttondownId?: string;

  /** Each table should have a property with this name, that contains the date this page was published.
   */
  publishDatePropertyName: string;

  /** For verifying your mastodon identity.
   */
  mastodonHref: string;

  /** for a goatCounter analytics
   */
  goatCounter?: {
    scriptData: string;
    scriptSrc: string;
  };
};

export const siteConfig: SiteConfig = {
  rootPageId: normalizePageId("ef63da75f05145d49829963c2d1f929f"),
  rootDatabaseId: normalizePageId("f5032b5fd3894522bd351a0826faa56f"),
  tagMap: {
    [normalizePageId("68bbc05889b344d483fe94678908f548")]: "education" as TagSiteConfigId,
    [normalizePageId("6539b1d14c39458fa93a95a7786b11a3")]: "tech" as TagSiteConfigId,
    [normalizePageId("624670f6243a46d987b73ee2fd6d7777")]: "fun" as TagSiteConfigId,
    [normalizePageId("283a809d84234861a5578f5cb4d89b80")]: "training" as TagSiteConfigId,
    [normalizePageId("198d8d7b1d48414e976b9aa162bdeb34")]: "climbing" as TagSiteConfigId,
  },
  headerPageIds: [normalizePageId("b193d2d6f9e94a2bb63e33ef69b18464")],
  homeName: "dlants.me",
  buttondownId: "dlants",
  mastodonHref: "https://mastodon.dlants.me/@dlants",
  faviconPath: "static/black-rectangle.svg",
  publishDatePropertyName: "Publish Date",
  goatCounter: {
    scriptData: "https://goatcounter-e1un.onrender.com/count",
    scriptSrc: "//goatcounter-e1un.onrender.com/count.js",
  },
};
