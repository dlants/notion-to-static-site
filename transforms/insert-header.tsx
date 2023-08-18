import * as cheerio from "cheerio";
import * as React from "react";
import { renderToString } from "react-dom/server";
import { PageInfo } from "../util";
import { stylesheet, getStyles } from "typestyle";
import * as csstips from "csstips";

export function insertHeader({
  $,
  page,
  sectionPages,
}: {
  $: cheerio.CheerioAPI;
  page: PageInfo;
  sectionPages: PageInfo[];
}) {
  const css = stylesheet({
    breadcrumbContainer: {
      ...csstips.flexRoot,
    },
    sectionsContainer: {
      ...csstips.flexRoot,
    },
    breadcrumb: {
      ...csstips.content,
    },
    section: {
      ...csstips.content,
    },
    subscribe: {
      ...csstips.content,
    },
  });

  $("head").append($(`<style>${getStyles()}</style>`));

  $("header").prepend(
    renderToString(
      <div className="nav-header">
        <div className={css.breadcrumbContainer}>
          {page.breadcrumbs.map((breadcrumb, idx) => (
            <div className={css.breadcrumb}>
              {idx == 0 ? "" : " > "}
              <a href={breadcrumb.url}>{breadcrumb.title}</a>
            </div>
          ))}
          <div className={css.breadcrumb}>
            {" > "}
            <a href={page.pageUrl}>{page.title}</a>
          </div>
        </div>

        <div className={css.sectionsContainer}>
          {sectionPages.map((page) => (
            <div className={css.section}>
              <a href={page.pageUrl}>{page.title}</a>
            </div>
          ))}
          <div className={css.subscribe}>
            <a href="https://buttondown.email/dlants">get emails</a>
          </div>
        </div>
      </div>,
    ),
  );
}
