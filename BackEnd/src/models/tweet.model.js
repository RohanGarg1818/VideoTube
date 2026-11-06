import mongoose, { Schema } from "mongoose";

// Legacy model – superseded by `Community`. Kept so old documents remain readable.
const tweetSchema = new Schema(
  {
    content: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Tweet = mongoose.model("Tweet", tweetSchema);
