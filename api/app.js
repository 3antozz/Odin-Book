const express = require('express')
const path = require('node:path')
const cors = require('cors')
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const session = require('express-session');
require('dotenv').config()
const passport = require('passport');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const prisma = require('./db/client')
const authRouter = require('./routes/auth')
const usersRouter = require('./routes/users')

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
app.use(
    session({
      cookie: {
       maxAge: 15 * 60 * 1000, // ms
    //    secure: true
      },
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: new PrismaSessionStore(
        prisma,
        {
          checkPeriod: 2 * 60 * 1000,  //ms
          dbRecordIdIsSessionId: true,
          dbRecordIdFunction: undefined,
        }
      )
    })
  );

app.use(cors(corsOptions));
app.options('*', cors((corsOptions)))
app.set('trust proxy', 1)
app.use(passport.session());
app.use(express.json())
// app.use(cookieParser())
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.set('io', io)


io.on('connection', (socket) => {
    console.log(socket.id)
});


app.use('/', authRouter);
app.use('/users', usersRouter);


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
        return res.status(400).json({
            message: "Resource Not Found",
            code: 400
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
