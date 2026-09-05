import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Branch from '../models/Branch.js';

export async function protect(request, response, next) {
  try {
    const token = request.headers.authorization?.startsWith('Bearer ') && request.headers.authorization.slice(7);
    if (!token) return response.status(401).json({ message: 'يجب تسجيل الدخول أولاً' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development-only-change-me');
    const user = await User.findById(decoded.id);
    if (!user || !user.active) return response.status(401).json({ message: 'الحساب غير موجود أو غير نشط' });
    request.user = user;
    next();
  } catch (_error) { response.status(401).json({ message: 'جلسة تسجيل الدخول غير صالحة' }); }
}

export function adminOnly(request, response, next) {
  if (!['admin', 'super_admin'].includes(request.user.role)) return response.status(403).json({ message: 'هذه العملية متاحة للإدارة فقط' });
  next();
}

export function superAdminOnly(request, response, next) {
  if (request.user.role !== 'super_admin') return response.status(403).json({ message: 'هذه العملية متاحة للسوبر أدمن فقط' });
  next();
}

export async function requireBranch(request, response, next) {
  const branchId = request.user.role === 'super_admin'
    ? request.headers['x-branch-id']
    : request.user.branch?.toString();
  if (!branchId) return response.status(400).json({ message: 'يجب اختيار الفرع أولاً' });
  if (!mongoose.isValidObjectId(branchId) || !await Branch.exists({ _id: branchId, active: true })) return response.status(400).json({ message: 'الفرع المختار غير صحيح أو غير نشط' });
  if (request.user.role !== 'super_admin' && branchId !== request.user.branch?.toString()) {
    return response.status(403).json({ message: 'لا يمكنك الوصول إلى بيانات فرع آخر' });
  }
  request.branchId = branchId;
  next();
}
