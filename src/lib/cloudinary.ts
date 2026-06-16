import { v2 as cloudinary } from "cloudinary";
import { getServerEnv, isConfigured } from "@/lib/env";

let configured = false;

export function getCloudinary() {
  if (!isConfigured("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET")) {
    throw new Error("Cloudinary is not configured");
  }

  if (!configured) {
    const env = getServerEnv();
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }

  return cloudinary;
}
