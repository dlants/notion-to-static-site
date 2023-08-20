import { NotionRenderer, createBlockRenderer } from "@notion-render/client";
import { PageWithChildren } from "./fetch-page";
import { PageId } from "./util";
import fs from "fs";
import path from "path";
import { ChildPageBlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { renderToString } from "react-dom/server";
import * as React from "react";
import { stylesheet, getStyles, classes } from "typestyle";
import * as csstips from "csstips";

const css = stylesheet({
});

export async function renderPage({
  page,
  pages,
}: {
  page: PageWithChildren;
  pages: { [pageId: PageId]: PageWithChildren };
}) {
  const childPageRenderer = createBlockRenderer<ChildPageBlockObjectResponse>(
    "child_page",
    async (data, renderer) => {
      const childPage = pages[data.id];
      const title = await renderer.render(
        ...(childPage.properties["title"] as any).title,
      );
      return renderToString(
        <div className="child_page">
          <a
            href={data.id + ".html"}
            dangerouslySetInnerHTML={{
              __html: title,
            }}
          />
        </div>,
      );
    },
  );

  const renderer = new NotionRenderer({
    renderers: [childPageRenderer],
  });
  const pageContent = await renderer.render(...page.children);


  const html = `\
<!DOCTYPE html>
<html>
<head>
  <style>${getStyles()}</style>
  <link rel="icon" type="image/x-icon" href="/favicon.png"></link>
</head>
<body>
${pageContent}
</body>
</html>`;

  fs.writeFileSync(path.join("dist", page.id + ".html"), html);
}
