import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { query } from "../src/utils/database.js";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

async function main() {
  try {
    const [, , emailArg, passwordArg, roleArg] = process.argv;
    if (!emailArg || !passwordArg) {
      console.error(
        "Usage: node backend/scripts/create-user.js <email> <password> [role=admin]",
      );
      process.exit(1);
    }
    const email = emailArg.trim().toLowerCase();
    const username = email.split("@")[0];
    const role = (roleArg || "admin").toLowerCase();

    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
    const hash = await bcrypt.hash(passwordArg, saltRounds);

    const id = `user_${uuidv4()}`;

    const sql = `
      INSERT INTO users (id, username, email, password_hash, role, email_verified, is_active, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,true,true,NOW(),NOW())
      ON CONFLICT (email) DO UPDATE SET
        username = EXCLUDED.username,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        email_verified = true,
        is_active = true,
        updated_at = NOW()
      RETURNING id, username, email, role;
    `;

    const res = await query(sql, [id, username, email, hash, role]);
    const u = res.rows[0];
    console.log("✅ User ready:", u);
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to create/update user:", err.message);
    process.exit(1);
  }
}

main();
