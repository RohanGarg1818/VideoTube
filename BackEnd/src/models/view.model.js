import mongoose, { Schema } from "mongoose";

/** One document per (video, viewer) pair → unique views are enforced by the database. */
const viewSchema = new Schema(
  {
    video: { type: Schema.Types.ObjectId, ref: "Video", required: true },
    viewer: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

viewSchema.index({ video: 1, viewer: 1 }, { unique: true });

export const View = mongoose.model("View", viewSchema);
