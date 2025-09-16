import BaseModel from "./BaseModel.js";
import { query } from "../utils/database.js";
import bcrypt from "bcryptjs";

class User extends BaseModel {
  constructor() {
    super("users");
  }

  async findByEmail(email) {
    const sql = `SELECT * FROM users WHERE email = $1 LIMIT 1`;
    const result = await query(sql, [email]);
    return result.rows[0] || null;
  }

  async findByUsername(username) {
    const sql = `SELECT * FROM users WHERE username = $1 LIMIT 1`;
    const result = await query(sql, [username]);
    return result.rows[0] || null;
  }

  async listSafe() {
    const sql = `SELECT id, username, email, role, created_at, updated_at FROM users ORDER BY created_at DESC`;
    const result = await query(sql);
    return result.rows;
  }

  async verifyPassword(user, password) {
    if (!user?.password_hash) return false;
    return bcrypt.compare(password, user.password_hash);
  }
}

export default new User();
