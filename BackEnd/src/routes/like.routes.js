import { Router } from 'express';
import {
  toggleVideoLike,
  getVideoLikeStatus,
  toggelCommentLike,
  toggleCommunityPostLike,
  getAllLikedVideos
} from '../controllers/like.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/video/:videoId', verifyJWT, toggleVideoLike);
router.get('/video/:videoId', verifyJWT, getVideoLikeStatus);
router.post('/comment/:commentId', verifyJWT, toggelCommentLike);
router.post('/community/:postId', verifyJWT, toggleCommunityPostLike);
router.get('/videos', verifyJWT, getAllLikedVideos);

export default router;