import mongoose from "mongoose";
import fs from "fs";

for (const file of [".env.local", ".env"]) {
  if (!fs.existsSync(file)) continue;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (process.env[key]) continue;
    process.env[key] = rest.join("=").replace(/^['"]|['"]$/g, "");
  }
}

const uri = process.env.MONGODB_URI;
console.log("URI:", uri);
try {
  await mongoose.connect(uri);
  console.log("Connected successfully!");
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log("Collections:", collections.map(c => c.name));
  await mongoose.disconnect();
} catch (err) {
  console.error("Connection failed:", err);
}
