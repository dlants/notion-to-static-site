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
with `index.html` as the main entry point.

# Deploying to a static site.
Once you have the output in your static directory, you can deploy it anywhere you like.

One option is to check that directory into a github repo and host it with github pages.

My personal site, [dlants.me](https://dlants.me) is hosted with [render](https://render.com/).

To set up, a similar system, do the following:
1. fork this repo into your own github account
2. set up a render [static site](https://render.com/docs/static-sites)
3. in the static site settings, add the `.env` secret file, and populate it with your `NOTION_API_TOKEN`.
4. in the static site settings, set the build command to be `./build.sh`

Now, every time you merge into your main branch, the build will automatically run. When you update your source page
in notion, you can go to your render dashboard and manually trigger a build. It will fetch the latest changes & update
your site.

# Hack it
The point of this project is customization! The `main.ts` file is the entry point that defines all the commands.

After fetching from Notion, I find it useful to run these commands in two different terminals while developing:
```
npx tsx watch ./main.ts build
npx tsx main.ts serve
```

This will automatically re-build your site for every change you make to the code. Then you can just refresh your
browser to see the changes.

# TODO
abstract out dlants.me-specific stuff so notion-to-static-site is a generic / spearate package that can be published and consumed separately
add opengraph metadata (ogp.me)
next/previous links for pages within a db
backlinks
add #nav links to each page and heading
set up an analytics integration option

# MAYBE
name asset files by content hash
set up a faster way to fetch updates for quicker testing and iteration speed
setup something w/ highlighting for code blocks
fixup embeds (collapsible sections, etc...)
add icons for rss, email, page anchors, etc...
