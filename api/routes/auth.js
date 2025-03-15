const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt');
const db = require('../db/queries')
const {body, validationResult} = require('express-validator');

const router = Router();

const validateLogin = [body("username").trim().notEmpty().withMessage("Username must not be empty").bail().matches(/^[a-zA-Z0-9_]+$/). 
withMessage("Incorrect Username").bail().isLength({min: 3, max: 20}).withMessage("Incorrect Username"),
    body("password").trim().notEmpty().withMessage("Password must not be empty")
];

const validateRegistration = [
    body("first_name").trim().notEmpty().withMessage("First Name must not be empty").bail().isAlpha().withMessage("First Name must only contain alphabet and no spaces").isLength({min: 2, max: 20}).withMessage("First name must be between 2 and 20 characters"),
    body("last_name").trim().notEmpty().withMessage("Last Name must not be empty").bail().isAlpha().withMessage("Last Name must only contain alphabet and no spaces").isLength({min: 2, max: 20}).withMessage("Last name must be between 2 and 20 characters"),
    body("username").trim().notEmpty().withMessage("Username must not be empty").bail().matches(/^[a-zA-Z0-9_]+$/).withMessage("Username must only contain alphabet and numbers and no spaces").isLength({min: 3, max: 15}).withMessage("Username must be between 3 and 15 characters"),
    body("password").trim().notEmpty().withMessage("Password must not be empty").bail().isLength({min: 6}).withMessage("Password must be atleast 6 characters long"),
    body('confirm_password').custom((value, { req }) => {
        return value === req.body.password;
      }).withMessage("Passwords don't match")
];


router.post('/register', validateRegistration, asyncHandler(async(req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        const errors = result.errors.map(err => err.msg);
        errors.code = 400;
        return next(errors)
    }
    const { username, first_name, last_name, password } = req.body;
        const hashedPW = await bcrypt.hash(password, 15)
        const user = await db.createUser(username, first_name, last_name, hashedPW);
        const io = req.app.get('io');
        io.emit('new user', user);
        return res.json({done: true});
}))

router.post('/login', validateLogin, asyncHandler(async(req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        const errors = result.errors.map(err => err.msg);
        errors.code = 400;
        return next(errors)
    }
    const { username, password } = req.body;
    const user = await db.getUser(username)
    if(!user) {
        const error = new Error('Incorrect Username')
        error.code = 400;
        throw error;
    }
    const checkPW = await bcrypt.compare(password, user.password);;
    if(!checkPW) {
        const error = new Error('Incorrect Password')
        error.code = 400;
        throw error;
    }
    const payload = {
        username: user.username
    }
    console.log(payload)
}))


module.exports = router;