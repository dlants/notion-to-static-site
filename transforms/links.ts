import { CheerioAPI } from "cheerio";
import { PageInfo, UrlMap, relativeToAbsoluteUrl } from "../util";

export function transformLinks({
  page,
  urlMap,
  $,
}: {
  page: PageInfo;
  $: CheerioAPI;
  urlMap: UrlMap;
}) {
  $("a").each((_, a) => {
    const href = relativeToAbsoluteUrl({
      relativeUrl: a.attribs.href,
      pageDir: page.dir,
    });
    debugger;
    if (urlMap[href]) {
      $(a).attr("href", urlMap[href]);
      console.log(`remapped ${href} to ${urlMap[href]}`);
    }
  });
}
