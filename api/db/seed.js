const prisma = require('./client');
const { faker } = require('@faker-js/faker');

const postImages = [
    "https://res.cloudinary.com/djwkdoyoi/image/upload/v1747082573/pexels-souvenirpixels-417074_vpecjw.jpg",
    "https://res.cloudinary.com/djwkdoyoi/image/upload/v1747082573/pexels-souvenirpixels-414612_oxdn0m.jpg",
    "https://res.cloudinary.com/djwkdoyoi/image/upload/v1747082572/morskie-oko-tatry_1045114-186_jbi6zm.avif",
    "https://res.cloudinary.com/djwkdoyoi/image/upload/v1747082571/medium-twfnp2-beautiful-waterfall-nature-view-large-size-high-original-imafwy37qv2b5g3v_jzbmyr.webp",
    "https://res.cloudinary.com/djwkdoyoi/image/upload/v1747082571/istockphoto-517188688-1024x1024_k0v5x7.jpg",
    "https://res.cloudinary.com/djwkdoyoi/image/upload/v1747082570/free-nature-images_cb1gyd.jpg",
    "https://res.cloudinary.com/djwkdoyoi/image/upload/v1747139258/nature_pqeovc.jpg",
    "https://res.cloudinary.com/djwkdoyoi/image/upload/v1747139257/Soothing-nature-backgrounds-2_csy27j.webp",
    "https://res.cloudinary.com/djwkdoyoi/image/upload/v1747139253/Jean_Trebek_Beauty_in_Nature_yjlrrb.jpg",
    "https://res.cloudinary.com/djwkdoyoi/image/upload/v1747139252/hq720_ebzimf.jpg",
    "https://res.cloudinary.com/djwkdoyoi/image/upload/v1747139252/1693432526985_cnsdy8.png",
    "https://res.cloudinary.com/djwkdoyoi/image/upload/v1747139251/092717_NatureMuseum-473_2024-03-28-194159_jaul_gfobtb.jpg",
    "https://res.cloudinary.com/djwkdoyoi/image/upload/v1747139251/AdobeStock_115649942_d5nuvy.webp"
];

async function main() {
    const alreadySeeded = await prisma.user.findFirst();
    if (alreadySeeded) {
        console.log("Database already seeded. Skipping.");
        return;
    }

    const users = await Promise.all(
        // eslint-disable-next-line no-unused-vars
        Array.from({ length: 50 }).map(async (_, __) => {
            return await prisma.user.create({
                data: {
                    first_name: faker.person.firstName(),
                    last_name: faker.person.lastName(),
                    username: faker.internet.username(),
                    password: "123456",
                    pw_set: true,
                    isPublic: Math.random() > 0.5,
                    picture_url: faker.image.avatar(),
                },
            });
        })
    );

    const posts = await Promise.all(
        Array.from({ length: 100 }).map(async () => {
            const withImage = Math.random() > 0.7;
            return await prisma.post.create({
                data: {
                    author: {
                        connect: {
                            id: faker.helpers.arrayElement(users).id,
                        },
                    },
                    content: faker.lorem.paragraph(3),
                    createdAt: faker.date.recent(),
                    picture_url: withImage
                        ? faker.helpers.arrayElement(postImages)
                        : null,
                },
            });
        })
    );

    const topComments = await Promise.all(
        Array.from({ length: 200 }).map(() =>
            prisma.comment.create({
                data: {
                    author: {
                        connect: { id: faker.helpers.arrayElement(users).id },
                    },
                    post: {
                        connect: { id: faker.helpers.arrayElement(posts).id },
                    },
                    content: faker.lorem.sentence(),
                    createdAt: faker.date.recent(),
                    picture_url:
                        Math.random() < 0.35
                            ? faker.helpers.arrayElement(postImages)
                            : null,
                },
            })
        )
    );

    await Promise.all(
        Array.from({ length: 100 }).map(() => {
            const parent = faker.helpers.arrayElement(topComments);
            return prisma.comment.create({
                data: {
                    author: {
                        connect: { id: faker.helpers.arrayElement(users).id },
                    },
                    post: { connect: { id: parent.postId } },
                    commentOn: { connect: { id: parent.id } },
                    content: faker.lorem.sentence(),
                    createdAt: faker.date.recent(),
                    picture_url:
                        Math.random() < 0.3
                            ? faker.helpers.arrayElement(postImages)
                            : null,
                },
            });
        })
    );

    const postLikeSet = new Set();
    while (postLikeSet.size < 500) {
        const user = users[Math.floor(Math.random() * users.length)];
        const post = posts[Math.floor(Math.random() * posts.length)];
        const key = `${user.id}-${post.id}`;

        if (!postLikeSet.has(key)) {
            try {
                await prisma.like.create({
                    data: {
                        user: { connect: { id: user.id } },
                        post: { connect: { id: post.id } },
                    },
                });
                postLikeSet.add(key);
            } catch (err) {
                console.error("Error creating post like:", err);
            }
        }
    }

    const commentLikeSet = new Set();
    while (commentLikeSet.size < 500) {
        const user = users[Math.floor(Math.random() * users.length)];
        const comment =
            topComments[Math.floor(Math.random() * topComments.length)];
        const key = `${user.id}-${comment.id}`;

        if (!commentLikeSet.has(key)) {
            try {
                await prisma.like.create({
                    data: {
                        user: { connect: { id: user.id } },
                        comment: { connect: { id: comment.id } },
                    },
                });
                commentLikeSet.add(key);
            } catch (err) {
                console.error("Error creating comment like:", err);
            }
        }
    }
    const followSet = new Set();
    while (followSet.size < 600) {
        const follower = users[Math.floor(Math.random() * users.length)];
        const following = users[Math.floor(Math.random() * users.length)];

        if (follower.id === following.id) continue;

        const key = `${follower.id}-${following.id}`;
        if (!followSet.has(key)) {
            try {
                await prisma.follow.create({
                    data: {
                        followerId: follower.id,
                        followingId: following.id,
                    },
                });
                followSet.add(key);
            } catch (err) {
                console.error("Error creating follow:", err);
            }
        }
    }

    console.log("Seeded successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });