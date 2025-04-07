const prisma = require('./client');
const { faker } = require('@faker-js/faker');


const main = async() => {
    const users = [];
    for(let i=0; i < 15; i++) {
        try {
            const user = await prisma.user.create({
                data: {
                    first_name: faker.person.firstName(),
                    last_name: faker.person.lastName(),
                    username: faker.person.firstName(),
                    password: '123456',
                    pw_set: true
                }
            })
            users.push(user)
        } catch(err) {
            console.log(err)
        }
    }
    const posts = [];
    for(let i=0; i < 15; i++) {
        try {
            const post = await prisma.post.create({
                data: {
                    author: {
                        connect: {
                            id: users[Math.floor(Math.random() * users.length)].id
                        }
                    },
                    content: faker.lorem.paragraph(3),
                }
            })
            posts.push(post)
        } catch(err) {
            console.log(err)
        }
    }
    const postsComments = [];
    for(let i=0; i < 20; i++) {
        try {
            const comment = await prisma.comment.create({
                data: {
                    author: {
                        connect: {
                            id: users[Math.floor(Math.random() * users.length)].id
                        }
                    },
                    content: faker.lorem.paragraph(1),
                    post: {
                        connect: {
                            id: posts[Math.floor(Math.random() * posts.length)].id
                        }
                    },
                }
            })
            postsComments.push(comment)
        } catch(err) {
            console.log(err)
        }
    }
    const commentsComments = [];
    for(let i=0; i < 15; i++) {
        try {
            const index = Math.floor(Math.random() * postsComments.length);
            const comment = await prisma.comment.create({
                data: {
                    author: {
                        connect: {
                            id: users[Math.floor(Math.random() * users.length)].id
                        }
                    },
                    content: faker.lorem.paragraph(1),
                    post: {
                        connect: {
                            id: postsComments[index].postId
                        }
                    },
                    commentOn: {
                        connect: {
                            id: postsComments[index].id
                        }
                    }
                }
            })
            commentsComments.push(comment)
        } catch(err) {
            console.log(err)
        }
    }
    const postLikes = [];
    for(let i=0; i < 20; i++) {
        try {
            const like = await prisma.like.create({
                data: {
                    user: {
                        connect: {
                            id: users[Math.floor(Math.random() * users.length)].id
                        }
                    },
                    post: {
                        connect: {
                            id: posts[Math.floor(Math.random() * posts.length)].id
                        }
                    },
                }
            })
            postLikes.push(like)
        } catch (err) {
            console.log(err)
        }
    }
    const commentLikes = [];
    for(let i=0; i < 15; i++) {
        try {
            const like = await prisma.like.create({
                data: {
                    user: {
                        connect: {
                            id: users[Math.floor(Math.random() * users.length)].id
                        }
                    },
                    comment: {
                        connect: {
                            id: postsComments[Math.floor(Math.random() * postsComments.length)].id
                        }
                    },
                }
            })
            commentLikes.push(like)
        } catch (err) {
            console.log(err)
        }
    }
    const requests = [];
    for(let i=0; i < 20; i++) {
        try {
            const request = await prisma.request.create({
                data: {
                    status: 'Pending',
                    senderId: users[Math.floor(Math.random() * users.length)].id,
                    receiverId: users[Math.floor(Math.random() * users.length)].id,
                }
            })
            requests.push(request)
        } catch (err) {
            console.log(err)
        }
    }
}

async function antozz_following () {
    const users = await prisma.user.findMany({
        where: {
            username: {
                not: '3antozz'
            }
        }
    })
    users.forEach(async user => {
        try {
            await prisma.follow.create({
                data: {
                    followerId: 22,
                    followingId: user.id,
                }
            })
        } catch (err) {
            console.log(err)
        }
    }) 
    // for(let i=0; i < 10; i++) {
    //     try {
    //         await prisma.follow.create({
    //             data: {
    //                 followerId: 16,
    //                 followingId: users[Math.floor(Math.random() * users.length)].id,
    //             }
    //         })
    //     } catch (err) {
    //         console.log(err)
    //     }
    // }
}

async function antozz () {
    const antozz = await prisma.user.findUnique({
        where: {
            username: '3antozz'
        },
        include: {
            following: true,
            followers: true,
            posts: true
        }
    })
    console.log(antozz)
}
antozz_following();
// antozz();

// main().then(() => console.log('Seeding completed.')).catch((e) => console.error(e))