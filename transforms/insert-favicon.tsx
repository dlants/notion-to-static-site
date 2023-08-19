import * as cheerio from "cheerio";
import { PageInfo } from "../util";

export function insertFavicon({
  $,
}: {
  $: cheerio.CheerioAPI;
  page: PageInfo;
  sectionPages: PageInfo[];
}) {
  $("head").append(
    $(`<link rel="icon" type="image/x-icon" href="/favicon.png"></link>`),
  );
}
