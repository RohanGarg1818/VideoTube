import { Router } from 'express';
import {
  addComment,
  getAllVideoComments,
  updateComment,
  deleteComment
} from '../controllers/comment.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/:videoId', getAllVideoComments);
router.post('/add/:channelId/:videoId', verifyJWT, addComment);
router.patch('/:commentId', verifyJWT, updateComment);
router.delete('/:commentId', verifyJWT, deleteComment);

export default router;