import { Router } from 'express';
import {
  getAllVideos,
  publishVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  toggleIsPublished,
  viewVideo
} from '../controllers/video.controller.js';
import { verifyJWT, optionalVerifyJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

router.get('/', getAllVideos);
router.post('/publish', verifyJWT, upload.fields([
  { name: 'videoFile', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), publishVideo);
router.patch('/:videoId/toggle-publish', verifyJWT, toggleIsPublished);
router.patch('/:videoId/view', optionalVerifyJWT, viewVideo);
router.patch('/:videoId', verifyJWT, upload.single('thumbnail'), updateVideo);
router.delete('/:videoId', verifyJWT, deleteVideo);
router.get('/:videoId', getVideoById);

export default router;