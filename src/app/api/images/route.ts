import { z } from "zod";
import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { getCloudinary } from "@/lib/cloudinary";
import { connectDb } from "@/lib/db";
import { ImageJob } from "@/models";

const schema = z.object({
  image: z.string().min(10),
  filename: z.string().optional().default("product-image"),
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const parsed = await parseBody(request, schema);
  if (parsed.response) return parsed.response;
  await connectDb();
  try {
    const upload = await getCloudinary().uploader.upload(parsed.data.image, {
      folder: "a-plus-studio",
      public_id: parsed.data.filename.replace(/[^a-z0-9-]/gi, "-").toLowerCase(),
      transformation: [{ width: 1000, height: 1000, crop: "pad", background: "white" }, { quality: "auto" }],
    });
    const item = await ImageJob.create({
      userId: auth.session.id,
      feature: "image-maker",
      status: "success",
      metadata: { url: upload.secure_url, publicId: upload.public_id },
    });
    return ok({ item, image: { url: upload.secure_url, publicId: upload.public_id } });
  } catch (error) {
    const item = await ImageJob.create({
      userId: auth.session.id,
      feature: "image-maker",
      status: "failed",
      message: error instanceof Error ? error.message : "Upload failed",
    });
    return fail("Image upload failed. Check Cloudinary credentials.", 500, { item });
  }
}

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  await connectDb();
  const items = await ImageJob.find({ userId: auth.session.id }).sort({ createdAt: -1 }).limit(50);
  return ok({
    items,
    capabilities: {
      backgroundRemoval: "local-keyless",
      imageGeneration: "cloudflare-workers-ai",
      resize: "cloudinary-1000x1000",
    },
  });
}
