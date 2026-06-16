/* eslint-disable @typescript-eslint/no-require-imports */
const mongoose = require("mongoose");
import { isConfigured, requireEnv } from "@/lib/env";

type MongooseCache = {
  conn: MongooseRuntime | null;
  promise: Promise<MongooseRuntime> | null;
};

type MongooseRuntime = {
  connection: { readyState: number; name?: string };
};

declare global {
  var __aPlusMongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.__aPlusMongoose || {
  conn: null,
  promise: null,
};

if (!global.__aPlusMongoose) {
  global.__aPlusMongoose = cached;
}

export async function connectDb() {
  if (cached.conn) return cached.conn;
  if (!isConfigured("MONGODB_URI")) {
    throw new Error("MONGODB_URI is not configured");
  }

  cached.promise ||= mongoose.connect(requireEnv("MONGODB_URI"), {
    bufferCommands: false,
  }) as Promise<MongooseRuntime>;
  cached.conn = await cached.promise;
  return cached.conn;
}

export async function tryConnectDb() {
  try {
    return await connectDb();
  } catch {
    return null;
  }
}
