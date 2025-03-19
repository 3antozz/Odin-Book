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
            password: true
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

// Follow Requests ____________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________
// 

exports.sendRequest = async(senderId, receiverId) => {
    const request = await prisma.request.create({
        data: {
            senderId,
            receiverId,
            status: 'Pending'
        }
    })
    const notification = await prisma.notification.create({
        data: {
            userId: receiverId,
            type: 'Request_received',
            actorId: senderId,
        }
    })
    return {request, notification}
}

exports.acceptRequest = async(receiverId, senderId) => {
    const request = await prisma.$transaction([
        await prisma.user.update({
            where: {
                id: receiverId
            },
            data: {
                followers: {
                    connect: {
                        id: {
                           senderId 
                        }
                    }
                }
            }
        }),
        await prisma.user.update({
            where: {
                id: senderId
            },
            data: {
                following: {
                    connect: {
                        id: {
                           receiverId 
                        }
                    }
                }
            }
        }),
        await prisma.request.update({
            where: {
                senderId_receiverId: {senderId, receiverId}
            },
            data: {
                status: 'Accepted'
            }
        })
    ])
    const notification = await prisma.notification.create({
        data: {
            userId: senderId,
            type: 'Request_accepted',
            actorId: receiverId,
        }
    })
    return {request, notification}
}

exports.rejectRequest = async(receiverId, senderId) => {
    return await prisma.request.delete({
        where: {
            senderId_receiverId: {senderId, receiverId}
        },
    })
}


exports.unfollow = async(clientId, userId) => {
    return await prisma.follow.delete({
        where: {
            followerId_followingId: {clientId, userId}
        }
    })
}

exports.removeFollower = async(clientId, userId) => {
    return await prisma.follow.delete({
        where: {
            followerId_followingId: {userId, clientId}
        }
    })
}

// Posts ____________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________
// 

exports.getPost = async(id) => {
    return await prisma.post.findUnique({
        where: {
            id
        }
    })
}


exports.createPost = async(userId, content = null, picture_url = null, public_id = null) => {
    return await prisma.post.create({
        data: {
            author: {
                connect: {
                    id: userId
                }
            },
            content,
            picture_url,
            public_id
        }
    })
}

exports.removePost = async(id) => {
    return await prisma.post.delete({
        where: {
            id
        }
    })
}

exports.likePost = async(userId, postId) => {
    const like = await prisma.like.create({
        data: {
            user: {
                connect: {
                    id: userId
                }
            },
            post: {
                connect: {
                    id: postId
                }
            }
        },
        include: {
            post: {
                select: {
                    authorId: true
                }
            }
        }
    })
    const notification = await prisma.notification.create({
        data: {
            userId: like.post.authorId,
            type: 'Like',
            actorId: userId,
            postId,
        }
    })
    return {like, notification}
}

exports.removePostLike = async(userId, postId) => {
    return await prisma.like.delete({
        where: {
            userId_postId: {userId, postId}
        }
    })
}

// Comments ____________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________
// 

exports.getComment = async(id) => {
    return await prisma.comment.findUnique({
        where: {
            id
        },
    })
}

exports.createPostComment = async(userId, postId, content = null, picture_url = null, public_id = null) => {
    const comment =  await prisma.comment.create({
        data: {
            author: {
                connect: {
                    id: userId
                }
            },
            post: {
                connect: {
                    id: postId
                }
            },
            content,
            picture_url,
            public_id
        },
        include: {
            post: {
                select: {
                    authorId: true
                }
            }
        }
    })
    const notification = await prisma.notification.create({
        data: {
            userId: comment.post.authorId,
            type: 'Comment',
            actorId: userId,
            postId
        }
    })
    return {comment, notification}
}

exports.createCommentOnComment = async(userId, commentId, content = null, picture_url = null, public_id = null) => {
    const comment =  await prisma.comment.create({
        data: {
            author: {
                connect: {
                    id: userId
                }
            },
            commentOn: {
                connect: {
                    id: commentId
                }
            },
            content,
            picture_url,
            public_id
        },
        include: {
            commentOn: {
                select: {
                    authorId: true,
                    comments: {
                        select: {
                            authorId: true
                        }
                    }
                }
            }
        }
    })
    const notificationsData = comment.commentOn.comments.map((comment) => ({
        data: {
            userId: comment.authorId,
            type: 'Comment',
            actorId: userId,
            commentId,
        }
    }))
    await prisma.notification.createMany({
        data: notificationsData
    })
    const notification = await prisma.notification.create({
        data: {
            userId: comment.commentOn.authorId,
            type: 'Comment',
            actorId: userId,
            commentId,
        }
    })
    return {comment, notification}
}

exports.deleteComment = async(id) => {
    return await prisma.comment.delete({
        where: {
            id
        }
    })
}

exports.likeComment = async(userId, commentId) => {
    const like =  await prisma.like.create({
        data: {
            user: {
                connect: {
                    id: userId
                }
            },
            comment: {
                connect: {
                    id: commentId
                }
            }
        },
        include: {
            comment: {
                select: {
                    authorId: true
                }
            },
            user: {
                omit: {
                    password: true,
                    username: true,
                    bio: true,
                    pw_set: true,
                }
            }
        }
    })
    const notification = await prisma.notification.create({
        data: {
            userId: like.comment.authorId,
            type: 'Like',
            actorId: userId,
            commentId,
        }
    })
    return {like, notification};
}

exports.removeCommentLike = async(userId, commentId) => {
    return await prisma.like.delete({
        where: {
            userId_commentId: {userId, commentId}
        }
    })
}