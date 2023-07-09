const express = require("express");
const postsRouter = express.Router();
const { requireUser } = require('./utils');
const { getAllPosts, createPost } = require("../db");

postsRouter.use((req, res, next) => {
  console.log("A request is being made to /posts");

  next();
});

postsRouter.post('/', requireUser, async (req, res, next) => {
    const { title, content, tags = "" } = req.body;
    const authorId = req.user.id
    const tagArr = tags.trim().split(/\s+/)
    const postData = {};

    if (tagArr.length) {
        postData.tags = tagArr;
    }

    try {
        postData.authorId = authorId;
        postData.title = title;
        postData.content = content;

        const post = await createPost(postData)

        if (post) {
            res.send( { post });
        } 
    } catch ({ name, message}) {
        next({
          name: "MissingPostInformation",
          message: "Please include a title and content for your post",
        });
    }
});

postsRouter.get("/", async (req, res) => {
  const posts = await getAllPosts();

  res.send({
    posts
  });
});

module.exports = postsRouter;
