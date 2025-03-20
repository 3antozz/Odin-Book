const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const fns = require('./fns');
const controller = require('../controllers/users')

const router = Router();



router.get('/me', fns.checkAuth, asyncHandler(controller.getClient))

router.get('/all', fns.checkAuth, asyncHandler(controller.getAllUsers))

router.get('/:userId', fns.checkAuth, asyncHandler(controller.getProfile))


module.exports = router;