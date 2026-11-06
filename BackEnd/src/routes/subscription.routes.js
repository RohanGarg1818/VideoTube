import { Router } from "express";
import {
  toggleSubscription,
  getChannelSubscriber,
  getSubscribedChannels,
  getSubscriptionFeed,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { paginationQuery } from "../validators/common.js";
import { channelIdParams, paginated } from "../validators/social.validator.js";

const router = Router();

router.use(verifyJWT);

router.get("/feed", validate(paginated), getSubscriptionFeed);
router.post("/:channelId", validate(channelIdParams), toggleSubscription);
router.get("/channel/:channelId", validate({ ...channelIdParams, query: paginationQuery }), getChannelSubscriber);
router.get("/user/:channelId", validate(channelIdParams), getSubscribedChannels);

export default router;
