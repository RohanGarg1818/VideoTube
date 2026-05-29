import { Router } from 'express';
import {
  createPlaylist,
  addVideos,
  getPlaylist,
  getUserPlaylist,
  updatePlaylist,
  deletePlaylist,
  removePlaylistVideo
} from '../controllers/playlist.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', verifyJWT, createPlaylist);
router.post('/add/:playlistId/:videoId', verifyJWT, addVideos);
router.get('/user/:userId', getUserPlaylist);
router.get('/:playlistId', getPlaylist);
router.patch('/:playlistId', verifyJWT, updatePlaylist);
router.delete('/:playlistId', verifyJWT, deletePlaylist);
router.delete('/:playlistId/:videoId', verifyJWT, removePlaylistVideo);

export default router;
