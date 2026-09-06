import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    phone: { type: String, trim: true, maxlength: 30, default: "" },
    email: { type: String, sparse: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: {
      type: String,
      enum: ["super_admin", "admin", "employee"],
      default: "employee",
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);

userSchema.pre("save", async function hashPassword() {
  if (this.isModified("password"))
    this.password = await bcrypt.hash(this.password, 12);
});
userSchema.methods.checkPassword = function checkPassword(password) {
  return bcrypt.compare(password, this.password);
};
userSchema.set("toJSON", {
  transform: (_doc, value) => {
    value.id = value._id.toString();
    delete value._id;
    delete value.password;
    delete value.email;
  },
});

export default mongoose.model("User", userSchema);
