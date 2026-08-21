import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    customerName: { type: String, required: true, trim: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    paidAmount: { type: Number, min: 0, default: 0 },
    invoiceDate: { type: Date, required: true },
    notes: { type: String, trim: true, maxlength: 1000, default: "" },
    items: [
      {
        laptop: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Laptop",
          required: true,
        },
        product: { type: String, required: true },
        originalUnitPrice: { type: Number, min: 0 },
        serialNumber: { type: String, trim: true, maxlength: 120, default: "" },
        quantity: { type: Number, min: 1, required: true },
        unitPrice: { type: Number, min: 0, required: true },
        lineTotal: { type: Number, min: 0, required: true },
      },
    ],
    laptop: { type: mongoose.Schema.Types.ObjectId, ref: "Laptop" },
    product: { type: String },
    quantity: { type: Number, min: 1 },
    unitPrice: { type: Number, min: 0 },
    total: { type: Number, min: 0, required: true },
    status: {
      type: String,
      enum: [
        "new",
        "confirmed",
        "returned",
        "rejected",
        "preparing",
        "delivered",
        "cancelled",
      ],
      default: "new",
    },
    confirmedAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);
orderSchema.set("toJSON", {
  transform: (_doc, value) => {
    value.id = value._id.toString();
    delete value._id;
  },
});

export default mongoose.model("Order", orderSchema);
