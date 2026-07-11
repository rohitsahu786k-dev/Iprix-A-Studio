import { z } from "zod";
import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { getServerEnv, isConfigured } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  prompt: z.string().trim().min(12).max(1200),
});

const DEFAULT_MODEL = "@cf/black-forest-labs/flux-1-schnell";

export async function POST(request: Request) {
  const limited = rateLimit(request, "images:generate", 5, 60_000);
  if (limited) return limited;

  const auth = await requireApiUser(undefined, request);
  if (auth.response) return auth.response;

  const parsed = await parseBody(request, schema);
  if (parsed.response) return parsed.response;

  if (!isConfigured("CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN")) {
    return fail(
      "AI image generation is ready but not configured. Add the Cloudflare Workers AI Account ID and API token.",
      503,
      { code: "IMAGE_PROVIDER_NOT_CONFIGURED" },
    );
  }

  const env = getServerEnv();
  const model = env.CLOUDFLARE_IMAGE_MODEL || DEFAULT_MODEL;
  if (!model.startsWith("@cf/")) return fail("Invalid Cloudflare image model configuration.", 500);

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(env.CLOUDFLARE_ACCOUNT_ID)}/ai/run/${model}`;
  const productPrompt = [
    parsed.data.prompt,
    "Premium Indian ecommerce product photography, clean studio lighting, marketplace-ready composition, no watermark, no logo, no text.",
  ].join(" ");

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: productPrompt, steps: 4 }),
      signal: AbortSignal.timeout(45_000),
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") || "";
    if (!response.ok) {
      const payload = contentType.includes("application/json")
        ? await response.json().catch(() => null)
        : null;
      const providerMessage = readProviderError(payload);
      return fail(providerMessage || "The image provider could not generate this image.", response.status >= 500 ? 502 : 400);
    }

    if (contentType.startsWith("image/")) {
      const image = Buffer.from(await response.arrayBuffer()).toString("base64");
      return ok({ image: { dataUrl: `data:${contentType.split(";")[0]};base64,${image}`, model } });
    }

    const payload = await response.json().catch(() => null) as { result?: { image?: unknown } } | null;
    const image = payload?.result?.image;
    if (typeof image !== "string" || !image) return fail("The image provider returned an invalid image.", 502);

    const dataUrl = image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`;
    return ok({ image: { dataUrl, model } });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return fail("Image generation timed out. Please try again.", 504);
    }
    return fail("Image generation is temporarily unavailable.", 502);
  }
}

function readProviderError(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const errors = (payload as { errors?: unknown }).errors;
  if (!Array.isArray(errors)) return "";
  const first = errors[0];
  if (!first || typeof first !== "object") return "";
  const message = (first as { message?: unknown }).message;
  return typeof message === "string" ? message.slice(0, 240) : "";
}
