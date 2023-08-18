import * as cheerio from "cheerio";
import * as React from "react";
import { renderToString } from "react-dom/server";
import { PageInfo } from "../util";

export function youtubeEmbed({
  $,
}: {
  $: cheerio.CheerioAPI;
  page: PageInfo;
  sectionPages: PageInfo[];
}) {
  $("a").map(async (_, a) => {
    const href = a.attribs.href;
    if (href.startsWith("https://youtu.be")) {
      $(a).replaceWith(
        renderToString(
          <iframe
            width="560"
            height="315"
            src={
              "https://www.youtube.com/embed" +
              href.slice(href.lastIndexOf("/"))
            }
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen={true}
            frameBorder="0"
          ></iframe>,
        ),
      );
    }
  });
}
