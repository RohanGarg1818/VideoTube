import { Router } from 'express';
import {
  createCommunityPost,
  getAllCommunityPost,
  getChannelPost,
  updatePost,
  deletePost
} from '../controllers/community.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', verifyJWT, createCommunityPost);
router.get('/', getAllCommunityPost);
router.get('/:channelId', getChannelPost);
router.patch('/:postId', verifyJWT, updatePost);
router.delete('/:postId', verifyJWT, deletePost);

export default router;