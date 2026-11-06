import { Router } from "express";
import { addComment, getAllVideoComments, updateComment, deleteComment } from "../controllers/comment.controller.js";
import { verifyJWT, optionalVerifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  addCommentSchema,
  commentIdParams,
  listCommentsSchema,
  updateCommentSchema,
} from "../validators/social.validator.js";

const router = Router();

router.get("/:videoId", optionalVerifyJWT, validate(listCommentsSchema), getAllVideoComments);
router.post("/:videoId", verifyJWT, validate(addCommentSchema), addComment);
// Legacy route kept for backwards compatibility (channelId is ignored)
router.post("/add/:channelId/:videoId", verifyJWT, validate(addCommentSchema), addComment);
router.patch("/:commentId", verifyJWT, validate(updateCommentSchema), updateComment);
router.delete("/:commentId", verifyJWT, validate(commentIdParams), deleteComment);

export default router;
