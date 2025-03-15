const prisma = require('./client');

// User Queries ____________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________
// 
exports.createUser = async(username, first_name, last_name, password) => {
    return await prisma.user.create({
        data: {
            username,
            first_name,
            last_name,
            password,
        },
        omit: {
            password: true,
            bio: true,
            username: true
        },
    })
}

exports.getUser = async(username) => {
    return await prisma.user.findUnique({
        where: {
            username
        }
    })
}