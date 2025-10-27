const crypto = require("crypto");

const sign = (val, secret) =>
  crypto.createHmac("sha256", secret).update(val).digest("hex");

module.exports = async (req, res) => {
  const SESSION_SECRET = process.env.SESSION_SECRET || "change_this_long_secret";
  const cookie = (req.headers.cookie || "")
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("session="));

  if (!cookie) return res.status(401).json({ ok: false });

  const token = cookie.split("=")[1];
  if (!token) return res.status(401).json({ ok: false });

  const [payload, sig] = token.split(".");
  if (!payload || !sig) return res.status(401).json({ ok: false });

  const expected = sign(payload, SESSION_SECRET);
  // optional: check expiry based on payload timestamp
  const ageMs = Date.now() - parseInt(payload || "0", 10);
  const maxAgeMs = 1000 * 60 * 60 * 24; // 24h
  if (sig !== expected || ageMs > maxAgeMs) return res.status(401).json({ ok: false });

  return res.json({ ok: true });
}; 