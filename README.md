# notion-to-static-site
Convert a notion page to a static site.

# Setup

Fork this repo.

Set up an internal Notion integration using [this guide](https://developers.notion.com/docs/authorization#internal-integration-auth-flow-set-up).

Grant the integration access to the Notion page you want to use as the home page following [this guide](https://developers.notion.com/docs/authorization#integration-permissions).

create a `.env` file in the root of this project and add the following contents:

```
NOTION_API_TOKEN=<your token>
```

Update the `config.ts` file with values that are relevant to you. Most importantly, configure `rootPageId`, and
`publishDatePropertyName`.

Run:
```
npm install
npx tsx main.ts fetch # fetch all of the pages and contents of your root page and put them in the cache/ directory
npx tsx main.ts build # traverse your cache directory and render the restulting html into the dist/ directory
npx tsx main.ts serve # serve your dist/ directory locally
```

Navigate to `localhost:1337`. You'll be able to see your site! The root page is renamed to`index.html`, and serves as
the main entry point.

# Usage

I recommend organizing your posts into a database. Databases should have a tag property, and a publish date property.
Posts will be sorted by publish date, and posts without a publish date will not be shown. Each tag will get its own
page, showing posts from that db filtered by the tag.

You can also use pages that are not inside a database, nested pages and cross-links. Though, be careful about linking
to something that is not a child of your root page, since your integration will not have permission to fetch it via the
API.

Each db tag filter sets up a rss and atom feed, linked from the table header.

There's also an integration with [buttondown](https://buttondown.email/). At time of writing, they have a free plan for
under 100 subscribers. Hosting your own mail server and maillist management is
[tough](https://news.ycombinator.com/item?id=32715437), so I do recommend using a provider, and buttondown seems like
a good option in terms of price and feature set for a personal blog.

Right now there's a single feed for the newsletter, but I think it should be easy to extend it to separate mail lists
by tag / topic.

You can also [hook up the mail list to an rss feed](https://buttondown.email/features/rss) to automate email sending
when you update your blog.

# Deploying to a static site.

Once you have the output in your static directory, you can deploy it anywhere you like.

One free option is to check that directory into a github repo and host it with [github pages](https://pages.github.com/).

My personal site, [dlants.me](https://dlants.me) is hosted with [render](https://render.com/). This is also free for
static sites, and scales up with compute usage, which should be very affordable.

To set up on render, do the following:

1. fork this repo
2. set up a render [static site](https://render.com/docs/static-sites)
3. in the static site settings, add the `.env` secret file, and populate it with your `NOTION_API_TOKEN`, as above.
4. in the static site settings, set the build command to be `./build.sh`
5. (optionally) configure a custom domain for your static site.

Now, every time you merge into your `main` branch, the build will automatically run. When you update your source page
in Notion, you can go to your render dashboard and manually trigger a build. It will fetch the latest changes via the
Notion API & update the content on your site.

# Hack it

The point of this project is customization! The `main.ts` file is the entry point that defines all the commands.

After fetching from Notion, I find it useful to run these commands in two different terminals while developing:
```
npx tsx watch ./main.ts build
npx tsx main.ts serve
```

This will automatically re-build your site for every change you make to the code. Then you can just refresh your
browser to see the changes.

Rendering elements is done via JSX and [react-dom](https://react.dev/reference/react-dom/server).

Styling is done via [typestyle](https://typestyle.github.io/#/).

Note: Not all blocks are implemented - I prioritized just those blocks that I commonly use, so

# TODO

abstract out dlants.me-specific stuff and figure out a way of organizing the site rendering stuff in an easily share-able, consumable way

add opengraph metadata (ogp.me)

next/previous post links

backlinks

add #nav links to each heading

set up an analytics integration option

# MAYBE

set up a faster way to fetch updates for quicker testing and iteration speed

setup something w/ highlighting for code blocks

fixup embeds (collapsible sections, etc...)

add icons for rss, email, page anchors, etc...
