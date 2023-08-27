# notion-to-static-site
A hackable site generator for your notion pages.

# Usage
Set up an internal integration using [this guide](https://developers.notion.com/docs/authorization#internal-integration-auth-flow-set-up)
Grant the integration access to your page using [this guide](https://developers.notion.com/docs/authorization#integration-permissions)
create a `.env` file in the root of this project and add the following contents:

```
NOTION_API_TOKEN=<your token>
```

Update the `config.ts` file with values that are relevant to you.

Run:
```
npm install
npx tsx main.ts fetch # will fetch all of the pages and contents of your root page and put them in the /cache directory
npx tsx main.ts build # will traverse your cache directory and render them as html into the /dist directory
npx tsx main.ts serve # will serve your /dist directory locally
```

Navigate to `localhost:1337`. You'll be able to see your site! The static html is placed into the `dist` directory,
with `index.html` as the main entry point. You can then do with it as you like, like hook it up to render, or upload it
to github pages.

# Hack it
Should be easy enough to follow. The `main.ts` file has commands that are configured via yarn.

I find it useful to run these commands in two different terminals:
```
npx tsx watch ./main.ts build
npx tsx main.ts serve
```

This will automatically re-build your site for every change you make to the code. Then you can just refresh your
browser to see the changes.

# TODO
abstract out dlants.me-specific stuff into nested package that can be published and consumed separately
possibly set up a faster way to fetch updates for quicker testing and iteration speed
put up a "latest posts" list on the front page
next/previous links for posts within page
backlinks
setup something w/ highlighting for code blocks
fixup embeds (collapsible sections, etc...)
add #navigation links to each title / subtitle
split off the notion-to-static-site library into independent package from my own website
generate rss/atom feeds of sub-pages & mentions for each page
add icons for rss, email, page anchors, etc...
set up some analytics

# MAYBE
name asset files by content hash
