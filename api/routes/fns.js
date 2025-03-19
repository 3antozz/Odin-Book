const { format } = require('date-fns')
exports.checkAuth = (req, res, next) => {
    if(req.isAuthenticated()) {
        next();
    } else {
        const error = new Error('You need to login to access this page');
        error.status = 401;
        next(error); 
    }
}

exports.formatDate = (date) => {
    return format(new Date(date), 'PP, H:mm');
}

exports.formatDateWithoutTime = (date) => {
    return format(new Date(date), 'PP');
}