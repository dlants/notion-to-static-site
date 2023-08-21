import * as React from "react";
import { stylesheet } from "typestyle";
import { PageWithChildren } from "../fetch-page";
import { renderRichText } from "./rich-text";
import { RenderContext } from "../util";

const css = stylesheet({
  pageLink: {},
});

export function pageLink(page: PageWithChildren, context: RenderContext) {
  return (
    <a className={css.pageLink} href={page.id + ".html"}>
      {page.properties["title"]
        ? renderRichText((page.properties["title"] as any).title, context)
        : ""}
    </a>
  );
}
