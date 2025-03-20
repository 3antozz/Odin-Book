const db = require('../db/queries');

exports.getClient = async(req, res) => {
    const user = await db.getUserNoPw(req.user.username)
    return res.send({user})
}

exports.getProfile = async(req, res) => {
    const userId = +req.params.userId;
    const profile = await db.getProfile(userId)
    res.json({profile})
}

exports.getAllUsers = async(req, res) => {
    const userId = req.user.id;
    const users = await db.getAllUsers(userId)
    res.json({users})
}