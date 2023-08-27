import * as csx from "csx";
import { MultiSelectPageProperty } from "../util";

export const MAX_WIDTH_PX = 720;

export const COLORS = {
  black: csx.hsl(0, 0, 0),
  lightgray: csx.hsl(0, 0, 0.9),
  darkgray: csx.hsl(0, 0, 0.4),
  gray: csx.hsl(0, 0, 0.6),
};

type NotionColors = MultiSelectPageProperty["multi_select"][number]["color"];

// source: https://optemization.com/notion-color-guide
export const NOTION_COLORS: { [color in NotionColors]: csx.ColorHelper } = {
  default: csx.rgb(55,53,47),
  gray: csx.rgb(155,154,151),
  brown: csx.rgb(100,71,58),
  orange: csx.rgb(217,115,13),
  yellow: csx.rgb(223,171,1),
  green: csx.rgb(15,123,108),
  blue: csx.rgb(11,110,153),
  purple: csx.rgb(105,64,165),
  pink: csx.rgb(173,26,114),
  red: csx.rgb(224,62,62),
};

export const NOTION_BACKGROUND_COLORS: { [color in NotionColors]: csx.ColorHelper } = {
  default: csx.rgb(255,255,255),
  gray: csx.rgb(235,236,237),
  brown: csx.rgb(233,229,227),
  orange: csx.rgb(250,235,221),
  yellow: csx.rgb(251,243,219),
  green: csx.rgb(221,237,234),
  blue: csx.rgb(221,235,241),
  purple: csx.rgb(234,228,242),
  pink: csx.rgb(244,223,235),
  red: csx.rgb(251,228,228),
};
