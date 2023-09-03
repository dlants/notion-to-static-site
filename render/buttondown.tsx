import { renderToString } from "react-dom/server";
import * as React from "react";
import { RenderContext } from "../util";
import { stylesheet, media, extend } from "typestyle";
import * as csstips from "csstips";
import * as csx from "csx";
import { MAX_WIDTH_PX } from "./constants";
import { renderHeader } from "./header";
import { pageTemplate } from "./util";
import fs from "fs";
import path from "path";
import { siteConfig } from "../config";

const css = stylesheet({
  page: {
    ...csstips.vertical,
  },

  contentContainer: {
    ...csstips.flex,
    ...csstips.horizontal,
  },

  contentPadding: {
    ...csstips.flex,
  },

  content: {
    ...csstips.content,
    ...extend(
      media(
        { minWidth: MAX_WIDTH_PX + 21 },
        {
          maxWidth: csx.px(MAX_WIDTH_PX),
        },
      ),
      media(
        { minWidth: 0, maxWidth: MAX_WIDTH_PX + 20 },
        {
          width: "100%",
          paddingLeft: csx.px(10),
          paddingRight: csx.px(10),
        },
      ),
    ),
  },
});

export async function renderButtondown(context: RenderContext) {
  const pageContent = renderToString(
    <div className={css.page}>
      {renderHeader(undefined, context)}
      <div className={css.contentContainer}>
        <div className={css.contentPadding} />

        <div className={css.content}>
          <h1>Sign up for my newsletter</h1>
          <p>Get emails when I write new posts.</p>
          <div
            dangerouslySetInnerHTML={{
              __html: `\
<form
  action="https://buttondown.email/api/emails/embed-subscribe/${siteConfig.buttondownId}"
  method="post"
  target="popupwindow"
  onsubmit="window.open('https://buttondown.email/${siteConfig.buttondownId}', 'popupwindow')"
  class="embeddable-buttondown-form"
>

  <label for="bd-email">Enter your email</label>
  <input type="email" name="email" id="bd-email" />

  <input type="submit" value="Subscribe" />
  <p>
    <a href="https://buttondown.email/refer/${siteConfig.buttondownId}" target="_blank"
      >Powered by Buttondown.</a
    >
  </p>
</form>`,
            }}
          />
        </div>
        <div className={css.contentPadding} />
      </div>
    </div>,
  );

  const html = pageTemplate(pageContent, { title: "newsletter" });

  fs.writeFileSync(path.join("dist", "buttondown.html"), html);
}
