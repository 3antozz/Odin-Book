const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const fns = require('./fns');
const { upload } = require('./uploadConfig')
const controller = require('../controllers/posts')

const router = Router();

router.get('/following', asyncHandler(controller.getFollowingPosts))

router.get('/all', asyncHandler(controller.getAllPosts))

router.post('/text', fns.checkAuth, asyncHandler(controller.createTextPost))

router.post('/image', fns.checkAuth, upload.single('image'), asyncHandler(controller.createImagePost))

router.get('/popular', asyncHandler(controller.getPopularPosts))

router.get('/:postId', asyncHandler(controller.getPost))

router.delete('/:postId', fns.checkAuth, asyncHandler(controller.deletePost))

router.post('/:postId/like', fns.checkAuth, asyncHandler(controller.likePost))

router.delete('/:postId/like', fns.checkAuth, asyncHandler(controller.removePostLike))



module.exports = router;