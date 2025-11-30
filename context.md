# Development Context

## Commands

The main script provides three commands:

### fetch
```bash
npx tsx main.ts fetch
```
Queries the Notion API and downloads all pages and content from your configured root page. Content is stored in the `cache/` directory, including images in `cache/images/`.

Requires `NOTION_API_TOKEN` environment variable to be set.

### build
```bash
npx tsx main.ts build
```
Processes content from the `cache/` directory and generates static HTML files in the `dist/` directory. This includes:
- Rendering all pages
- Rendering database pages
- Rendering tag pages
- Generating RSS/Atom feeds
- Creating sitemap
- Copying static assets and images

### serve
```bash
npx tsx main.ts serve [--port <port>]
```
Starts a local development server serving the `dist/` directory. Default port is 1337.

## Development Workflow

### Initial Setup
```bash
npm install
npx tsx main.ts fetch
npx tsx main.ts build
npx tsx main.ts serve
```

### Active Development
Run these commands in separate terminals for live development:

Terminal 1 - Auto-rebuild on code changes:
```bash
npx tsx watch ./main.ts build
```

Terminal 2 - Local server:
```bash
npx tsx main.ts serve
```

Then refresh your browser at `localhost:1337` to see changes.

### Updating Content from Notion
```bash
npx tsx main.ts fetch
npx tsx main.ts build
```

## Configuration

Main configuration is in `config.ts`. Key settings:
- `rootPageId` - Your Notion root page
- `publishDatePropertyName` - Property name for publish dates
- `tagMap` - Mapping of tag IDs to site paths
- `buttondownId` - Optional newsletter integration
