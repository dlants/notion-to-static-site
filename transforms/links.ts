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
    if (urlMap[href]) {
      $(a).attr("href", urlMap[href]);
    }
  });

  $("img").each((_, i) => {
    const src = relativeToAbsoluteUrl({
      relativeUrl: i.attribs.src,
      pageDir: page.dir,
    });
    if (urlMap[src]) {
      $(i).attr("src", urlMap[src]);
    }
  });
}
