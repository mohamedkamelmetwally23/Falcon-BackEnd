import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import User from "../models/User.js";

const tokenFor = (user) =>
  jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || "development-only-change-me",
    { expiresIn: "7d" },
  );
const result = (user) => ({ token: tokenFor(user), user: user.toJSON() });

export async function register(request, response) {
  const name = String(request.body.name || "").trim();
  const phone = String(request.body.phone || "").trim();
  const { password } = request.body;
  if (!name || !phone || !password)
    return response
      .status(400)
      .json({ message: "الاسم ورقم الهاتف وكلمة المرور مطلوبة" });
  if (password.length < 8)
    return response
      .status(400)
      .json({ message: "كلمة المرور يجب ألا تقل عن 8 أحرف" });
  if (await User.exists({ name: name.trim() }))
    return response.status(409).json({ message: "الاسم مستخدم بالفعل" });
  const user = await User.create({
    name: name.trim(),
    phone,
    email: `${randomUUID()}@local.voltio`,
    password,
    role: "employee",
  });
  response.status(201).json(result(user));
}

export async function listLeads(_request, response) {
  response.json(
    await User.find({ role: "employee" })
      .select("name phone createdAt")
      .sort({ createdAt: -1 })
      .lean(),
  );
}

export async function login(request, response) {
  await seedAdmin();
  const user = await User.findOne({ name: request.body.name?.trim() }).select(
    "+password",
  );
  if (!user || !(await user.checkPassword(request.body.password || "")))
    return response
      .status(401)
      .json({ message: "الاسم أو كلمة المرور غير صحيحة" });
  if (!user.active)
    return response.status(403).json({ message: "هذا الحساب غير نشط" });
  response.json(result(user));
}

export async function seedAdmin() {
  const database = User.db;
  await Promise.all([
    User.collection.updateMany({}, { $unset: { branch: 1 } }),
    database.collection("laptops").updateMany({}, { $unset: { branch: 1 } }),
    database.collection("customers").updateMany({}, { $unset: { branch: 1 } }),
    database.collection("orders").updateMany({}, { $unset: { branch: 1 } }),
    database.collection("returns").updateMany({}, { $unset: { branch: 1 } }),
    database
      .collection("branches")
      .drop()
      .catch(() => false),
  ]);
  const { ADMIN_PASSWORD } = process.env;
  const name = process.env.ADMIN_NAME || "admin";
  if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) return;
  const existing = await User.findOne({ name });
  if (!existing)
    await User.create({
      name,
      phone: process.env.ADMIN_PHONE || "غير مسجل",
      email: `${randomUUID()}@local.voltio`,
      password: ADMIN_PASSWORD,
      role: "super_admin",
    });
  else if (existing.role !== "super_admin") {
    existing.role = "super_admin";
    await existing.save();
  }
}
