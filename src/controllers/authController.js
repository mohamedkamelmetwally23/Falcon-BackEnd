import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import User from '../models/User.js';
import Branch, { defaultBranches } from '../models/Branch.js';

const tokenFor = user => jwt.sign({ id: user.id, role: user.role, branch: user.branch || null }, process.env.JWT_SECRET || 'development-only-change-me', { expiresIn: '7d' });
const result = user => ({ token: tokenFor(user), user: user.toJSON() });

export async function register(request, response) {
  const { name, password, branchId } = request.body;
  if (!name || !password) return response.status(400).json({ message: 'الاسم وكلمة المرور مطلوبان' });
  if (password.length < 8) return response.status(400).json({ message: 'كلمة المرور يجب ألا تقل عن 8 أحرف' });
  if (await User.exists({ name: name.trim() })) return response.status(409).json({ message: 'الاسم مستخدم بالفعل' });
  const branch = await Branch.findOne({ _id: branchId, active: true });
  if (!branch) return response.status(400).json({ message: 'يجب اختيار فرع صحيح' });
  const user = await User.create({ name: name.trim(), email: `${randomUUID()}@local.voltio`, password, role: 'employee', branch: branch.id });
  await user.populate('branch', 'name code');
  response.status(201).json(result(user));
}

export async function login(request, response) {
  await seedAdmin();
  const user = await User.findOne({ name: request.body.name?.trim() }).select('+password');
  if (!user || !(await user.checkPassword(request.body.password || ''))) return response.status(401).json({ message: 'الاسم أو كلمة المرور غير صحيحة' });
  if (!user.active) return response.status(403).json({ message: 'هذا الحساب غير نشط' });
  await user.populate('branch', 'name code');
  response.json(result(user));
}

export async function seedAdmin() {
  await Branch.bulkWrite(defaultBranches.map(branch => ({
    updateOne: { filter: { code: branch.code }, update: { $setOnInsert: branch }, upsert: true },
  })));
  const { ADMIN_PASSWORD } = process.env;
  const name = process.env.ADMIN_NAME || 'admin';
  if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) return;
  const existing = await User.findOne({ name });
  if (!existing) await User.create({ name, email: `${randomUUID()}@local.voltio`, password: ADMIN_PASSWORD, role: 'super_admin' });
  else if (existing.role !== 'super_admin') { existing.role = 'super_admin'; existing.branch = null; await existing.save(); }
}

export async function listPublicBranches(_request, response) {
  await seedAdmin();
  response.json(await Branch.find({ active: true }).sort({ createdAt: 1 }));
}
