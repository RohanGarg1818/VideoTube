import { Router } from "express";
import {
  createCommunityPost,
  getAllCommunityPost,
  getChannelPost,
  updatePost,
  deletePost,
} from "../controllers/community.controller.js";
import { verifyJWT, optionalVerifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  channelFeedSchema,
  communityPostSchema,
  feedSchema,
  postIdParams,
  updatePostSchema,
} from "../validators/social.validator.js";

const router = Router();

router.post("/", verifyJWT, validate(communityPostSchema), createCommunityPost);
router.get("/", optionalVerifyJWT, validate(feedSchema), getAllCommunityPost);
router.get("/:channelId", optionalVerifyJWT, validate(channelFeedSchema), getChannelPost);
router.patch("/:postId", verifyJWT, validate(updatePostSchema), updatePost);
router.delete("/:postId", verifyJWT, validate(postIdParams), deletePost);

export default router;
