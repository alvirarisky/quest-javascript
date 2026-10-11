import { dispatch } from "../server/core.js";
export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST")
    return res.status(405).json({ error: "Gunakan POST." });
  try {
    if (Number(req.headers["content-length"] || 0) > 8192)
      return res.status(413).json({ error: "Payload terlalu besar." });
    res.status(200).json(dispatch(req.query.action, req.body));
  } catch (e) {
    res
      .status(e.status || 500)
      .json({ error: e.status ? e.message : "Terjadi kesalahan server." });
  }
}
