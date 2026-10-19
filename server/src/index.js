import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = express();
const PORT = Number(process.env.PORT || 4000);
const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const users = new Map(); // email -> { id, email, passwordHash, name }

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/auth/register", async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ ok: false, error: "email + password(min 6) required" });
  }
  if (users.has(email)) return res.status(409).json({ ok: false, error: "email taken" });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: crypto.randomUUID(), email, name: name || email.split("@")[0], passwordHash };
  users.set(email, user);
  const token = jwt.sign({ sub: user.id, email }, SECRET, { expiresIn: "7d" });
  res.status(201).json({ ok: true, token, user: { id: user.id, email: user.email, name: user.name } });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  const user = users.get(email);
  if (!user || !(await bcrypt.compare(password || "", user.passwordHash))) {
    return res.status(401).json({ ok: false, error: "invalid credentials" });
  }
  const token = jwt.sign({ sub: user.id, email }, SECRET, { expiresIn: "7d" });
  res.json({ ok: true, token, user: { id: user.id, email: user.email, name: user.name } });
});

app.get("/auth/me", (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ ok: false, error: "unauthorized" });
  try {
    const payload = jwt.verify(token, SECRET);
    const user = [...users.values()].find((u) => u.id === payload.sub);
    if (!user) return res.status(401).json({ ok: false, error: "unauthorized" });
    res.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch {
    res.status(401).json({ ok: false, error: "unauthorized" });
  }
});

app.listen(PORT, () => console.log(`vue-auth-panel API on :${PORT}`));
