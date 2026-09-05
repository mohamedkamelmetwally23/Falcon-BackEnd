import mongoose from 'mongoose';

const returnSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  orderItem: { type: mongoose.Schema.Types.ObjectId, required: true },
  laptop: { type: mongoose.Schema.Types.ObjectId, ref: 'Laptop', required: true },
  product: { type: String, required: true },
  quantity: { type: Number, min: 1, required: true },
  reason: { type: String, trim: true, maxlength: 500, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, versionKey: false });
returnSchema.set('toJSON', { transform: (_doc, value) => { value.id = value._id.toString(); delete value._id; } });
export default mongoose.model('Return', returnSchema);
