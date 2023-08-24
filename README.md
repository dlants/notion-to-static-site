# notion-to-static-site
A hackable site generator for your notion pages.

# Usage
Set up an internal integration using [this guide](https://developers.notion.com/docs/authorization#internal-integration-auth-flow-set-up)
Grant the integration access to your page using [this guide](https://developers.notion.com/docs/authorization#integration-permissions)
create a `.env` file in the root of this project and add the following contents:

```
NOTION_API_TOKEN=<your token>
ROOT_PAGE_ID=<the page id that will be the root of your site>
```

Run:
```
npm install
# will fetch all of the pages and contents of your root page and put them in the /cache directory
npx tsx main.ts fetch
# will traverse your cache directory and render them as html into the /dist directory
npx tsx main.ts build
# will serve your /dist directory locally
npx tsx main.ts serve
```

Navigate to `localhost:1337`. You'll be able to see your site! The static html is placed into the `dist` directory,
with `index.html` as the main entry point. You can then do with it as you like, like hook it up to render, or upload it
to github pages.

# Hack it
Should be easy enough to follow. The `main.ts` file has the main build command. It walks `cache/` to generate
a graph of pages, then renders each page.

I find it useful to run these commands in two different terminals:
```
npx tsx watch ./main.ts build
npx tsx main.ts serve
```

This will automatically re-build your site for every change you make to the code.

# TODO
generate rss/atom feeds of sub-pages & mentions for each page
move breadcrumbs out of header
setup inline buttondown subscribe
backlinks
next/previous links for posts within page
setup something w/ highlighting for code blocks
fixup embeds (collapsible sections, etc...)
add automatic "next post / previous post" links for multiple pages in the same section
add #navigation links to each title / subtitle
check the build results into the repo, set up render to mirror repo to website
add footer, vertical space at the bottom of the page

# MAYBE
name asset files by content hash
