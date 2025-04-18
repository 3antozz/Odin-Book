const db = require('../db/queries');


exports.sendRequest = async(req, res) => {
    const senderId = req.user.id;
    const  receiverId  = +req.params.receiverId;
    const {request, notification} = await db.sendRequest(senderId, +receiverId)
    const io = req.app.get('io');
    io.to(`user${receiverId}`).emit('new request', request.senderId);
    io.to(`user${receiverId}`).emit('notification', notification);
    res.json({done: true})
}

exports.acceptRequest = async(req, res) => {
    const receiverId = req.user.id;
    const senderId  = +req.params.senderId;
    const {request, notification} = await db.acceptRequest(receiverId, senderId)
    const io = req.app.get('io');
    console.log(request);
    io.to(`user${senderId}`).emit('new following', receiverId);
    io.to(`user${senderId}`).emit('notification', notification);
    res.json({follower: request[0].follower})
}

exports.rejectRequest = async(req, res) => {
    const receiverId = req.user.id;
    const senderId = +req.params.senderId;
    await db.rejectRequest(receiverId, senderId)
    const io = req.app.get('io');
    io.to(`user${senderId}`).emit('request rejected', receiverId);
    console.log(`event sent to user${senderId}`)
    res.json({done: true})
}

exports.cancelRequest = async(req, res) => {
    const senderId = req.user.id;
    const receiverId  = +req.params.receiverId;
    await db.rejectRequest(receiverId, senderId)
    const io = req.app.get('io');
    io.to(`user${receiverId}`).emit('received request canceled', senderId);
    res.json({done: true})
}

exports.unfollow = async(req, res) => {
    const clientId = req.user.id;
    const userId  = +req.params.userId;
    await db.unfollow(clientId, userId)
    const io = req.app.get('io');
    io.to(`user${userId}`).emit('unfollowed', clientId);
    res.json({done: true})
}

exports.removeFollower = async(req, res) => {
    const clientId = req.user.id;
    const userId  = +req.params.userId;
    await db.removeFollower(clientId, userId)
    const io = req.app.get('io');
    io.to(`user${userId}`).emit('removed following', clientId);
    res.json({done: true})
}