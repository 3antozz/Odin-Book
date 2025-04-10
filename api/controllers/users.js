const db = require('../db/queries');
const fns = require('../routes/fns');

exports.getClient = async(req, res) => {
    const user = await db.getUserNoPw(req.user.username)
    return res.send({user})
}

exports.getProfile = async(req, res) => {
    const userId = +req.params.userId;
    const profile = await db.getProfile(userId, req.user?.id)
    if(!profile) {
        const error = new Error('Data not found')
        error.code = 400;
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
    if(req.user) {
        if(profile.followers.length > 0) {
            profile.isFollowed = true
        }
        if(profile.sent_requests.length > 0) {
            profile.hasRequested = true
        }
        if(profile.received_requests.length > 0) {
            profile.isPending = true
        }
    }
    profile.posts = formattedPosts
    res.json({profile})
}

exports.getAllUsers = async(req, res) => {
    const userId = req.user.id;
    const users = await db.getAllUsers(userId)
    res.json({users})
}