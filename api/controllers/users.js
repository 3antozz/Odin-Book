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

exports.getFollowers = async(req, res) => {
    const clientId = req.user.id;
    const userId = +req.params.userId;
    const profile = await db.getUserFollowage(userId, clientId, 'followers', 'follower')
    let taggedFollowers;
    if(req.user) {
        taggedFollowers = profile.followers.map(follow => {
            const follower = follow.follower;
            if(follower.followers.length > 0) {
                follow.follower.isFollowed = true
            }
            if(follower.received_requests.length > 0) {
                follow.follower.isPending = true
            }
            return follow;
        })
        profile.followers = taggedFollowers;
    }
    res.json({profile})
}

exports.getFollowing = async(req, res) => {
    const clientId = req.user.id;
    const userId = +req.params.userId;
    const profile = await db.getUserFollowage(userId, clientId, 'following', 'following')
    let taggedFollowers;
    if(req.user) {
        taggedFollowers = profile.following.map(follow => {
            const following = follow.following;
            if(following.followers.length > 0) {
                follow.following.isFollowed = true
            }
            if(following.received_requests.length > 0) {
                follow.following.isPending = true
            }
            return follow;
        })
        profile.following = taggedFollowers;
    }
    res.json({profile})
}

exports.setSeenNotifications = async(userId) => {
    try {
        await db.setSeenNotifications(userId);
        return true;
    } catch(err) {
        console.log(err)
    }
}