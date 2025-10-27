import crypto from "crypto";

const sign = (val, secret) => crypto.createHmac("sha256", secret).update(val).digest("hex");

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  // robust body parse
  let body = {};
  try {
    const raw = await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => resolve(data));
      req.on("error", reject);
    });
    if (raw) body = JSON.parse(raw);
  } catch (e) {
    body = {};
  }

  const inputPassword = (body.password || "").toString();
  const SITE_PASSWORD = process.env.SITE_PASSWORD;
  const SESSION_SECRET = process.env.SESSION_SECRET || "change_this_long_secret";

  console.log("LOGIN DEBUG: SITE_PASSWORD set:", !!SITE_PASSWORD, "SITE_PASSWORD length:", SITE_PASSWORD ? SITE_PASSWORD.length : 0);
  console.log("LOGIN DEBUG: received password length:", inputPassword.length);

  if (!SITE_PASSWORD) {
    console.error("LOGIN DEBUG: SITE_PASSWORD not configured in environment");
    return res.status(500).json({ ok: false, message: "Server not configured" });
  }

  const ok = inputPassword.trim() === SITE_PASSWORD.trim();
  console.log("LOGIN DEBUG: password match:", ok);

  if (!inputPassword || !ok) {
    return res.status(401).json({ ok: false, message: "Ungültiges Passwort" });
  }

  const payload = `${Date.now()}`;
  const sig = sign(payload, SESSION_SECRET);
  const token = `${payload}.${sig}`;

  const secureFlag = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const cookie = `session=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24}; SameSite=Lax${secureFlag}`;
  res.setHeader("Set-Cookie", cookie);
  return res.json({ ok: true });
}