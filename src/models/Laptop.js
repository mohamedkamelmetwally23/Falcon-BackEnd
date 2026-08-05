import mongoose from 'mongoose';

const laptopSchema = new mongoose.Schema({
  brand: { type: String, trim: true, default: 'غير محدد' },
  model: { type: String, trim: true, required: true },
  processor: { type: String, trim: true, required: true },
  ram: { type: String, trim: true, default: '' },
  storage: { type: String, trim: true, default: '' },
  price: { type: Number, min: 0, required: true },
  quantity: { type: Number, min: 0, required: true },
}, { timestamps: true, versionKey: false });

laptopSchema.set('toJSON', {
  transform: (_document, value) => {
    value.id = value._id.toString();
    delete value._id;
    return value;
  },
});

export default mongoose.model('Laptop', laptopSchema);
