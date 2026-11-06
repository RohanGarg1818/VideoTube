import { Router } from "express";
import {
  toggleVideoLike,
  getVideoLikeStatus,
  toggleCommentLike,
  toggleCommunityPostLike,
  getAllLikedVideos,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { likeCommentParams, likePostParams, likeVideoParams, paginated } from "../validators/social.validator.js";

const router = Router();

router.use(verifyJWT);

router.get("/videos", validate(paginated), getAllLikedVideos);
router.post("/video/:videoId", validate(likeVideoParams), toggleVideoLike);
router.get("/video/:videoId", validate(likeVideoParams), getVideoLikeStatus);
router.post("/comment/:commentId", validate(likeCommentParams), toggleCommentLike);
router.post("/community/:postId", validate(likePostParams), toggleCommunityPostLike);

export default router;
