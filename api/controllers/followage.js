const db = require('../db/queries');


exports.sendRequest = async(req, res) => {
    const senderId = req.user.id;
    const  receiverId  = +req.params.receiverId;
    const {request, notification} = await db.sendRequest(senderId, +receiverId)
    const io = req.app.get('io');
    io.to(`user${receiverId}`).emit('new request', request);
    io.to(`user${receiverId}`).emit('notitication', notification);
    res.json({request})
}

exports.acceptRequest = async(req, res) => {
    const receiverId = req.user.id;
    const senderId  = +req.params.senderId;
    const {request, notification} = await db.acceptRequest(receiverId, senderId)
    const io = req.app.get('io');
    io.to(`user${senderId}`).emit('new following', {following: request[0].following});
    io.to(`user${senderId}`).emit('notitication', notification);
    res.json({follower: request[0].follower})
}

exports.rejectRequest = async(req, res) => {
    const receiverId = req.user.id;
    const senderId = +req.params.senderId;
    const request = await db.rejectRequest(receiverId, senderId)
    const io = req.app.get('io');
    io.to(`user${senderId}`).emit('reject request', request);
    res.json({request})
}

exports.cancelRequest = async(req, res) => {
    const senderId = req.user.id;
    const receiverId  = +req.params.receiverId;
    const request = await db.rejectRequest(receiverId, senderId)
    const io = req.app.get('io');
    io.to(`user${receiverId}`).emit('reject request', request);
    res.json({request})
}

exports.unfollow = async(req, res) => {
    const clientId = req.user.id;
    const userId  = +req.params.userId;
    const user = await db.unfollow(clientId, userId)
    console.log(user);
    res.json({done: true})
}

exports.removeFollower = async(req, res) => {
    const clientId = req.user.id;
    const { userId } = req.body;
    const user = await db.unfollow(clientId, +userId)
    console.log(user);
    const io = req.app.get('io');
    io.to(`user${userId}`).emit('removed following', +clientId);
    res.json({done: true})
}