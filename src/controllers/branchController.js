import { randomUUID } from 'node:crypto';
import Branch from '../models/Branch.js';
import Customer from '../models/Customer.js';
import Laptop from '../models/Laptop.js';
import Order from '../models/Order.js';
import Return from '../models/Return.js';
import User from '../models/User.js';

export async function listBranches(_request, response) {
  const branches = await Branch.find({ active: true }).sort({ createdAt: 1 }).lean();
  const result = await Promise.all(branches.map(async branch => {
    const [devices, units, customers, orders, employees] = await Promise.all([
      Laptop.countDocuments({ branch: branch._id }),
      Laptop.aggregate([{ $match: { branch: branch._id } }, { $group: { _id: null, total: { $sum: '$quantity' } } }]),
      Customer.countDocuments({ branch: branch._id }),
      Order.countDocuments({ branch: branch._id }),
      User.countDocuments({ branch: branch._id, active: true }),
    ]);
    return { ...branch, id: branch._id.toString(), _id: undefined, stats: { devices, units: units[0]?.total || 0, customers, orders, employees } };
  }));
  response.json(result);
}

export async function listUsers(_request, response) {
  response.json(await User.find({ role: { $ne: 'super_admin' } }).populate('branch', 'name code').sort({ createdAt: -1 }));
}

export async function createUser(request, response) {
  const name = String(request.body.name || '').trim();
  const password = String(request.body.password || '');
  const role = request.body.role === 'admin' ? 'admin' : 'employee';
  const branch = await Branch.findOne({ _id: request.body.branchId, active: true });
  if (!name || password.length < 8 || !branch) return response.status(400).json({ message: 'الاسم والفرع وكلمة مرور من 8 أحرف مطلوبة' });
  if (await User.exists({ name })) return response.status(409).json({ message: 'الاسم مستخدم بالفعل' });
  const user = await User.create({ name, password, role, branch: branch.id, email: `${randomUUID()}@local.voltio` });
  await user.populate('branch', 'name code');
  response.status(201).json(user);
}

export async function updateUser(request, response) {
  const branch = await Branch.findOne({ _id: request.body.branchId, active: true });
  if (!branch) return response.status(400).json({ message: 'الفرع غير صحيح' });
  const update = { branch: branch.id, role: request.body.role === 'admin' ? 'admin' : 'employee', active: request.body.active !== false };
  const user = await User.findOneAndUpdate({ _id: request.params.id, role: { $ne: 'super_admin' } }, update, { new: true, runValidators: true }).populate('branch', 'name code');
  if (!user) return response.status(404).json({ message: 'الحساب غير موجود' });
  response.json(user);
}
