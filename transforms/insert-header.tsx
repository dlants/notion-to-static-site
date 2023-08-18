import * as cheerio from "cheerio";
import * as React from "react";
import { renderToString } from "react-dom/server";
import { PageInfo } from "../util";

export function insertHeader({
  $,
  page,
  sectionPages,
}: {
  $: cheerio.CheerioAPI;
  page: PageInfo;
  sectionPages: PageInfo[];
}) {
  $("header").prepend(
    renderToString(
      <div className="nav-header">
        <div className="breadcrumbs">
          {page.breadcrumbs.map((breadcrumb, idx) => (
            <div className="breadcrumb">
              {idx == 0 ? "" : " > "}
              <a href={breadcrumb.url}>{breadcrumb.title}</a>
            </div>
          ))}
          <div className="breadcrumb">
            {" > "}
            <a href={page.newPath}>{page.title}</a>
          </div>
        </div>

        <div className="sections">
          {sectionPages.map((page) => (
            <div className="section-link">
              <a href={page.newPath}>{page.title}</a>
            </div>
          ))}
          <div className="">
            <a href="https://buttondown.email/dlants">email signup</a>
          </div>
        </div>
      </div>,
    ),
  );
}
