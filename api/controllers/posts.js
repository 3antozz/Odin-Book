const db = require('../db/queries');
const { cloudinary } = require('../routes/uploadConfig')

exports.getPost = async(req, res) => {
    const postId = +req.params.postId;
    const post = db.getFullPost(postId);
    return res.json({post});
}

exports.getAllPosts = async(req, res) => {
    const posts = await db.getAllPosts();
    res.json({posts})
}

exports.getFollowingPosts = async(req, res) => {
    const userId = req.user.id;
    const posts = await db.getFollowingPosts(userId);
    res.json({posts})
}

exports.createTextPost = async(req, res) => {
    const userId = req.user.id;
    const { content } = req.body;
    const post = await db.createPost(userId, content)
    const io = req.app.get('io');
    io.emit('new post', post);
    res.json({post});
}

exports.deletePost = async(req, res) => {
    const userId = req.username.id;
    const postId = +req.params.postId;
    const post = await db.getPost(postId);
    if(post.authorId !== userId) {
        const error = new Error('Unauthorized')
        error.code = 401;
        throw error;
    }
    await db.deletePost(post.id);
    res.json({done: true})
    if(post.public_id) {
        cloudinary.uploader.destroy(post.public_id, (result) => console.log(result))
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
    const io = req.app.get('io');
    io.emit('new post', post);
    res.json({post});
}

exports.likePost = async(req, res) => {
    const userId = req.username.id;
    const postId = +req.params.postId;
    const { like, notification } = await db.likePost(userId, postId)
    const io = req.app.get('io');
    io.to(`user${like.post.authorId}`).emit('new like', postId);
    io.to(`user${like.post.authorId}`).emit('notification', notification);
    res.json({done: true})
}

exports.removePostLike = async(req, res) => {
    const userId = req.username.id;
    const postId = +req.params.postId;
    await db.removePostLike(userId, postId)
    res.json({done: true})
}