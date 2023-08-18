# notion-to-static-site
A hackable site generator for your notion pages.

# Usage
Go to a Notion page, and export it as HTML. Make sure you include all content and subpages, and create folders for
subpages.

Place the results into `static/export`

Run:
```
npm install
npx tsx main.ts build
npx tsx main.ts serve
```

Navigate to `localhost:1337`. You'll be able to see your site! The static html is placed into `static/dist`, with
`index.html` as the main entry point. You can then do with it as you like, like hook it up to render, or upload it
to github pages.

# Hack it
Should be easy enough to follow. The `main.ts` file has the main build command. It walks `static/export/` to generate
a list of pages, then applies transforms in `transforms/` to each page.

## TODO
style page, header
media queries for mobile styling
favicon
update pageUrls to use pageIds / hashes, to make links more permanent (so they don't change if the page gets renamed)
keep asset files between renders, so we don't have to re-download them
generate rss files for each section
fixup embeds (collapsible sections, etc...)
add automatic "next post / previous post" links for multiple pages in the same section
add #naviation links to each title / subtitle
check the build results into the repo, set up render to mirror repo to website

## MAYBE
consider using the notion api to fetch pages / blocks, rather than relying on manual export of html. Possibly use https://github.com/kerwanp/notion-render
name asset files by content hash
