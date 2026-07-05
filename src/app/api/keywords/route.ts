import { NextRequest } from "next/server";
import { POST as keywordResearchPost, GET } from "../ai/keyword-research/route";

export { GET };

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const normalized = {
    ...body,
    seedKeyword: body.seedKeyword || body.keyword,
    productName: body.productName || body.keyword,
  };
  return keywordResearchPost(
    new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify(normalized),
    }),
  );
}
