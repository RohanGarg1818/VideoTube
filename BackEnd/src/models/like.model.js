import mongoose, { Schema } from "mongoose";

/**
 * A polymorphic "like" – exactly one of video / comment / community is set.
 * Partial unique indexes make double-likes impossible even under concurrent requests.
 */
const likeSchema = new Schema(
  {
    video: { type: Schema.Types.ObjectId, ref: "Video" },
    comment: { type: Schema.Types.ObjectId, ref: "Comment" },
    community: { type: Schema.Types.ObjectId, ref: "Community" },
    tweet: { type: Schema.Types.ObjectId, ref: "Tweet" }, // legacy
    likedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

for (const target of ["video", "comment", "community"]) {
  likeSchema.index(
    { likedBy: 1, [target]: 1 },
    { unique: true, partialFilterExpression: { [target]: { $type: "objectId" } } }
  );
  likeSchema.index({ [target]: 1 }, { partialFilterExpression: { [target]: { $type: "objectId" } } });
}

export const Like = mongoose.model("Like", likeSchema);
