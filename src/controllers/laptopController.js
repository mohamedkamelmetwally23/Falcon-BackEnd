import Laptop from "../models/Laptop.js";

const cleanLaptop = (item) => ({
  brand: item.brand || "غير محدد",
  model: item.model,
  processor: item.processor,
  generation: item.generation || "",
  processorType: item.processorType || "",
  ram: item.ram || "",
  storage: item.storage || "",
  graphics: item.graphics || "",
  listName: item.listName || "",
  image: item.image || "",
  cost: Number(item.cost) || 0,
  oldPrice: Number(item.oldPrice) || 0,
  price: Number(item.price),
  quantity: Number(item.quantity),
});

export async function listLaptops(request, response) {
  const laptops = await Laptop.find().sort({
    createdAt: -1,
  });
  response.json(laptops);
}

export async function listCatalogLaptops(_request, response) {
  const laptops = await Laptop.find({ quantity: { $gt: 0 } })
    .select(
      "brand model processor generation processorType ram storage graphics image oldPrice price quantity condition",
    )
    .sort({ createdAt: -1 });
  response.json(laptops);
}

export async function createLaptop(request, response) {
  const laptop = await Laptop.create(cleanLaptop(request.body));
  response.status(201).json(laptop);
}

export async function updateLaptop(request, response) {
  const laptop = await Laptop.findOneAndUpdate(
    { _id: request.params.id },
    cleanLaptop(request.body),
    { new: true, runValidators: true },
  );
  if (!laptop)
    return response.status(404).json({ message: "الجهاز غير موجود" });
  response.json(laptop);
}

export async function deleteLaptop(request, response) {
  const laptop = await Laptop.findOneAndDelete({
    _id: request.params.id,
  });
  if (!laptop)
    return response.status(404).json({ message: "الجهاز غير موجود" });
  response.status(204).end();
}

export async function importLaptops(request, response) {
  const laptops = request.body.laptops;
  if (!Array.isArray(laptops) || !laptops.length)
    return response
      .status(400)
      .json({ message: "ملف Excel لا يحتوي على أجهزة صالحة" });
  const cleaned = laptops.map((item) => cleanLaptop(item));
  await Promise.all(cleaned.map((item) => new Laptop(item).validate()));
  const inserted = await Laptop.insertMany(cleaned);
  response.status(201).json(inserted);
}
