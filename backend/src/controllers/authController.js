import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { query } from "../utils/database.js";

function signToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  };
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(payload, secret, { expiresIn });
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Email and password are required" });
    }
    const user = await User.findByEmail(email);
    if (!user)
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });

    const valid = await User.verifyPassword(user, password);
    if (!valid)
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });

    const token = signToken(user);
    // Best-effort stats update; ignore schema diffs
    try {
      await query(
        `UPDATE users SET last_login = NOW(), login_count = COALESCE(login_count,0) + 1 WHERE id = $1`,
        [user.id],
      );
    } catch {}
    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Login failed" });
  }
}

export async function me(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });
    return res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to load user" });
  }
}
