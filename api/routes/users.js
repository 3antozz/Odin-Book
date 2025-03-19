const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const fns = require('./fns');
const controller = require('../controllers/users')

const router = Router();



router.get('/me', fns.checkAuth, asyncHandler(controller.getClient))


module.exports = router;