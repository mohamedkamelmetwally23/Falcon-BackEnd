import mongoose from 'mongoose';
import Laptop from '../models/Laptop.js';
import Order from '../models/Order.js';
import Return from '../models/Return.js';

const populated = query => query.populate('order', 'customerName invoiceDate').populate('createdBy', 'name').sort({ createdAt: -1 });

export async function listReturns(_request, response) {
  response.json(await populated(Return.find()));
}

export async function createReturn(request, response) {
  const quantity = Number(request.body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) return response.status(400).json({ message: 'الكمية المرتجعة غير صحيحة' });
  const session = await mongoose.startSession();
  try {
    let returnId;
    await session.withTransaction(async () => {
      const order = await Order.findOne({ _id: request.body.orderId, status: { $in: ['confirmed', 'returned'] } }).session(session);
      if (!order) throw Object.assign(new Error('الفاتورة غير موجودة أو لم يتم تأكيدها'), { status: 400 });
      const line = order.items.id(request.body.orderItemId);
      if (!line) throw Object.assign(new Error('البند غير موجود في الفاتورة'), { status: 404 });
      const returned = await Return.aggregate([{ $match: { order: order._id, orderItem: line._id } }, { $group: { _id: null, total: { $sum: '$quantity' } } }]).session(session);
      const remaining = line.quantity - (returned[0]?.total || 0);
      if (quantity > remaining) throw Object.assign(new Error(`المتاح للإرجاع من هذا البند: ${remaining}`), { status: 400 });
      await Laptop.updateOne({ _id: line.laptop }, { $inc: { quantity } }, { session });
      order.status = 'returned';
      await order.save({ session });
      const [created] = await Return.create([{ order: order.id, orderItem: line._id, laptop: line.laptop, product: line.product, quantity, reason: String(request.body.reason || '').trim().slice(0, 500), createdBy: request.user.id }], { session });
      returnId = created.id;
    });
    response.status(201).json(await populated(Return.findById(returnId)));
  } finally { await session.endSession(); }
}
