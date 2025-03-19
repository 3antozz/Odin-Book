const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const fns = require('./fns');
const { upload } = require('./uploadConfig')
const controller = require('../controllers/comments')

const router = Router();

router.post('/post/:postId/text', fns.checkAuth, asyncHandler(controller.createPostTextComment))

router.post('/post/:postId/image', fns.checkAuth, upload.single('image'), asyncHandler(controller.createPostImageComment))

router.post('/comment/:commentId/text', fns.checkAuth, asyncHandler(controller.createCommentTextComment))

router.post('/comment/:commentId/image', fns.checkAuth, upload.single('image'), asyncHandler(controller.createCommentImageComment))

router.delete('/:commentId', fns.checkAuth, asyncHandler(controller.deleteComment))

router.post('/:commentId/like', fns.checkAuth, asyncHandler(controller.likeComment))

router.delete('/:commentId/like', fns.checkAuth, asyncHandler(controller.removeCommentLike))



module.exports = router;