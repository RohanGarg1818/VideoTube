import { Router } from "express";
import {
  getAllVideos,
  publishVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  toggleIsPublished,
  viewVideo,
  getRelatedVideos,
} from "../controllers/video.controller.js";
import { verifyJWT, optionalVerifyJWT } from "../middlewares/auth.middleware.js";
import { upload, limitImageSize } from "../middlewares/upload.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  listVideosSchema,
  publishVideoSchema,
  updateVideoSchema,
  videoIdParams,
} from "../validators/video.validator.js";

const router = Router();

router.get("/", optionalVerifyJWT, validate(listVideosSchema), getAllVideos);
router.post(
  "/publish",
  verifyJWT,
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  limitImageSize,
  validate(publishVideoSchema),
  publishVideo
);
router.get("/:videoId/related", optionalVerifyJWT, validate(videoIdParams), getRelatedVideos);
router.patch("/:videoId/toggle-publish", verifyJWT, validate(videoIdParams), toggleIsPublished);
router.patch("/:videoId/view", optionalVerifyJWT, validate(videoIdParams), viewVideo);
router.patch(
  "/:videoId",
  verifyJWT,
  upload.single("thumbnail"),
  limitImageSize,
  validate(updateVideoSchema),
  updateVideo
);
router.delete("/:videoId", verifyJWT, validate(videoIdParams), deleteVideo);
router.get("/:videoId", optionalVerifyJWT, validate(videoIdParams), getVideoById);

export default router;
