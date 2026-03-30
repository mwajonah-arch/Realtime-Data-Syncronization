import { Router, type IRouter } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const DEFAULT_ADMIN_PASSWORD = "admin1234";

async function getAdminPassword(): Promise<string> {
  const row = await db.select().from(settingsTable).where(eq(settingsTable.key, "adminPassword")).limit(1);
  return row[0]?.value ?? DEFAULT_ADMIN_PASSWORD;
}

router.post("/login", async (req, res) => {
  const { role, password } = req.body as { role?: string; password?: string };
  if (!role || !["staff", "admin"].includes(role)) {
    res.status(400).json({ error: "Invalid role" });
    return;
  }
  if (role === "admin") {
    const adminPw = await getAdminPassword();
    if (password !== adminPw) {
      res.status(401).json({ error: "Incorrect password" });
      return;
    }
  }
  res.json({ success: true, role });
});

router.post("/change-password", async (req, res) => {
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "currentPassword and newPassword are required" });
    return;
  }
  const adminPw = await getAdminPassword();
  if (currentPassword !== adminPw) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters" });
    return;
  }
  await db
    .insert(settingsTable)
    .values({ key: "adminPassword", value: newPassword })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value: newPassword } });
  res.json({ success: true });
});

export default router;
