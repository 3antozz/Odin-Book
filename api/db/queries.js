const prisma = require('./client');

// User Queries ____________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________
// 
exports.createUser = async(username, first_name, last_name, password, picture_url = null, bio = null, pwSet) => {
    return await prisma.user.create({
        data: {
            username,
            first_name,
            last_name,
            password,
            picture_url,
            bio,
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

exports.getProfile = async(userId) => {
    return await prisma.user.findUnique({
        where: {
            id: userId
        },
        omit: {
            password: true,
            pw_set: true,
            username: true
        },
        include: {
            posts: {
                include: {
                    _count: {
                        select: {
                            comments: true,
                            likes: true
                        }
                    },
                    author: {
                        omit: {
                            password: true,
                            bio: true,
                            pw_set: true,
                            username: true
                        }
                    },
                    likes: {
                        where: {
                            userId
                        }
                    },
                },
            }
        }
    })
}

exports.getAllUsers = async(userId) => {
    return await prisma.user.findMany({
        where: {
            id: {
                not: userId
            },
            followers: {
                some: {
                    NOT: {
                        id: userId
                    }
                }
            },
            received_requests: {
                some: {
                    NOT: {
                        id: userId
                    }
                }
            }
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
            notifications_received: {
                // where: {
                //     user: {
                //         username: {
                //             not: {
                //                 equals: username
                //             }
                //         }
                //     }
                // },
                include: {
                    actor: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            picture_url: true
                        }
                    }
                }
            },
            sent_requests: true
        }
    })
}

exports.updateUserPw = async(id, password, first_name, last_name) => {
    return await prisma.user.update({
        where: {
            id
        },
        data: {
            first_name,
            last_name,
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

exports.getFullPost = async(id) => {
    return await prisma.post.findUnique({
        where: {
            id
        },
        include: {
            author: {
                omit: {
                    password: true,
                    bio: true,
                    pw_set: true,
                    username: true
                }
            },
            likes: {
                include: {
                    user: {
                        omit: {
                            password: true,
                            bio: true,
                            pw_set: true,
                            username: true
                        } 
                    }
                },
                orderBy: [
                    {
                        user: {
                            first_name: 'asc'
                        }
                    },
                    {
                        user: {
                            last_name: 'asc'
                        },
                    }
                ]
            },
            comments: {
                where: {
                    commentOnId: null
                },
                include: {
                    author: {
                        omit: {
                            password: true,
                            bio: true,
                            pw_set: true,
                            username: true
                        }
                    },
                    likes: {
                        include: {
                            user: {
                                omit: {
                                    password: true,
                                    bio: true,
                                    pw_set: true,
                                    username: true
                                } 
                            }
                        },
                        orderBy: [
                            {
                                user: {
                                    first_name: 'asc'
                                }
                            },
                            {
                                user: {
                                    last_name: 'asc'
                                },
                            }
                        ]
                    },
                    comments: {
                        include: {
                            author: {
                                omit: {
                                    password: true,
                                    bio: true,
                                    pw_set: true,
                                    username: true
                                }
                            },
                            likes: {
                                include: {
                                    user: {
                                        omit: {
                                            password: true,
                                            bio: true,
                                            pw_set: true,
                                            username: true
                                        } 
                                    }
                                },
                                orderBy: [
                                    {
                                        user: {
                                            first_name: 'asc'
                                        }
                                    },
                                    {
                                        user: {
                                            last_name: 'asc'
                                        },
                                    }
                                ]
                            },
                            comments: true
                        },
                        orderBy: {
                            createdAt: 'desc'
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }
        }
    })
}

exports.getAllPosts = async() => {
    return await prisma.post.findMany({
        include: {
            author: {
                omit: {
                    password: true,
                    bio: true,
                    pw_set: true,
                    username: true
                }
            },
            likes: {
                include: {
                    user: {
                        omit: {
                            password: true,
                            bio: true,
                            pw_set: true,
                            username: true
                        } 
                    }
                },
                orderBy: [
                    {
                        user: {
                            first_name: 'asc'
                        }
                    },
                    {
                        user: {
                            last_name: 'asc'
                        },
                    }
                ]
            },
            comments: {
                include: {
                    author: {
                        omit: {
                            password: true,
                            bio: true,
                            pw_set: true,
                            username: true
                        }
                    },
                    likes: {
                        include: {
                            user: {
                                omit: {
                                    password: true,
                                    bio: true,
                                    pw_set: true,
                                    username: true
                                } 
                            }
                        },
                        orderBy: [
                            {
                                user: {
                                    first_name: 'asc'
                                }
                            },
                            {
                                user: {
                                    last_name: 'asc'
                                },
                            }
                        ]
                    },
                    comments: {
                        include: {
                            author: {
                                omit: {
                                    password: true,
                                    bio: true,
                                    pw_set: true,
                                    username: true
                                }
                            },
                            likes: {
                                include: {
                                    user: {
                                        omit: {
                                            password: true,
                                            bio: true,
                                            pw_set: true,
                                            username: true
                                        } 
                                    }
                                },
                                orderBy: [
                                    {
                                        user: {
                                            first_name: 'asc'
                                        }
                                    },
                                    {
                                        user: {
                                            last_name: 'asc'
                                        },
                                    }
                                ]
                            },
                        },
                        orderBy: {
                            createdAt: 'desc'
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })
}

exports.getFollowingPosts = async(userId) => {
    return await prisma.post.findMany({
        where: {
            OR: [
                {
                    author: {
                        followers: {
                            some: {
                                followerId: userId
                            }
                        }
                    }
                },
                {
                    authorId: userId
                }
            ]
        },
        include: {
            _count: {
                select: {
                    comments: true,
                    likes: true
                }
            },
            author: {
                omit: {
                    password: true,
                    bio: true,
                    pw_set: true,
                    username: true
                }
            },
            likes: {
                where: {
                    userId
                }
            },
        },
    })
}

// exports.getFollowingPosts = async(userId) => {
//     return await prisma.post.findMany({
//         where: {
//             OR: [
//                 {
//                     author: {
//                         followers: {
//                             some: {
//                                 followerId: userId
//                             }
//                         }
//                     }
//                 },
//                 {
//                     authorId: userId
//                 }
//             ]
//         },
//         include: {
//             author: {
//                 omit: {
//                     password: true,
//                     bio: true,
//                     pw_set: true,
//                     username: true
//                 }
//             },
//             likes: {
//                 include: {
//                     user: {
//                         omit: {
//                             password: true,
//                             bio: true,
//                             pw_set: true,
//                             username: true
//                         } 
//                     }
//                 },
//                 orderBy: [
//                     {
//                         user: {
//                             first_name: 'asc'
//                         }
//                     },
//                     {
//                         user: {
//                             last_name: 'asc'
//                         },
//                     }
//                 ]
//             },
//             comments: {
//                 include: {
//                     author: {
//                         omit: {
//                             password: true,
//                             bio: true,
//                             pw_set: true,
//                             username: true
//                         }
//                     },
//                     likes: {
//                         include: {
//                             user: {
//                                 omit: {
//                                     password: true,
//                                     bio: true,
//                                     pw_set: true,
//                                     username: true
//                                 } 
//                             }
//                         },
//                         orderBy: [
//                             {
//                                 user: {
//                                     first_name: 'asc'
//                                 }
//                             },
//                             {
//                                 user: {
//                                     last_name: 'asc'
//                                 },
//                             }
//                         ]
//                     },
//                     comments: {
//                         include: {
//                             author: {
//                                 omit: {
//                                     password: true,
//                                     bio: true,
//                                     pw_set: true,
//                                     username: true
//                                 }
//                             },
//                             likes: {
//                                 include: {
//                                     user: {
//                                         omit: {
//                                             password: true,
//                                             bio: true,
//                                             pw_set: true,
//                                             username: true
//                                         } 
//                                     }
//                                 },
//                                 orderBy: [
//                                     {
//                                         user: {
//                                             first_name: 'asc'
//                                         }
//                                     },
//                                     {
//                                         user: {
//                                             last_name: 'asc'
//                                         },
//                                     }
//                                 ]
//                             },
//                         },
//                         orderBy: {
//                             createdAt: 'desc'
//                         }
//                     }
//                 },
//                 orderBy: {
//                     createdAt: 'desc'
//                 }
//             }
//         },
//         orderBy: {
//             createdAt: 'desc'
//         }
//     })
// }

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
        },
        include: {
            author: {
                omit: {
                    password: true,
                    bio: true,
                    pw_set: true,
                    username: true
                }
            },
            _count: {
                select: {
                    comments: true,
                    likes: true
                }
            },
            comments: {
                select: {
                    _count: {
                        select: {
                            comments: true
                        }
                    }
                },
            },
            likes: true
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
            },
            user: {
                omit: {
                    password: true,
                    bio: true,
                    pw_set: true,
                    username: true
                } 
            }
        }
    })
    if(like.post.authorId === userId) {
        return {like, notification: null}
    }
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
            author: {
                omit: {
                    password: true,
                    bio: true,
                    pw_set: true,
                    username: true
                }
            },
            post: {
                select: {
                    authorId: true
                }
            },
            comments: true,
            likes: true
        }
    })
    if(comment.post.authorId === userId) {
        return {comment, notification: null}
    }
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

exports.createCommentOnComment = async(userId, postId, commentId, content = null, picture_url = null, public_id = null) => {
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
            author: {
                omit: {
                    password: true,
                    bio: true,
                    pw_set: true,
                    username: true
                }
            },
            commentOn: {
                select: {
                    authorId: true,
                    comments: {
                        select: {
                            authorId: true
                        }
                    }
                }
            },
            comments: true,
            likes: true
        }
    })
    const notificationsData = comment.commentOn.comments
    .filter(comment => comment.authorId !== userId)
    .map((comment) => (
        {
            userId: comment.authorId,
            type: 'Comment',
            actorId: userId,
            commentId,
        }
    ))
    const notifications =  await prisma.notification.createMany({
        data: notificationsData
    })
    if(comment.commentOn.authorId === userId) {
        return {comment, notification: notifications[0]}
    }
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
    if(like.comment.authorId === userId) {
        return {like, notification: null}
    }
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