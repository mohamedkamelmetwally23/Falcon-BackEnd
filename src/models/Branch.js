import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true, lowercase: true },
  active: { type: Boolean, default: true },
}, { timestamps: true, versionKey: false });

branchSchema.set('toJSON', {
  transform: (_document, value) => {
    value.id = value._id.toString();
    delete value._id;
  },
});

export const defaultBranches = [
  { name: 'الإمارات', code: 'emirates' },
  { name: 'مخزن طنطا', code: 'tanta-warehouse' },
  { name: 'عمر أبو سمرة', code: 'omar-abou-samra' },
  { name: 'القاهرة', code: 'cairo' },
];

export default mongoose.model('Branch', branchSchema);
