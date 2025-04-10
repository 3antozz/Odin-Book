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

router.delete('/remove-follower', fns.checkAuth, asyncHandler(controller.removeFollower))


module.exports = router;