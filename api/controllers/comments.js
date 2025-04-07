const db = require('../db/queries');
const { cloudinary } = require('../routes/uploadConfig')
const fns = require('../routes/fns');

exports.createPostTextComment = async(req, res) => {
    const userId = req.user.id;
    const postId = +req.params.postId;
    const { content, authorId } = req.body;
    const { comment, notification } = await db.createPostComment(userId, postId, content);
    const date = fns.formatDate(comment.createdAt)
    comment.createdAt = date;
    const io = req.app.get('io');
    io.to(`user${authorId}`).emit('new post comment', comment);
    io.to(`user${authorId}`).emit('notification', notification);
    res.json({comment})
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
    const { comment, notification } = await db.createPostComment(userId, postId, content, uploadResult.secure_url, uploadResult.public_id);
    const date = fns.formatDate(comment.createdAt)
    comment.createdAt = date;
    const io = req.app.get('io');
    io.to(`user${authorId}`).emit('new post comment', comment);
    io.to(`user${authorId}`).emit('notification', notification);
    res.json({comment})
}

exports.createCommentTextComment = async(req, res) => {
    const userId = req.user.id;
    const commentId = +req.params.commentId;
    const { postId, content } = req.body;
    const existingComment = await db.getComment(commentId)
    let comment;
    let notification;
    if(!existingComment.commentOnId) {
        ({comment, notification} = await db.createCommentOnComment(userId, +postId, existingComment.id, content))
    } else {
        ({comment, notification} = await db.createCommentOnComment(userId, +postId, existingComment.commentOnId, content))
    }
    const io = req.app.get('io');
    io.to(`comment${existingComment.id}`).emit('new comment comment', existingComment);
    comment.commentOn.comments.forEach((comment) => io.to(`user${comment.authorId}`).emit('notification', notification))
    res.json({comment})
}

exports.createCommentImageComment = async(req, res) => {
    const userId = req.user.id;
    const commentId = +req.params.commentId;
    const { postId, content } = req.body;
    const existingComment = await db.getComment(commentId)
    let comment;
    let notification
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
    if(!existingComment.commentOnId) {
        ({comment, notification} = await db.createCommentOnComment(userId, +postId, existingComment.postId, content, uploadResult.secure_url, uploadResult.public_id))
    } else {
        ({comment, notification} = await db.createCommentOnComment(userId, +postId, existingComment.commentOnId, content, uploadResult.secure_url, uploadResult.public_i))
    }
    const io = req.app.get('io');
    io.to(`comment${existingComment.id}`).emit('new comment comment', existingComment);
    comment.commentOn.comments.forEach((comment) => io.to(`user${comment.authorId}`).emit('notification', notification))
    res.json({comment})
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

// exports.likeComment = async(req, res) => {
//     const userId = req.user.id;
//     const commentId = +req.params.commentId;
//     const {like, notification} = await db.likeComment(userId, commentId)
//     const io = req.app.get('io');
//     io.to(`user${like.comment.authorId}`).emit('new like', like);
//     io.to(`user${like.comment.authorId}`).emit('notification', notification);
//     res.json({done: true})
// }

exports.likeComment = async(userId, commentId) => {
    return await db.likeComment(userId, commentId)
}

exports.removeCommentLike = async(userId, commentId) => {
    await db.removeCommentLike(userId, commentId)
    return true;
}

// exports.removeCommentLike = async(req, res) => {
//     const userId = req.user.id;
//     const commentId = +req.params.commentId;
//     await db.removeCommentLike(userId, commentId)
//     res.json({done: true})
// }