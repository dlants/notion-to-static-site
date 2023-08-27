/** Put everything site-specific into this configuration file
 */
export type SiteConfig = {
  defaultDbSort: {
    propertyName: string;
    direction: 'ascending' | 'descending'
  }
}

export const siteConfig: SiteConfig = {
  defaultDbSort: {
    propertyName: 'Publish Date',
    direction: 'descending'
  }
}
