import * as React from "react";
import fs from 'fs'
import path from 'path'

const svgStr = fs.readFileSync(path.join('static', 'black-rectangle.svg'))

export const favicon = (
  <div
    dangerouslySetInnerHTML={{
      __html: svgStr,
    }}
  />
);
