import { Router } from "express";
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { paginated } from "../validators/social.validator.js";

const router = Router();

router.use(verifyJWT);
router.get("/stats", getChannelStats);
router.get("/videos", validate(paginated), getChannelVideos);

export default router;
