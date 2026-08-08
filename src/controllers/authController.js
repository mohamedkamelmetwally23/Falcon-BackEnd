import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import User from '../models/User.js';

const tokenFor = user => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'development-only-change-me', { expiresIn: '7d' });
const result = user => ({ token: tokenFor(user), user: user.toJSON() });

export async function register(request, response) {
  const { name, password } = request.body;
  if (!name || !password) return response.status(400).json({ message: 'الاسم وكلمة المرور مطلوبان' });
  if (password.length < 8) return response.status(400).json({ message: 'كلمة المرور يجب ألا تقل عن 8 أحرف' });
  if (await User.exists({ name: name.trim() })) return response.status(409).json({ message: 'الاسم مستخدم بالفعل' });
  const user = await User.create({ name: name.trim(), email: `${randomUUID()}@local.voltio`, password, role: 'user' });
  response.status(201).json(result(user));
}

export async function login(request, response) {
  await seedAdmin();
  const user = await User.findOne({ name: request.body.name?.trim() }).select('+password');
  if (!user || !(await user.checkPassword(request.body.password || ''))) return response.status(401).json({ message: 'الاسم أو كلمة المرور غير صحيحة' });
  response.json(result(user));
}

export async function seedAdmin() {
  const { ADMIN_PASSWORD } = process.env;
  const name = process.env.ADMIN_NAME || 'admin';
  if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) return;
  if (!await User.exists({ name })) await User.create({ name, email: `${randomUUID()}@local.voltio`, password: ADMIN_PASSWORD, role: 'admin' });
}
