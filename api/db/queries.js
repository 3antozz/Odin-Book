const prisma = require('./client');

// User Queries ____________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________
// 
exports.createUser = async(username, first_name, last_name, password, picture_url = null, pwSet) => {
    return await prisma.user.create({
        data: {
            username,
            first_name,
            last_name,
            password,
            picture_url,
            pw_set: pwSet
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

exports.getUserNoPw = async(username) => {
    return await prisma.user.findUnique({
        where: {
            username
        },
        omit: {
            password: true
        },
        include: {
            received_requests: true,
        }
    })
}

exports.updateUserPw = async(id, password) => {
    return await prisma.user.update({
        where: {
            id
        },
        data: {
            password,
            pw_set: true
        },
        omit: {
            password
        }
    })
}

exports.createGithubUser = async(userId, provider, subject) => {
    return await prisma.federatedCredential.create({
        data: {
            user: {
                connect: {
                    id: userId
                }
            },
            provider,
            subject
        }
    })
}

exports.getGithubUser = async(provider, subject) => {
    return await prisma.federatedCredential.findUnique({
        where: {
            provider_subject: { provider, subject },
        },
        include: {
            user: true
        }
    })
}