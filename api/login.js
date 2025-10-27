const crypto = require("crypto");

const sign = (val, secret) =>
  crypto.createHmac("sha256", secret).update(val).digest("hex");

module.exports = async (req, res) => {
  // only allow POST
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const { password } = req.body || {};
  const SITE_PASSWORD = process.env.SITE_PASSWORD; // set in Vercel dashboard
  const SESSION_SECRET = process.env.SESSION_SECRET || "change_this_long_secret";

  if (!SITE_PASSWORD) return res.status(500).json({ ok: false, message: "Server not configured" });

  if (!password || password !== SITE_PASSWORD) {
    return res.status(401).json({ ok: false, message: "Ungültiges Passwort" });
  }

  // create a signed token (simple: timestamp + signature)
  const payload = `${Date.now()}`;
  const sig = sign(payload, SESSION_SECRET);
  const token = `${payload}.${sig}`;

  // set httpOnly secure cookie (path=/)
  const cookie = `session=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24}; SameSite=Lax`;
  // If you use HTTPS (Vercel) you can add ; Secure
  res.setHeader("Set-Cookie", cookie + "; Secure");
  return res.json({ ok: true });
};