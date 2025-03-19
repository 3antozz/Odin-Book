const db = require('../db/queries');
const { cloudinary } = require('../routes/uploadConfig')

exports.createPostTextComment = async(req, res) => {
    const userId = req.user.id;
    const postId = +req.params.postId;
    const { content, authorId } = req.body;
    const comment = await db.createPostComment(userId, postId, content);
    const io = req.app.get('io');
    io.to(`user${authorId}`).emit('new post comment', comment.comment);
    io.to(`user${authorId}`).emit('notification', comment.notification);
    res.json({comment: comment.comment})
}

exports.createPostImageComment = async(req, res) => {
    const userId = req.user.id;
    const postId = +req.params.postId;
    const { content, authorId } = req.body;
    const options = {
        use_filename: false,
        overwrite: false,
        asset_folder: `OdinBook/comments/${userId}`,
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
    const comment = await db.createPostComment(userId, postId, content, uploadResult.secure_url, uploadResult.public_id);
    const io = req.app.get('io');
    io.to(`user${authorId}`).emit('new post comment', comment.comment);
    io.to(`user${authorId}`).emit('notification', comment.notification);
    res.json({comment: comment.comment})
}

exports.createCommentTextComment = async(req, res) => {
    const userId = req.user.id;
    const commentId = +req.params.commentId;
    const { content } = req.body;
    const comment = await db.getComment(commentId)
    let newComment;
    if(comment.postId) {
        newComment = await db.createCommentOnComment(userId, comment.postId, content)
    } else {
        newComment = await db.createCommentOnComment(userId, comment.commentOnId, content)
    }
    const io = req.app.get('io');
    io.to(`comment${comment.id}`).emit('new comment comment', comment);
    newComment.comment.commentOn.comments.forEach((comment) => io.to(`user${comment.authorId}`).emit('notification', newComment.notification))
    res.json({comment: newComment.comment})
}

exports.createCommentImageComment = async(req, res) => {
    const userId = req.user.id;
    const commentId = +req.params.commentId;
    const { content } = req.body;
    const comment = await db.getComment(commentId)
    let newComment;
    const options = {
        use_filename: false,
        overwrite: false,
        asset_folder: `OdinBook/comments/${userId}`,
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
    if(comment.postId) {
        newComment = await db.createCommentOnComment(userId, comment.postId, content, uploadResult.secure_url, uploadResult.public_id)
    } else {
        newComment = await db.createCommentOnComment(userId, comment.commentOnId, content, uploadResult.secure_url, uploadResult.public_i)
    }
    const io = req.app.get('io');
    io.to(`comment${comment.id}`).emit('new comment comment', comment);
    newComment.comment.commentOn.comments.forEach((comment) => io.to(`user${comment.authorId}`).emit('notification', newComment.notification))
    res.json({comment: newComment.comment})
}

exports.deleteComment = async(req, res) => {
    const userId = req.user.id;
    const commentId = +req.params.commentId;
    const comment = await db.getComment(commentId);
    if(comment.authorId !== userId) {
        const error = new Error('Unauthorized')
        error.code = 401;
        throw error;
    }
    await db.deleteComment(comment.id);
    res.json({done: true})
    if(comment.public_id) {
        cloudinary.uploader.destroy(comment.public_id, (result) => console.log(result))
    }
}

exports.likeComment = async(req, res) => {
    const userId = req.username.id;
    const commentId = +req.params.commentId;
    const {like, notification} = await db.likeComment(userId, commentId)
    const io = req.app.get('io');
    io.to(`user${like.comment.authorId}`).emit('new like', like);
    io.to(`user${like.comment.authorId}`).emit('notification', notification);
    res.json({done: true})
}

exports.removeCommentLike = async(req, res) => {
    const userId = req.username.id;
    const commentId = +req.params.commentId;
    await db.removeCommentLike(userId, commentId)
    res.json({done: true})
}