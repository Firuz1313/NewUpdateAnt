import express from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { listUsers } from "../controllers/userController.js";

const router = express.Router();

router.get("/", authenticate, requireAdmin, listUsers);

export default router;
