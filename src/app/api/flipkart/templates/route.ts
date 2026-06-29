import { GET as templatesGet, POST as templatesPost } from "../../templates/route";

function withFlipkartPlatform(request: Request) {
  const url = new URL(request.url);
  url.searchParams.set("platform", "flipkart");
  return new Request(url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
}

export async function GET(request: Request) {
  return templatesGet(withFlipkartPlatform(request));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return templatesPost(
    new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify({ ...body, platform: "flipkart" }),
    }),
  );
}
