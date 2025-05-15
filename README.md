# Odinbook

A full-stack social media application designed to provide seamless communication.

![App Interface](./client/public/showcase/interface.png)

## Signup page

![Signup Page](./client/public/showcase/sign-up.png)


## User Profile

![User Profile](./client/public/showcase/profile.png)

## Features

- Authentification with username/password AND Github Auth (cookies based)
- Real time interaction updates (posts, follow requests, comments, likes)
- Image sharing capabilities
- User connection and interaction

## Technologies Used

### Frontend

- Javascript
- React
- Vite
- Vercel
- Socket.IO

### Backend

- Express
- Nodejs
- PostgreSQL
- Prisma ORM
- Socket.IO
- Cloudinary
- OnRender
- Aiven

## Libraries Used

### Frontend

- [Lucide React](https://lucide.dev/guide/packages/lucide-react) – Import Icons
- [react-virtuoso](https://virtuoso.dev/) –  React component that displays large data sets using virtualized rendering (render when visible in viewport)
- [Socket.IO](https://socket.io/) – Low-latency, bidirectional and event-based communication between a client and a server for real time updates
- [date-fns](https://date-fns.org/docs/Getting-Started) – Used for manipulating JavaScript dates

### Backend

- [bcryptjs](https://www.npmjs.com/package/bcryptjs) – For securing passwords by hashing and salting.
- [express-session](https://www.npmjs.com/package/express-session) – Simple session middleware for Authenticating.
- [passport](https://www.npmjs.com/package/passport) – Express-compatible authentication middleware for Node.js.
- [passport-local](https://www.npmjs.com/package/passport-local) – This module lets you authenticate using a username and password in your Node.js applications.
- [passport-github2](https://www.npmjs.com/package/passport-github2) – This module lets you authenticate using GitHub OAuth 2.0 in your Node.js applications. 
- [express-validator](https://www.npmjs.com/package/express-validator) – User input validation middleware.
- [cloudinary](https://cloudinary.com/) – Images storage service
- [multer](https://www.npmjs.com/package/multer) – Node.js middleware for handling multipart/form-data, used for uploading files.
- [express-async-handler](https://www.npmjs.com/package/express-async-handler) – Asynchronous exception-handling middleware.
- [Socket.IO](https://socket.io/) – Low-latency, bidirectional and event-based communication between a client and a server for real time updates
- [cors](https://www.npmjs.com/package/cors) – Package for providing a Connect/Express middleware that can be used to enable CORS
