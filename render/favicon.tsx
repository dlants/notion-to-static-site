import * as React from "react";
import fs from "fs";
import { siteConfig } from "../config";

const svgStr = fs.readFileSync(siteConfig.faviconPath);

export const favicon = (
  <div
    dangerouslySetInnerHTML={{
      __html: svgStr,
    }}
  />
);
