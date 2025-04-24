const db = require('../db/queries');
const { cloudinary } = require('../routes/uploadConfig')
const fns = require('../routes/fns');

exports.getPost = async(req, res) => {
    const userId = req.user?.id
    const postId = +req.params.postId;
    const post = await db.getFullPost(postId);
    if(!post) {
        const error = new Error('Data not found')
        error.code = 404;
        throw error;
    }
    const date = fns.formatDate(post.createdAt)
    post.createdAt = date;
    if(userId) {
        for(const like of post.likes) {
            if(like.userId === userId) {
                post.isLiked = true;
                break;
            }
        }
        for(const comment1 of post.comments) {
            comment1.createdAt = fns.formatDate(comment1.createdAt)
            for(const like of comment1.likes) {
                if(like.userId === userId) {
                    comment1.isLiked = true;
                    break;
                }
            }
            for(const comment2 of comment1.comments) {
                comment2.createdAt = fns.formatDate(comment2.createdAt)
                for(const like of comment2.likes) {
                    if(like.userId === userId) {
                        comment2.isLiked = true;
                        break;
                    }
                }
            }
        }
    }
    return res.json({post});
}

exports.getAllPosts = async(req, res) => {
    const posts = await db.getAllPosts();
    res.json({posts})
}

exports.getFollowingPosts = async(req, res) => {
    const userId = req.user.id;
    const posts = await db.getFollowingPosts(userId);
    const formattedPosts = posts.map(post => {
        const date = fns.formatDate(post.createdAt)
        post.createdAt = date;
        if(post.likes.length > 0) {
            post.isLiked = true;
        }
        return post;
    })
    res.json({posts: formattedPosts})
}

exports.createTextPost = async(req, res) => {
    const userId = req.user.id;
    const { content } = req.body;
    if(!content) {
        const error = new Error('Post cannot be empty')
        error.code = 400;
        throw error;
    }
    const post = await db.createPost(userId, content)
    const date = fns.formatDate(post.createdAt)
    post.createdAt = date;
    const io = req.app.get('io');
    io.to(`following${userId}`).emit('new post', post);
    res.json({post});
}

exports.deletePost = async(req, res) => {
    const userId = req.user.id;
    const postId = +req.params.postId;
    const post = await db.getPost(postId);
    if(!post) {
        const error = new Error('Data not found')
        error.code = 404;
        throw error;
    }
    if(post.authorId !== userId) {
        const error = new Error('Unauthorized')
        error.code = 403;
        throw error;
    }
    await db.removePost(post.id);
    const io = req.app.get('io');
    io.to(`following${userId}`).emit('remove post', post);
    res.json({done: true})
    if(post.public_id) {
        cloudinary.uploader.destroy(post.public_id)
    }
}

exports.createImagePost = async(req, res) => {
    const userId = req.user.id;
    const { content } = req.body;
    const options = {
        use_filename: false,
        overwrite: false,
        asset_folder: `OdinBook/posts/${userId}`,
        transformation: [
            {width: req.file.width > 1080 ? 1080 : req.file.width},
            {crop: 'limit'},
            {fetch_format: 'auto'},
            {quality: 'auto'}
        ]
    };
    const uploadResult = await new Promise((resolve) => {
        cloudinary.uploader.upload_stream(options, (error, uploadResult) => {
            return resolve(uploadResult);
        }).end(req.file.buffer);
    });
    const post = await db.createPost(userId, content, uploadResult.secure_url, uploadResult.public_id)
    const date = fns.formatDate(post.createdAt)
    post.createdAt = date;
    const io = req.app.get('io');
    io.to(`following${userId}`).emit('new post', post);
    res.json({post});
}

// exports.likePost = async(req, res) => {
//     const userId = req.user.id;
//     const postId = +req.params.postId;
//     const { like, notification } = await db.likePost(userId, postId)
//     const io = req.app.get('io');
//     io.to(`user${like.post.authorId}`).emit('new like', postId);
//     io.to(`user${like.post.authorId}`).emit('notification', notification);
//     res.json({done: true})
// }

exports.likePost = async(userId, postId) => {
    const { like, notification } = await db.likePost(userId, postId)
    return { like, notification };
}

exports.removePostLike = async(userId, postId) => {
    return await db.removePostLike(userId, postId)
}

// exports.removePostLike = async(req, res) => {
//     const userId = req.user.id;
//     const postId = +req.params.postId;
//     await db.removePostLike(userId, postId)
//     res.json({done: true})
// }