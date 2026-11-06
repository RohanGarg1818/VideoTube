import mongoose, { Schema } from "mongoose";

const communitySchema = new Schema(
  {
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

communitySchema.index({ owner: 1, createdAt: -1 });
communitySchema.index({ createdAt: -1 });

export const Community = mongoose.model("Community", communitySchema);
