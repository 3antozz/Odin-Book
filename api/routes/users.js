const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const db = require('../db/queries');
const fns = require('./fns');

const router = Router();



router.get('/me', fns.checkAuth, asyncHandler(async(req, res) => {
    const user = await db.getUserNoPw(req.user.username)
    return res.send({user})
}))


module.exports = router;