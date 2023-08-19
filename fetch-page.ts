import { Client } from "@notionhq/client";

export async function fetchPage({
  pageId,
  notionApiToken,
}: {
  pageId: string;
  notionApiToken: string;
}) {
  const notionClient = new Client({
    auth: notionApiToken,
  });

  const result = await notionClient.pages.retrieve({
    page_id: pageId,
  });

  console.log(JSON.stringify(result, null, 2));
}
