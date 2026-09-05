import Laptop from "../models/Laptop.js";
import Order from "../models/Order.js";
import mongoose from "mongoose";
import Return from "../models/Return.js";
import Customer from "../models/Customer.js";

const populated = (query) =>
  query
    .populate("user", "name")
    .populate("items.laptop", "model brand processor ram storage")
    .populate("laptop", "model brand processor ram storage");

export async function createOrder(request, response) {
  const customerName = request.body.customerName?.trim();
  if (!customerName)
    return response.status(400).json({ message: "اسم العميل مطلوب" });
  const invoiceDate = request.body.invoiceDate
    ? new Date(request.body.invoiceDate)
    : new Date();
  if (Number.isNaN(invoiceDate.getTime()))
    return response.status(400).json({ message: "تاريخ الفاتورة غير صحيح" });
  const notes = String(request.body.notes || "")
    .trim()
    .slice(0, 1000);
  const customer = await Customer.findOne({ _id: request.body.customerId, branch: request.branchId });
  if (!customer)
    return response.status(400).json({ message: "يجب اختيار عميل صحيح" });
  const paidAmount = Number(request.body.paidAmount || 0);
  if (!Number.isFinite(paidAmount) || paidAmount < 0)
    return response.status(400).json({ message: "المبلغ المدفوع غير صحيح" });
  const requested = Array.isArray(request.body.items)
    ? request.body.items
    : [{ laptopId: request.body.laptopId, quantity: request.body.quantity }];
  if (!requested.length)
    return response
      .status(400)
      .json({ message: "يجب إضافة بند واحد على الأقل" });
  const ids = requested.map((item) => item.laptopId);
  if (new Set(ids).size !== ids.length)
    return response
      .status(400)
      .json({ message: "لا يمكن تكرار نفس الجهاز في أكثر من بند" });
  const laptops = await Laptop.find({ _id: { $in: ids }, branch: request.branchId });
  if (laptops.length !== ids.length)
    return response.status(404).json({ message: "أحد الأجهزة غير موجود" });
  const items = requested.map((requestedItem) => {
    const laptop = laptops.find((entry) => entry.id === requestedItem.laptopId);
    const quantity = Number(requestedItem.quantity);
    if (!Number.isInteger(quantity) || quantity < 1)
      throw Object.assign(new Error("الكمية غير صحيحة"), { status: 400 });
    if (quantity > laptop.quantity)
      throw Object.assign(
        new Error(`الكمية المطلوبة من ${laptop.model} غير متاحة`),
        { status: 400 },
      );
    return {
      laptop: laptop.id,
      product: `${laptop.brand} ${laptop.model}`.trim(),
      quantity,
      originalUnitPrice: laptop.price,
      unitPrice: laptop.price,
      lineTotal: laptop.price * quantity,
    };
  });
  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
  if (paidAmount > total)
    return response
      .status(400)
      .json({ message: "المبلغ المدفوع أكبر من إجمالي الفاتورة" });
  const order = await Order.create({
    branch: request.branchId,
    user: request.user.id,
    customer: customer.id,
    customerName: customer.name,
    paidAmount,
    invoiceDate,
    notes,
    items,
    total,
  });
  response.status(201).json(await populated(Order.findById(order.id)));
}
export async function listOrders(request, response) {
  const returnedOrderIds = await Return.distinct("order", { branch: request.branchId });
  if (returnedOrderIds.length)
    await Order.updateMany(
      { _id: { $in: returnedOrderIds }, branch: request.branchId, status: "confirmed" },
      { status: "returned" },
    );
  const filter = { branch: request.branchId };
  if (request.user.role === "employee") filter.user = request.user.id;
  response.json(await populated(Order.find(filter).sort({ createdAt: -1 })));
}
export async function updateOrderStatus(request, response) {
  const allowed = ["new", "preparing", "delivered", "cancelled"];
  if (!allowed.includes(request.body.status))
    return response.status(400).json({ message: "حالة الأوردر غير صحيحة" });
  const order = await populated(
    Order.findOneAndUpdate(
      { _id: request.params.id, branch: request.branchId },
      { status: request.body.status },
      { new: true },
    ),
  );
  if (!order)
    return response.status(404).json({ message: "الأوردر غير موجود" });
  response.json(order);
}

export async function confirmOrder(request, response) {
  const session = await mongoose.startSession();
  try {
    let saved;
    await session.withTransaction(async () => {
      const order = await Order.findOne({ _id: request.params.id, branch: request.branchId }).session(session);
      if (!order)
        throw Object.assign(new Error("الفاتورة غير موجودة"), { status: 404 });
      if (order.status !== "new")
        throw Object.assign(new Error("تم اتخاذ إجراء على الفاتورة بالفعل"), {
          status: 400,
        });
      const lines = order.items?.length
        ? order.items
        : [{ laptop: order.laptop, quantity: order.quantity }];
      const serialNumbers = Array.isArray(request.body.serialNumbers)
        ? request.body.serialNumbers
        : [];
      const salePrices = Array.isArray(request.body.salePrices)
        ? request.body.salePrices
        : [];
      for (const entry of serialNumbers) {
        const line = order.items.id(entry.itemId);
        if (line)
          line.serialNumber = String(entry.serialNumber || "")
            .trim()
            .slice(0, 120);
      }
      for (const entry of salePrices) {
        const line = order.items.id(entry.itemId);
        if (
          !line ||
          entry.price === "" ||
          entry.price === null ||
          entry.price === undefined
        )
          continue;
        const price = Number(entry.price);
        if (!Number.isFinite(price) || price < 0)
          throw Object.assign(new Error("سعر البيع غير صحيح"), { status: 400 });
        line.unitPrice = price;
        line.lineTotal = price * line.quantity;
      }
      order.total = order.items?.length
        ? order.items.reduce((sum, line) => sum + line.lineTotal, 0)
        : order.total;
      for (const line of lines) {
        const result = await Laptop.updateOne(
          { _id: line.laptop, branch: request.branchId, quantity: { $gte: line.quantity } },
          { $inc: { quantity: -line.quantity } },
          { session },
        );
        if (!result.modifiedCount)
          throw Object.assign(
            new Error(
              `الكمية غير متاحة للبند: ${line.product || order.product}`,
            ),
            { status: 400 },
          );
      }
      order.status = "confirmed";
      order.confirmedAt = new Date();
      if (order.customer) {
        const customer = await Customer.findOne({ _id: order.customer, branch: request.branchId }).session(
          session,
        );
        if (customer) {
          customer.totalInvoiced += order.total;
          customer.totalPaid += order.paidAmount || 0;
          if (order.paidAmount)
            customer.payments.push({
              amount: order.paidAmount,
              order: order.id,
              note: "دفعة عند تأكيد الفاتورة",
              createdBy: request.user.id,
            });
          await customer.save({ session });
        }
      }
      await order.save({ session });
      saved = order.id;
    });
    response.json(await populated(Order.findOne({ _id: saved, branch: request.branchId })));
  } finally {
    await session.endSession();
  }
}

export async function rejectOrder(request, response) {
  const order = await Order.findOneAndUpdate(
    { _id: request.params.id, branch: request.branchId, status: "new" },
    { status: "rejected" },
    { new: true },
  );
  if (!order)
    return response
      .status(400)
      .json({ message: "الفاتورة غير موجودة أو تم اتخاذ إجراء عليها" });
  response.json(await populated(Order.findOne({ _id: order.id, branch: request.branchId })));
}
