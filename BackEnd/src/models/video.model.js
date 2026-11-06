import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    videoFile: { type: String, required: true },
    thumbnail: { type: String, required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", maxlength: 5000 },
    duration: { type: Number, required: true, min: 0 },
    views: { type: Number, default: 0, min: 0 },
    // Legacy: unique viewers used to be embedded here (unbounded array). Views now live in the
    // `views` collection; the field is kept hidden so old documents never leak viewer ids.
    viewers: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], select: false },
    likes: { type: Number, default: 0, min: 0 }, // denormalised counter kept in sync by the like service
    isPublished: { type: Boolean, default: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

videoSchema.index({ isPublished: 1, createdAt: -1 });
videoSchema.index({ owner: 1, createdAt: -1 });
videoSchema.index({ isPublished: 1, views: -1 });
videoSchema.index({ title: "text", description: "text" }, { weights: { title: 5, description: 1 } });

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
