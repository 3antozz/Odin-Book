const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const fns = require('./fns');
const controller = require('../controllers/followage')

const router = Router();

router.post('/send/:receiverId', fns.checkAuth, asyncHandler(controller.sendRequest))

router.post('/accept/:senderId', fns.checkAuth, asyncHandler(controller.acceptRequest))

router.delete('/reject/:senderId', fns.checkAuth, asyncHandler(controller.rejectRequest))

router.delete('/cancel-request/:receiverId', fns.checkAuth, asyncHandler(controller.cancelRequest))

router.delete('/unfollow/:userId', fns.checkAuth, asyncHandler(controller.unfollow))

router.delete('/remove-follower/:userId', fns.checkAuth, asyncHandler(controller.removeFollower))

router.get('/:userId/following', asyncHandler(controller.getFollowing))

router.get('/:userId/followers', asyncHandler(controller.getFollowers))


module.exports = router;