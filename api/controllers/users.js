const db = require('../db/queries');

exports.getClient = async(req, res) => {
    const user = await db.getUserNoPw(req.user.username)
    return res.send({user})
}