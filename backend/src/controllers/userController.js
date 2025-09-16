import User from "../models/User.js";

export async function listUsers(req, res) {
  try {
    const rows = await User.listSafe();
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to load users" });
  }
}
