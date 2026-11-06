import { Router } from "express";
import {
  createPlaylist,
  addVideos,
  getPlaylist,
  getUserPlaylist,
  updatePlaylist,
  deletePlaylist,
  removePlaylistVideo,
} from "../controllers/playlist.controller.js";
import { verifyJWT, optionalVerifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createPlaylistSchema,
  playlistIdParams,
  playlistVideoParams,
  updatePlaylistSchema,
  userIdParams,
} from "../validators/social.validator.js";

const router = Router();

router.post("/", verifyJWT, validate(createPlaylistSchema), createPlaylist);
router.post("/add/:playlistId/:videoId", verifyJWT, validate(playlistVideoParams), addVideos);
router.get("/user/:userId", optionalVerifyJWT, validate(userIdParams), getUserPlaylist);
router.get("/:playlistId", optionalVerifyJWT, validate(playlistIdParams), getPlaylist);
router.patch("/:playlistId", verifyJWT, validate(updatePlaylistSchema), updatePlaylist);
router.delete("/:playlistId", verifyJWT, validate(playlistIdParams), deletePlaylist);
router.delete("/:playlistId/:videoId", verifyJWT, validate(playlistVideoParams), removePlaylistVideo);

export default router;
