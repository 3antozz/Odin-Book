const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const fns = require('./fns');
const controller = require('../controllers/followage')

const router = Router();

router.post('/send', fns.checkAuth, asyncHandler(controller.sendRequest))

router.put('/accept', fns.checkAuth, asyncHandler(controller.acceptRequest))

router.delete('/reject', fns.checkAuth, asyncHandler(controller.rejectRequest))

router.delete('/unfollow', fns.checkAuth, asyncHandler(controller.unfollow))

router.delete('/remove-follower', fns.checkAuth, asyncHandler(controller.removeFollower))


module.exports = router;