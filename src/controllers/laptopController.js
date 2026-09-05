import Laptop from '../models/Laptop.js';

const cleanLaptop = (item, branch) => ({
  branch,
  brand: item.brand || 'غير محدد',
  model: item.model,
  processor: item.processor,
  generation: item.generation || '',
  processorType: item.processorType || '',
  ram: item.ram || '',
  storage: item.storage || '',
  graphics: item.graphics || '',
  listName: item.listName || '',
  cost: Number(item.cost) || 0,
  price: Number(item.price),
  quantity: Number(item.quantity),
});

export async function listLaptops(request, response) {
  const laptops = await Laptop.find({ branch: request.branchId }).sort({ createdAt: -1 });
  response.json(laptops);
}

export async function createLaptop(request, response) {
  const laptop = await Laptop.create(cleanLaptop(request.body, request.branchId));
  response.status(201).json(laptop);
}

export async function updateLaptop(request, response) {
  const laptop = await Laptop.findOneAndUpdate({ _id: request.params.id, branch: request.branchId }, cleanLaptop(request.body, request.branchId), { new: true, runValidators: true });
  if (!laptop) return response.status(404).json({ message: 'الجهاز غير موجود' });
  response.json(laptop);
}

export async function deleteLaptop(request, response) {
  const laptop = await Laptop.findOneAndDelete({ _id: request.params.id, branch: request.branchId });
  if (!laptop) return response.status(404).json({ message: 'الجهاز غير موجود' });
  response.status(204).end();
}

export async function importLaptops(request, response) {
  const laptops = request.body.laptops;
  if (!Array.isArray(laptops) || !laptops.length) return response.status(400).json({ message: 'ملف Excel لا يحتوي على أجهزة صالحة' });
  const cleaned = laptops.map(item => cleanLaptop(item, request.branchId));
  await Promise.all(cleaned.map(item => new Laptop(item).validate()));
  const inserted = await Laptop.insertMany(cleaned);
  response.status(201).json(inserted);
}
