import * as cheerio from "cheerio";
import * as React from "react";
import { renderToString } from "react-dom/server";
import { PageInfo } from "../util";
import { stylesheet, getStyles, classes } from "typestyle";
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
    navHeader: {
      ...csstips.pageTop,
      ...csstips.horizontal,
      ...csstips.horizontallySpaced(10),
    },
    headerItem: {
      ...csstips.content,
    },
    divider: {
      ...csstips.flex,
    },
    subscribe: {},
  });

  $("head").append($(`<style>${getStyles()}</style>`));

  $("header").prepend(
    renderToString(
      <div className={css.navHeader}>
        {page.breadcrumbs.map((breadcrumb, idx) => (
          <div className={css.headerItem}>
            {idx == 0 ? "" : ">"}
            <a href={breadcrumb.url}>{breadcrumb.title}</a>
          </div>
        ))}
        <div className={css.headerItem}>
          {"> "}
          <a href={page.pageUrl}>{page.title}</a>
        </div>
        <div className={css.divider} />
        {sectionPages.map((page) => (
          <div className={css.headerItem}>
            <a href={page.pageUrl}>{page.title}</a>
          </div>
        ))}
        <div className={classes(css.headerItem, css.subscribe)}>
          <a href="https://buttondown.email/dlants">get emails</a>
        </div>
      </div>,
    ),
  );
}
