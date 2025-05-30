const express = require('express')
const path = require('node:path')
const cors = require('cors')
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const session = require('express-session');
require('dotenv').config()
require('./db/seed');
const passport = require('passport');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const prisma = require('./db/client')
const authRouter = require('./routes/auth')
const usersRouter = require('./routes/users')
const followageRouter = require('./routes/followage')
const postsRouter = require('./routes/posts')
const commentsRouter = require('./routes/comments')
const postsController = require('./controllers/posts')
const commentsController = require('./controllers/comments')
const usersController = require('./controllers/users')

const app = express();
const server = createServer(app);
const port = process.env.PORT || 3000
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", process.env.FRONTEND_URL],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    },
    
});


const allowedOrigins = [
    'http://localhost:5173',
    process.env.FRONTEND_URL
];
const corsOptions = {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200
};
const sessionMiddleware = session({
      cookie: {
        maxAge: 3 * 24 * 60 * 60 * 1000, // ms  3 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : false
      },
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      store: new PrismaSessionStore(
        prisma,
        {
          checkPeriod: 2 * 60 * 1000,  //ms
          dbRecordIdIsSessionId: true,
          dbRecordIdFunction: undefined,
        }
      )
    })
app.use(sessionMiddleware);
app.use(cors(corsOptions));
app.options('*', cors((corsOptions)))
app.set('trust proxy', 1)
app.use(passport.session());
app.use(express.json())
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.set('io', io)

io.on('connection', (socket) => {
  socket.on('join rooms', (followingIds) => {
    const socketId = socket.id;
    const allRooms = socket.rooms;
    const roomsToLeave = [...allRooms].filter(room => room !== socketId && !followingIds.includes(room));
    roomsToLeave.forEach(room => socket.leave(room));
    socket.join([`user${socket.handshake.query.userId}`, ...followingIds]);
  })
  socket.on('post like', async(postId, callback) => {
    try {
        const userId = +socket.handshake.query.userId;
        const {like, notification} = await postsController.likePost(userId, +postId)
        callback(like)
        if(userId !== like.post.authorId) {
          io.to(`user${like.post.authorId}`).emit('post like', like);
        }
        if(notification) {
          io.to(`user${like.post.authorId}`).emit('notification', notification);
        }
    } catch(err) {
        console.log(err);
        socket.emit('error', { message: "An error has occured" });
    }
  });
  socket.on('post unlike', async(postId, callback) => {
    try {
        const userId = +socket.handshake.query.userId;
        const like = await postsController.removePostLike(userId, +postId)
        callback(like)
        if(userId !== like.post.authorId) {
          io.to(`user${like.post.authorId}`).emit('post unlike', like);
        }
    } catch(err) {
        console.log(err);
        socket.emit('error', { message: "An error has occured" });
    }
  });
  socket.on('comment like', async(commentId, callback) => {
    try {
        const userId = +socket.handshake.query.userId;
        const {like, notification} = await commentsController.likeComment(userId, +commentId)
        callback(like)
        if(userId !== like.comment.authorId) {
          io.to(`user${like.comment.authorId}`).emit('comment like', like);
        }
        if(notification) {
          io.to(`user${like.comment.authorId}`).emit('notification', notification);
        }
    } catch(err) {
        console.log(err);
        socket.emit('error', { message: "An error has occured" });
    }
  });
  socket.on('comment unlike', async(commentId, callback) => {
    try {
        const userId = +socket.handshake.query.userId;
        const like = await commentsController.removeCommentLike(userId, +commentId)
        callback(like)
        if(userId !== like.comment.authorId) {
          io.to(`user${like.comment.authorId}`).emit('comment unlike', like);
        }
    } catch(err) {
        console.log(err);
        socket.emit('error', { message: "An error has occured" });
    }
  });
  socket.on('notifications seen', async(callback) => {
    try {
        const userId = +socket.handshake.query.userId;
        const status = await usersController.setSeenNotifications(userId)
        callback(status)
    } catch(err) {
        console.log(err);
        socket.emit('error', { message: "An error has occured" });
    }
  });
});


app.use('/', authRouter);
app.use('/users', usersRouter);
app.use('/followage', followageRouter);
app.use('/posts', postsRouter);
app.use('/comments', commentsRouter);


app.use((req, res, next) => {
    const error = new Error('404 Not Found')
    error.code = 404;
    next(error)
})



// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
    console.log(req.path)
    console.error("Global error handler caught:", error);
    if (Array.isArray(error)) {
        return res.status((typeof(error.code) !== 'string' && error.code) || 500).json({
            errors: error,
            code: error.code || 500
        });
    }
    if (error.code === 'P2025') {
        return res.status(404).json({
            message: "Resource Not Found",
            code: 404
        });
    }
    if (error.code === 'P2002') {
        return res.status(400).json({
            errors: ['Username already taken'],
            code: 400
        });
    }
    return res.status((typeof(error.code) !== 'string' && error.code) || 500).json({
        message: error.message || 'Internal Server Error',
        code: error.code || 500
    });
})





server.listen(port, () => console.log('Server Listening on port 3000'));
