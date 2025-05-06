const db = require('../db/queries');
const fns = require('../routes/fns');
const { cloudinary } = require('../routes/uploadConfig')
const { validationResult } = require('express-validator');

exports.getClient = async(req, res) => {
    const user = await db.getUserNoPw(req.user.username)
    return res.json({user})
}

exports.getProfile = async(req, res) => {
    const userId = +req.params.userId;
    const clientId = req.user?.id || 0;
    const profile = await db.getProfile(userId, clientId)
    if(!profile) {
        const error = new Error('Data not found')
        error.code = 404;
        throw error;
    }
    profile.join_date = fns.formatDateWithoutTimeAndDay(profile.join_date);
    const formattedPosts = profile.posts.map(post => {
        const date = fns.formatDate(post.createdAt)
        post.createdAt = date;
        if(post.likes.length > 0) {
            post.isLiked = true;
        }
        return post;
    })
    profile.posts = formattedPosts
    if(profile.followers?.length > 0 || profile.id === clientId) {
        profile.isFollowed = true
    } else if (profile.id !== clientId) {
        profile.isLocked = true;
    }
    if(req.user && req.user !== 0 && profile.id !== clientId) {
        if(profile.sent_requests.length > 0) {
            profile.hasRequested = true
        }
        if(profile.received_requests.length > 0) {
            profile.isPending = true
        }
    }
    setTimeout(() => res.json({profile}), 3000)
    // res.json({profile})
}

exports.getAllUsers = async(req, res) => {
    const userId = req.user.id;
    const users = await db.getAllUsers(userId)
    res.json({users})
}

exports.setSeenNotifications = async(userId) => {
    try {
        await db.setSeenNotifications(userId);
        return true;
    } catch(err) {
        console.log(err)
    }
}

exports.editProfilePicture = async(req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        const errors = result.errors.map(err => err.msg);
        errors.code = 400;
        return next(errors)
    }
    const userId = +req.params.userId;
    const { first_name, last_name, bio } = req.body;
    const options = {
        public_id: `${userId}`,
        overwrite: true,
        asset_folder: `OdinBook/profile-pictures/${userId}`,
        transformation: [
            { width: 300, height: 300, crop: 'auto_pad', gravity: 'auto' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
        ]
    };
    const uploadResult = await new Promise((resolve) => {
        cloudinary.uploader.upload_stream(options, (error, uploadResult) => {
            return resolve(uploadResult);
        }).end(req.file.buffer);
    });
    const user = await db.updateProfile(userId, first_name, last_name, bio, uploadResult.secure_url)
    res.json({user})
}

exports.updateProfile = async(req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        const errors = result.errors.map(err => err.msg);
        errors.code = 400;
        return next(errors)
    }
    const userId = +req.params.userId;
    const { first_name, last_name, bio } = req.body;
    const user = await db.updateProfile(userId, first_name, last_name, bio)
    res.json({user})
}

exports.searchUsers = async(req, res) => {
    const query = req.query.q;
    const clientId = req.user?.id || 0;
    const users = await db.searchUsers(query, clientId);
    res.json({users})
}

exports.getMostFollowed = async(req, res) => {
    const clientId = req.user?.id || 0;
    const users = await db.getMostFollowedUsers(clientId);
    setTimeout(() => res.json({users}), 3000)
    // res.json({users})
}