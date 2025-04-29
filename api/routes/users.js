const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const fns = require('./fns');
const controller = require('../controllers/users')
const { body } = require('express-validator');
const { upload } = require('./uploadConfig')

const router = Router();

const validateProfileEdit = [
    body("first_name").trim().notEmpty().withMessage("First Name must not be empty").bail().isAlpha().withMessage("First Name must only contain alphabet and no spaces").isLength({min: 2, max: 20}).withMessage("First name must be between 2 and 20 characters"),
    body("last_name").trim().notEmpty().withMessage("Last Name must not be empty").bail().isAlpha().withMessage("Last Name must only contain alphabet and no spaces").isLength({min: 2, max: 20}).withMessage("Last name must be between 2 and 20 characters"),
    body("bio").trim().isLength({max: 300}).withMessage("Bio must not be more than 300 characters")
];



router.get('/me', fns.checkAuth, asyncHandler(controller.getClient))

router.get('/all', fns.checkAuth, asyncHandler(controller.getAllUsers))

router.get('/search', asyncHandler(controller.searchUsers))

router.get('/most-followed', asyncHandler(controller.getMostFollowed))

router.get('/:userId/following', fns.checkAuth, asyncHandler(controller.getFollowing))

router.get('/:userId/followers', fns.checkAuth, asyncHandler(controller.getFollowers))

router.get('/:userId', fns.checkAuth, asyncHandler(controller.getProfile))

router.put('/:userId/upload', fns.checkAuth, upload.single('image'), validateProfileEdit, asyncHandler(controller.editProfilePicture))

router.put('/:userId', fns.checkAuth, validateProfileEdit, asyncHandler(controller.updateProfile))



module.exports = router;