import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  clearWatchHistory,
  removeFromWatchHistory,
} from "../controllers/user.controller.js";
import { verifyJWT, optionalVerifyJWT } from "../middlewares/auth.middleware.js";
import { upload, limitImageSize } from "../middlewares/upload.middleware.js";
import { authLimiter } from "../middlewares/rateLimit.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
  updateAccountSchema,
  channelSchema,
} from "../validators/user.validator.js";
import { idParams } from "../validators/common.js";

const router = Router();

// Public auth
router.post(
  "/register",
  authLimiter,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  limitImageSize,
  validate(registerSchema),
  registerUser
);
router.post("/login", authLimiter, validate(loginSchema), loginUser);
router.post("/refresh-token", authLimiter, validate(refreshSchema), refreshAccessToken);

// Authenticated
router.post("/logout", verifyJWT, logoutUser);
router.post("/change-password", verifyJWT, authLimiter, validate(changePasswordSchema), changeCurrentPassword);
router.get("/current-user", verifyJWT, getCurrentUser);
router.patch("/update-account", verifyJWT, validate(updateAccountSchema), updateAccountDetails);
router.patch("/avatar", verifyJWT, upload.single("avatar"), limitImageSize, updateUserAvatar);
router.patch("/cover-image", verifyJWT, upload.single("coverImage"), limitImageSize, updateUserCoverImage);
router.get("/watch-history", verifyJWT, getWatchHistory);
router.delete("/watch-history", verifyJWT, clearWatchHistory);
router.delete("/watch-history/:videoId", verifyJWT, validate({ params: idParams("videoId") }), removeFromWatchHistory);

// Public channel profile (personalised `isSubscribed` when signed in)
router.get("/c/:username", optionalVerifyJWT, validate(channelSchema), getUserChannelProfile);

export default router;
