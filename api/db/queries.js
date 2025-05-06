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

exports.getProfile = async(userId, clientId = 0) => {
    if(clientId === 0) {
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
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        posts: true
                    }
                },
            }
        })
    }
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
            _count: {
                select: {
                    followers: true,
                    following: true
                }
            },
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
                            userId: clientId
                        }
                    },
                },
                orderBy: {
                    createdAt: 'desc'
                }
            },
            followers: {
                where: {
                    followerId: clientId
                },
                select: {
                    id: true
                }
            },
            sent_requests: {
                where: {
                    receiverId: clientId
                },
                select: {
                    status: true
                }
            },
            received_requests: {
                where: {
                    senderId: clientId
                },
                select: {
                    status: true
                }
            }
        }
    })
}

exports.updateProfile = async(userId, first_name = null, last_name = null, bio = '', url = null) => {
    const data = {
        bio
    };
    if(first_name) data.first_name = first_name;
    if(last_name) data.last_name = last_name;
    if(url) data.picture_url = url
    return prisma.user.update({
        where: {
            id: userId
        },
        data: data,
        omit: {
            username: true,
            password: true,
            pw_set: true,
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
    const user = await prisma.user.findUnique({
        where: {
            username
        },
        omit: {
            password: true
        },
        include: {
            received_requests: true,
            notifications_received: {
                where: {
                    seen: false
                },
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
            following: {
                select: {
                    followingId: true
                }
            }
        }
    })
    const seenNotifications = await prisma.notification.findMany({
        where: {
            userId: user.id,
            seen: true
        },
        include: {
            actor: {
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    picture_url: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 20
    })
    user.notifications_received = [...user.notifications_received, ...seenNotifications]
    return user;
}

exports.getUserFollowage = async(userId, clientId = 0, type, type2) => {
    return await prisma.user.findUnique({
        where: {
            id: userId
        },
        omit: {
            username: true,
            password: true,
            bio: true,
            pw_set: true,
            join_date:true
        },
        include: {
            [type]: {
                include: {
                    [type2]: {
                        omit: {
                            username: true,
                            password: true,
                            bio: true,
                            pw_set: true,
                            join_date:true
                        },
                        include: {
                            followers: {
                                where: {
                                    followerId: clientId
                                },
                                select: {
                                    id: true
                                }
                            },
                            received_requests: {
                                where: {
                                    senderId: clientId
                                },
                                select: {
                                    status: true
                                }
                            }
                        }
                    },
                }
            },
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

exports.setSeenNotifications = async(userId) => {
    try {
        await prisma.notification.updateMany({
            where: {
                userId,
                seen: false
            },
            data: {
                seen: true
            }
        })
        return true;
    } catch(err) {
        console.log(err)
    }
}

exports.searchUsers = async(value, clientId) => {
    const q = value.trim();
    if (q.length < 2) {
      return [];
    }
    return await prisma.user.findMany({
        where: {
            id: {
                not: clientId
            },
            OR: [
                {
                    first_name: {
                        startsWith: q,
                        mode: 'insensitive'
                    },
                },
                {
                    last_name: {
                        startsWith: q,
                        mode: 'insensitive'
                    },
                },
                {
                    AND: [
                            { first_name: { startsWith: q.split(' ')[0], mode: 'insensitive' } },
                            { last_name:  { startsWith: q.split(' ')[1] || '', mode: 'insensitive' } },
                    ]
                }
            ]
        },
        omit: {
            password: true,
            bio: true,
            pw_set: true,
            username: true
        },
        orderBy: [
            { first_name: 'asc' },
            { last_name: 'asc' },
        ],
        take: 5
    })
}

exports.getMostFollowedUsers = async(clientId) => {
    return await prisma.user.findMany({
        where: {
            id: {
                not: clientId
            },
        },
        omit: {
            password: true,
            bio: true,
            pw_set: true,
            username: true
        },
        orderBy: {
            followers: {
                _count: 'desc'
            }
        },
        include: {
            _count: {
                select: {
                    followers: true
                }
            }
        },
        take: 3
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
        },
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
    })
    return {request, notification}
}

exports.acceptRequest = async(receiverId, senderId) => {
    const request = await prisma.$transaction([
        prisma.follow.create({
            data: {
                followerId: senderId,
                followingId: receiverId,
            },
            include: {
                following: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        picture_url: true
                    }
                },
                follower: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        picture_url: true
                    }
                }
            }
        }),
        prisma.request.delete({
            where: {
                senderId_receiverId: {senderId, receiverId}
            },
        })
        // await prisma.request.update({
        //     where: {
        //         senderId_receiverId: {senderId, receiverId}
        //     },
        //     data: {
        //         status: 'Accepted'
        //     }
        // })
    ])
    const notification = await prisma.notification.create({
        data: {
            userId: senderId,
            type: 'Request_accepted',
            actorId: receiverId,
        },
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
            followerId_followingId: {
                followerId: clientId,
                followingId: userId
            }
        }
    })
}

exports.removeFollower = async(clientId, userId) => {
    return await prisma.follow.delete({
        where: {
            followerId_followingId: {
                followerId: userId,
                followingId: clientId
            }
        }
    })
}

// Posts ____________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________
// 

exports.getFullPost = async(id, clientId = 0) => {
    return await prisma.post.findUnique({
        where: {
            id
        },
        include: {
            author: {
                include: {
                    followers: {
                        where: {
                            followerId: clientId
                        }
                    }
                },
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
                    post: {
                        select: {
                            authorId: true
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
                            post: {
                                select: {
                                    authorId: true
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

exports.getFollowingPosts = async(userId = 0) => {
    if(userId === 0) {
        return await prisma.post.findMany({
            where: {
                author: {
                    isPublic: true
                }
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
                },
                {
                    author: {
                        isPublic: true
                    }
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
        },
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
    })
    return {like, notification}
}

exports.removePostLike = async(userId, postId) => {
    return await prisma.like.delete({
        where: {
            userId_postId: {userId, postId}
        },
        include: {
            post: {
                select: {
                    authorId: true
                }
            },
        }
    })
}

exports.getPopularPosts = async(clientId = 0) => {
    if(clientId === 0) {
        return await prisma.post.findMany({
            where: {
                author: {
                    isPublic: true
                }
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
            },
            orderBy: {
                likes: {
                    _count: 'desc'
                }
            },
            take: 3
        })
    }
    return await prisma.post.findMany({
        where: {
            authorId: {
                not: clientId
            },
            author: {
                OR: [
                    {
                        followers: {
                        some: {followerId: clientId}
                        }
                    },
                    {
                        isPublic: true
                    }
                ]
            }
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
        },
        orderBy: {
            likes: {
                _count: 'desc'
            }
        },
        take: 3
    })
}

// Comments ____________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________
// 

exports.getComment = async(id) => {
    return await prisma.comment.findUnique({
        where: {
            id
        },
        include: {
            post: {
                select: {
                    authorId: true
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
            }
        }
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
        },
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
    })
    return {comment, notification}
}

exports.createCommentOnComment = async(userId, postId, postAuthorId, commentId, content = null, picture_url = null, public_id = null) => {
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
            post: {
                select: {
                    authorId: true
                }
            },
            comments: true,
            likes: true
        }
    })
    const createdUserNotifications = {[userId]: true, [comment.post.authorId]: true};
    const notificationsData = comment.commentOn.comments
    .filter(comment2 => {
        if(!createdUserNotifications[comment2.authorId]) {
            createdUserNotifications[comment2.authorId] = true;
            return true;
        }
        return false;
    })
    .map((comment2) => (
        {
            userId: comment2.authorId,
            type: 'Comment',
            actorId: userId,
            postId,
            postAuthorId,
            commentId,
        }
    ))
    if(comment.authorId !== comment.post.authorId) {
        notificationsData.push({
            userId: comment.post.authorId,
            type: 'Comment',
            actorId: userId,
            postId,
            postAuthorId,
            commentId,
        })
    }
    const notifications =  await prisma.notification.createManyAndReturn({
        data: notificationsData,
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
    })
    if(comment.commentOn.authorId === userId) {
        return {comment, notification: notifications[0], notifications}
    }
    const notification = await prisma.notification.create({
        data: {
            userId: comment.commentOn.authorId,
            type: 'Comment_Reply',
            actorId: userId,
            postId,
            postAuthorId,
            commentId,
        },
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
    })
    return {comment, notification, notifications}
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
                    id: true,
                    authorId: true,
                    postId: true,
                    commentOnId: true,
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
            postId: like.comment.postId
        },
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
    })
    return {like, notification};
}

exports.removeCommentLike = async(userId, commentId) => {
    return await prisma.like.delete({
        where: {
            userId_commentId: {userId, commentId}
        },
        include: {
            comment: {
                select: {
                    id: true,
                    authorId: true,
                    postId: true,
                    commentOnId: true,
                }
            },
        }
    })
}