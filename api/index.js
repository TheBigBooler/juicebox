const express = require('express');
const apiRouter = express.Router();

//imports routes for each endpoint
const usersRouter = require ('./users');
const postsRouter = require('./posts')
const tagsRouter = require('./tags')

//attaches routes to base /api/ route
apiRouter.use('/users', usersRouter)
apiRouter.use('/posts', postsRouter)
apiRouter.use('/tags', tagsRouter)


module.exports = apiRouter;