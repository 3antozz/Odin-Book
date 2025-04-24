const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt');
const db = require('../db/queries');
const {body, validationResult} = require('express-validator');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const LocalStrategy = require('passport-local');
const fns = require('./fns');

const router = Router();

passport.use(new GitHubStrategy({
    clientID: process.env['GITHUB_CLIENT_ID'],
    clientSecret: process.env['GITHUB_CLIENT_SECRET'],
    callbackURL: '/auth/github/callback',
    proxy: true,
  }, async function verify(accessToken, refreshToken, profile, cb) {
        try {
            const user = await db.getGithubUser('Github', profile.id)
            if(!user) {
                const newUser = await db.createUser(profile.username, "temp", "temp", null, profile._json.avatar_url, profile._json.bio, false) 
                await db.createGithubUser(newUser.id, 'Github', profile.id)
                return cb(null, newUser)
            } else {
                return cb(null, user.user)
            }
        } catch(err) {
            return cb(err);
        }
}));

passport.use(new LocalStrategy(async function verify(username, password, done) {
    try {
        const user = await db.getUser(username);
        if (!user) { return done(null, false, {message: "Incorrect username"})}
        const match = await bcrypt.compare(password, user.password);
        if (!match) { return done(null, false, {message: "Incorrect password"})}
        return done (null, user);
    } catch (error) {
        return done(error);
    }
}))
passport.serializeUser((user, done) => {
    done(null, {
        id: user.id,
        username: user.username,
    })
})

passport.deserializeUser(async (user, done) => {
    return done(null, user);
})

// passport.serializeUser((user, done) => {
//     done(null, user.username)
// })

// passport.deserializeUser(async (username, done) => {
//     try {
//         const user = await db.getUser(username);
//         done(null, user);
//     } catch(error) {
//         done(error)
//     }
// })

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

const validatePassword = [
    body("first_name").trim().notEmpty().withMessage("First Name must not be empty").bail().isAlpha().withMessage("First Name must only contain alphabet and no spaces").isLength({min: 2, max: 20}).withMessage("First name must be between 2 and 20 characters"),
    body("last_name").trim().notEmpty().withMessage("Last Name must not be empty").bail().isAlpha().withMessage("Last Name must only contain alphabet and no spaces").isLength({min: 2, max: 20}).withMessage("Last name must be between 2 and 20 characters"),
    body("password").trim().notEmpty().withMessage("Password must not be empty").bail().isLength({min: 6}).withMessage("Password must be atleast 6 characters long"),
    body('confirm_password').custom((value, { req }) => {
        return value === req.body.password;
      }).withMessage("Passwords don't match")
]


router.post('/register', validateRegistration, asyncHandler(async(req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        const errors = result.errors.map(err => err.msg);
        errors.code = 400;
        return next(errors)
    }
    const { username, first_name, last_name, password } = req.body;
        const hashedPW = await bcrypt.hash(password, 15)
        const user = await db.createUser(username, first_name, last_name, hashedPW, null, null, true);
        const io = req.app.get('io');
        io.emit('new user', user);
        return res.json({done: true});
}))

router.post('/login', validateLogin, async(req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        const errors = result.errors.map(err => err.msg);
        errors.code = 400;
        return next(errors)
    }
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            const errors = [info.message];
            errors.code = 401;
            return next(errors)
        };
        req.logIn(user, (err) => {
            if (err) return next(err);
            return res.json({ done: true });
        });
    })(req, res, next)
})

router.post('/set-password', fns.checkAuth, validatePassword, asyncHandler(async(req, res, next) => {
    const { userId, first_name, last_name, password } = req.body;
    if(req.user.id !== +userId) {
        const error = new Error('Unauthorized')
        error.code = 403;
        throw error;
    }
    const result = validationResult(req);
    if (!result.isEmpty()) {
        const errors = result.errors.map(err => err.msg);
        errors.code = 400;
        return next(errors)
    }
    const hashedPW = await bcrypt.hash(password, 15)
    const user = await db.updateUserPw(+userId, hashedPW, first_name, last_name);
    return res.json({user});
}))

router.get('/auth/github', passport.authenticate('github'));
router.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: `${process.env.FRONTEND_URL}/login`}), (req, res) => {
        if(!req.user.password) {
            return res.redirect(`${process.env.FRONTEND_URL}/set-password/${req.user.id}`)
        }
        res.redirect(process.env.FRONTEND_URL)
})

router.post('/logout', (req, res, next) => {
    req.logout((err) => {
      if (err) { return next(err); }
      res.json({done: true})
    });
});


module.exports = router;