import crypto from "crypto";

async function verifyPasswordTest(password, stored) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = await new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 120000, 32, "sha256", (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey.toString("hex"));
    });
  });
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(candidate));
}

// Seed logic:
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

const pwd = "Admin@12345";
const stored = hashPassword(pwd);
console.log("Stored:", stored);
const match = await verifyPasswordTest(pwd, stored);
console.log("Match:", match);
const mismatch = await verifyPasswordTest("wrong", stored);
console.log("Mismatch (should be false):", mismatch);
