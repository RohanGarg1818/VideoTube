import { Router } from 'express';
import {
  toggleSubscription,
  getChannelSubscriber,
  getSubscribedChannels
} from '../controllers/subscription.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/:channelId', verifyJWT, toggleSubscription);
router.get('/channel/:channelId', verifyJWT, getChannelSubscriber);
router.get('/user/:channelId', verifyJWT, getSubscribedChannels);

export default router;