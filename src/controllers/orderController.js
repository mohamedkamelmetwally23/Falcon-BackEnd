import Laptop from '../models/Laptop.js';
import Order from '../models/Order.js';
import mongoose from 'mongoose';
import Return from '../models/Return.js';

const populated = query => query.populate('user', 'name').populate('items.laptop', 'model brand processor ram storage').populate('laptop', 'model brand processor ram storage');

export async function createOrder(request, response) {
  const customerName = request.body.customerName?.trim();
  if (!customerName) return response.status(400).json({ message: 'اسم العميل مطلوب' });
  const invoiceDate = request.body.invoiceDate ? new Date(request.body.invoiceDate) : new Date();
  if (Number.isNaN(invoiceDate.getTime())) return response.status(400).json({ message: 'تاريخ الفاتورة غير صحيح' });
  const notes = String(request.body.notes || '').trim().slice(0, 1000);
  const requested = Array.isArray(request.body.items) ? request.body.items : [{ laptopId: request.body.laptopId, quantity: request.body.quantity }];
  if (!requested.length) return response.status(400).json({ message: 'يجب إضافة بند واحد على الأقل' });
  const ids = requested.map(item => item.laptopId);
  if (new Set(ids).size !== ids.length) return response.status(400).json({ message: 'لا يمكن تكرار نفس الجهاز في أكثر من بند' });
  const laptops = await Laptop.find({ _id: { $in: ids } });
  if (laptops.length !== ids.length) return response.status(404).json({ message: 'أحد الأجهزة غير موجود' });
  const items = requested.map(requestedItem => {
    const laptop = laptops.find(entry => entry.id === requestedItem.laptopId);
    const quantity = Number(requestedItem.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) throw Object.assign(new Error('الكمية غير صحيحة'), { status: 400 });
    if (quantity > laptop.quantity) throw Object.assign(new Error(`الكمية المطلوبة من ${laptop.model} غير متاحة`), { status: 400 });
    return { laptop: laptop.id, product: `${laptop.brand} ${laptop.model}`.trim(), quantity, unitPrice: laptop.price, lineTotal: laptop.price * quantity };
  });
  const order = await Order.create({ user: request.user.id, customerName, invoiceDate, notes, items, total: items.reduce((sum, item) => sum + item.lineTotal, 0) });
  response.status(201).json(await populated(Order.findById(order.id)));
}
export async function listOrders(request, response) {
  const returnedOrderIds = await Return.distinct('order');
  if (returnedOrderIds.length) await Order.updateMany({ _id: { $in: returnedOrderIds }, status: 'confirmed' }, { status: 'returned' });
  const filter = request.user.role === 'admin' ? {} : { user: request.user.id };
  response.json(await populated(Order.find(filter).sort({ createdAt: -1 })));
}
export async function updateOrderStatus(request, response) {
  const allowed = ['new', 'preparing', 'delivered', 'cancelled'];
  if (!allowed.includes(request.body.status)) return response.status(400).json({ message: 'حالة الأوردر غير صحيحة' });
  const order = await populated(Order.findByIdAndUpdate(request.params.id, { status: request.body.status }, { new: true }));
  if (!order) return response.status(404).json({ message: 'الأوردر غير موجود' });
  response.json(order);
}

export async function confirmOrder(request, response) {
  const session = await mongoose.startSession();
  try {
    let saved;
    await session.withTransaction(async () => {
      const order = await Order.findById(request.params.id).session(session);
      if (!order) throw Object.assign(new Error('الفاتورة غير موجودة'), { status: 404 });
      if (order.status !== 'new') throw Object.assign(new Error('تم اتخاذ إجراء على الفاتورة بالفعل'), { status: 400 });
      const lines = order.items?.length ? order.items : [{ laptop: order.laptop, quantity: order.quantity }];
      for (const line of lines) {
        const result = await Laptop.updateOne({ _id: line.laptop, quantity: { $gte: line.quantity } }, { $inc: { quantity: -line.quantity } }, { session });
        if (!result.modifiedCount) throw Object.assign(new Error(`الكمية غير متاحة للبند: ${line.product || order.product}`), { status: 400 });
      }
      order.status = 'confirmed'; order.confirmedAt = new Date();
      await order.save({ session }); saved = order.id;
    });
    response.json(await populated(Order.findById(saved)));
  } finally { await session.endSession(); }
}

export async function rejectOrder(request, response) {
  const order = await Order.findOneAndUpdate({ _id: request.params.id, status: 'new' }, { status: 'rejected' }, { new: true });
  if (!order) return response.status(400).json({ message: 'الفاتورة غير موجودة أو تم اتخاذ إجراء عليها' });
  response.json(await populated(Order.findById(order.id)));
}
