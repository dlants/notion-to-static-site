/** Put everything site-specific into this configuration file
 */
export type SiteConfig = {
  /** The id of the page that should become the "index.html" file.
   */
  rootPageId: string;

  /** This string will appear in the header next to the favicon, and in the breadcrumbs.
   */
  homeName: string;

  /** Location of the favicon file. Should be an svg file in the static directory.
   */
  faviconPath: string;

  /** List of pageIds for the header nav bar.
   */
  headerPageIds: string[];

  /** For every db, use the property with this name to sort.
   *
   * Note, currently only supports columns of the "date" type.
   */
  defaultDbSort: {
    propertyName: string;
    direction: "ascending" | "descending";
  };
};

export const siteConfig: SiteConfig = {
  rootPageId: "ef63da75f05145d49829963c2d1f929f",
  headerPageIds: ["b193d2d6f9e94a2bb63e33ef69b18464"],
  homeName: "dlants.me",
  faviconPath: "static/black-rectangle.svg",
  defaultDbSort: {
    propertyName: "Publish Date",
    direction: "descending",
  },
};
