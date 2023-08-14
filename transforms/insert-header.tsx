import * as cheerio from "cheerio";
import * as React from "react";
import { renderToString } from "react-dom/server";

export async function insertHeader($: cheerio.CheerioAPI) {
  $("header").prepend(renderToString(<div>Test</div>));
}
