const db = require('../db/queries');
const { cloudinary } = require('../routes/uploadConfig')
const fns = require('../routes/fns');

exports.createPostTextComment = async(req, res) => {
    const userId = req.user.id;
    const postId = +req.params.postId;
    const { content, postAuthorId } = req.body;
    const { comment, notification } = await db.createPostComment(userId, postId, content);
    const date = fns.formatDate(comment.createdAt)
    comment.createdAt = date;
    const io = req.app.get('io');
    if(comment.authorId !== +postAuthorId) {
        io.to(`user${postAuthorId}`).emit('new comment', comment);
    }
    if(notification) {
        io.to(`user${postAuthorId}`).emit('notification', notification);
    }
    setTimeout(() => res.json({comment}), 3000)
    // res.json({comment})
}

exports.createPostImageComment = async(req, res) => {
    const userId = req.user.id;
    const postId = +req.params.postId;
    const { content, postAuthorId } = req.body;
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
    if(comment.authorId !== +postAuthorId) {
        io.to(`user${postAuthorId}`).emit('new comment', comment);
    }
    if(notification) {
        io.to(`user${postAuthorId}`).emit('notification', notification);
    }
    res.json({comment})
}

exports.createCommentTextComment = async(req, res) => {
    const userId = req.user.id;
    const commentId = +req.params.commentId;
    const { postId, content } = req.body;
    const existingComment = await db.getComment(commentId)
    let comment;
    let notification;
    let notifications;
    if(!existingComment.commentOnId) {
        ({comment, notification, notifications} = await db.createCommentOnComment(userId, +postId, existingComment.post.authorId, existingComment.id, content))
    } else {
        ({comment, notification, notifications} = await db.createCommentOnComment(userId, +postId, existingComment.post.authorId, existingComment.commentOnId, content))
    }
    comment.createdAt = fns.formatDate(comment.createdAt)
    const io = req.app.get('io');
    notifications.forEach((notif) => {
        io.to(`user${notif.userId}`).emit('notification', notification)
        io.to(`user${notif.userId}`).emit('new comment', comment)
    })
    setTimeout(() => res.json({comment}), 3000)
    // res.json({comment})
}

exports.createCommentImageComment = async(req, res) => {
    const userId = req.user.id;
    const commentId = +req.params.commentId;
    const { postId, content } = req.body;
    const existingComment = await db.getComment(commentId)
    let comment;
    let notification;
    let notifications;
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
        ({comment, notification, notifications} = await db.createCommentOnComment(userId, +postId, existingComment.post.authorId, existingComment.id, content, uploadResult.secure_url, uploadResult.public_id))
    } else {
        ({comment, notification, notifications} = await db.createCommentOnComment(userId, +postId, existingComment.post.authorId, existingComment.commentOnId, content, uploadResult.secure_url, uploadResult.public_id))
    }
    comment.createdAt = fns.formatDate(comment.createdAt)
    const io = req.app.get('io');
    notifications.forEach((notif) => {
        io.to(`user${notif.userId}`).emit('notification', notification)
        io.to(`user${notif.userId}`).emit('new comment', comment)
    })
    res.json({comment})
}

exports.deleteComment = async(req, res) => {
    const userId = req.user.id;
    const commentId = +req.params.commentId;
    const comment = await db.getComment(commentId);
    if(comment.authorId !== userId && comment.post.authorId !== userId) {
        const error = new Error('Unauthorized')
        error.code = 403;
        throw error;
    }
    await db.deleteComment(comment.id);
    const io = req.app.get('io');
    if(!comment.commentOnId && comment.post.authorId !== userId) {
        io.to(`user${comment.post.authorId}`).emit('delete comment', comment);
    } else if (comment.commentOnId) {
        comment.commentOn.comments.forEach((comment2) => (comment2.authorId !== userId) && io.to(`user${comment2.authorId}`).emit('delete comment', comment))
    }
    setTimeout(() => res.json({done: true}), 3000)
    // res.json({done: true})
    if(comment.public_id) {
        cloudinary.uploader.destroy(comment.public_id)
    }
}


exports.likeComment = async(userId, commentId) => {
    return await db.likeComment(userId, commentId)
}

exports.removeCommentLike = async(userId, commentId) => {
    return await db.removeCommentLike(userId, commentId)
}
