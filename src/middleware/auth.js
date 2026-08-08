import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function protect(request, response, next) {
  try {
    const token = request.headers.authorization?.startsWith('Bearer ') && request.headers.authorization.slice(7);
    if (!token) return response.status(401).json({ message: 'يجب تسجيل الدخول أولاً' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development-only-change-me');
    const user = await User.findById(decoded.id);
    if (!user) return response.status(401).json({ message: 'الحساب غير موجود' });
    request.user = user;
    next();
  } catch (_error) { response.status(401).json({ message: 'جلسة تسجيل الدخول غير صالحة' }); }
}

export function adminOnly(request, response, next) {
  if (request.user.role !== 'admin') return response.status(403).json({ message: 'هذه العملية متاحة للأدمن فقط' });
  next();
}
