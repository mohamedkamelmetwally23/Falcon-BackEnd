import Customer from "../models/Customer.js";

const clean = (body) => ({
  name: String(body.name || "")
    .trim()
    .slice(0, 150),
  phone: String(body.phone || "")
    .trim()
    .slice(0, 40),
  address: String(body.address || "")
    .trim()
    .slice(0, 300),
  notes: String(body.notes || "")
    .trim()
    .slice(0, 500),
});

export async function listCustomers(request, response) {
  response.json(await Customer.find().sort({ name: 1 }));
}

export async function createCustomer(request, response) {
  const data = clean(request.body);
  if (!data.name)
    return response.status(400).json({ message: "اسم العميل مطلوب" });
  response.status(201).json(await Customer.create(data));
}

export async function updateCustomer(request, response) {
  const data = clean(request.body);
  if (!data.name)
    return response.status(400).json({ message: "اسم العميل مطلوب" });
  const customer = await Customer.findOneAndUpdate(
    { _id: request.params.id },
    data,
    {
      new: true,
      runValidators: true,
    },
  );
  if (!customer)
    return response.status(404).json({ message: "العميل غير موجود" });
  response.json(customer);
}

export async function addPayment(request, response) {
  const amount = Number(request.body.amount);
  if (!Number.isFinite(amount) || amount <= 0)
    return response.status(400).json({ message: "قيمة الدفعة غير صحيحة" });
  const customer = await Customer.findOne({ _id: request.params.id });
  if (!customer)
    return response.status(404).json({ message: "العميل غير موجود" });
  const balance = Math.max(0, customer.totalInvoiced - customer.totalPaid);
  if (amount > balance)
    return response
      .status(400)
      .json({ message: "قيمة الدفعة أكبر من المبلغ المتبقي" });
  customer.totalPaid += amount;
  customer.payments.push({
    amount,
    note: String(request.body.note || "")
      .trim()
      .slice(0, 300),
    createdBy: request.user.id,
  });
  await customer.save();
  response.json(customer);
}
