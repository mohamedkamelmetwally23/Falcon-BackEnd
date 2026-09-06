import Laptop from "../models/Laptop.js";

const fileToDataUrl = (file) =>
  `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

const cleanLaptop = (item, image = item.image || "") => ({
  brand: item.brand || "غير محدد",
  model: item.model,
  processor: item.processor,
  generation: item.generation || "",
  processorType: item.processorType || "",
  ram: item.ram || "",
  storage: item.storage || "",
  graphics: item.graphics || "",
  listName: item.listName || "",
  image,
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
    .sort({ createdAt: -1 })
    .maxTimeMS(10000)
    .lean();
  response.json(
    laptops.map((laptop) => ({
      ...laptop,
      id: laptop._id.toString(),
      oldPrice: Number(laptop.oldPrice) || 0,
      price: Number(laptop.price) || 0,
      imageUrl: laptop.image ? `/api/catalog/laptops/${laptop._id}/image` : "",
      image: undefined,
      _id: undefined,
    })),
  );
}

export async function getCatalogLaptopImage(request, response) {
  const laptop = await Laptop.findOne({
    _id: request.params.id,
    quantity: { $gt: 0 },
  })
    .select("image")
    .lean();
  if (!laptop?.image) return response.status(404).end();
  const match = laptop.image.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!match) return response.status(404).end();
  response.type(match[1]).send(Buffer.from(match[2], "base64"));
}

export async function createLaptop(request, response) {
  const image = request.file
    ? fileToDataUrl(request.file)
    : request.body.image || "";
  const laptop = await Laptop.create(cleanLaptop(request.body, image));
  response.status(201).json(laptop);
}

export async function updateLaptop(request, response) {
  const existing = await Laptop.findById(request.params.id);
  if (!existing)
    return response.status(404).json({ message: "الجهاز غير موجود" });
  const image = request.file
    ? fileToDataUrl(request.file)
    : existing.image;
  const laptop = await Laptop.findOneAndUpdate(
    { _id: request.params.id },
    cleanLaptop(request.body, image),
    { new: true, runValidators: true },
  );
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
