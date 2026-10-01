import mongoose from "mongoose";

const vauletMemberSchema = new mongoose.Schema(
  {
    vaulet: { type: mongoose.Schema.Types.ObjectId, ref: "Vaulet", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["owner", "member"], default: "member", required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

vauletMemberSchema.index({ vaulet: 1, user: 1 }, { unique: true });
vauletMemberSchema.index({ user: 1, joinedAt: -1 });

export default mongoose.model("VauletMember", vauletMemberSchema);
