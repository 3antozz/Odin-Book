exports.checkAuth = (req, res, next) => {
    if(req.isAuthenticated()) {
        next();
    } else {
        const error = new Error('You need to login to access this page');
        error.code = 401;
        next(error); 
    }
}