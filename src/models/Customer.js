import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true, index: true },
    amount: { type: Number, min: 0, required: true },
    note: { type: String, trim: true, maxlength: 300, default: "" },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    phone: { type: String, trim: true, maxlength: 40, default: "" },
    address: { type: String, trim: true, maxlength: 300, default: "" },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
    totalInvoiced: { type: Number, min: 0, default: 0 },
    totalPaid: { type: Number, min: 0, default: 0 },
    payments: [paymentSchema],
  },
  { timestamps: true, versionKey: false },
);

customerSchema.set("toJSON", {
  transform: (_doc, value) => {
    value.id = value._id.toString();
    delete value._id;
    value.balance = Math.max(0, value.totalInvoiced - value.totalPaid);
  },
});

export default mongoose.model("Customer", customerSchema);
