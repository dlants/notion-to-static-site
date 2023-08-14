import * as cheerio from "cheerio";
import * as React from "react";
import { renderToString } from "react-dom/server";
import { PageInfo } from "../util";

export function transformHeader(
  $: cheerio.CheerioAPI,
  sectionPages: PageInfo[],
) {
  $("header").prepend(
    renderToString(
      <div className="nav-header">
        {sectionPages.map((page) => (
          <div className="section-link">
            <a href={page.newPath}>{page.title}</a>
          </div>
        ))}
        <div className="">
          <a href="https://buttondown.email/dlants">email signup</a>
        </div>
      </div>,
    ),
  );
}
