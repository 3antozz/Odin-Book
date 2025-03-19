const db = require('../db/queries');


exports.sendRequest = async(req, res) => {
    const senderId = req.user.id;
    const { receiverId } = req.body;
    const {request, notification} = await db.sendRequest(senderId, +receiverId)
    console.log(request);
    const io = req.app.get('io');
    io.to(`user${receiverId}`).emit('new request', request);
    io.to(`user${receiverId}`).emit('notitication', notification);
    res.json({request})
}

exports.acceptRequest = async(req, res) => {
    const receiverId = req.user.id;
    const { senderId } = req.body;
    const {request, notification} = await db.acceptRequest(receiverId, +senderId)
    console.log(request)
    const io = req.app.get('io');
    io.to(`user${senderId}`).emit('new following', {following: request[0]});
    io.to(`user${senderId}`).emit('notitication', notification);
    res.json({follower: request[1]})
}

exports.rejectRequest = async(req, res) => {
    const receiverId = req.user.id;
    const { senderId } = req.body;
    const request = await db.rejectRequest(receiverId, +senderId)
    console.log(request);
    const io = req.app.get('io');
    io.to(`user${senderId}`).emit('reject request', request[2]);
    res.json({request: request[2]})
}

exports.unfollow = async(req, res) => {
    const clientId = req.user.id;
    const { userId } = req.body;
    const user = await db.unfollow(clientId, +userId)
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