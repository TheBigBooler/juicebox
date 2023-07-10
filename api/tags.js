const express = require("express");
const tagsRouter = express.Router();

const { getAllTags, getPostsByTagName } = require("../db");

tagsRouter.use((req, res, next) => {
  console.log("A request is being made to /tags");

  next();
});

tagsRouter.get("/", async (req, res) => {
  const tags = await getAllTags();

  res.send({
    tags,
  });
});

//find posts with tag name
tagsRouter.get('/:tagName/posts', async (req, res, next) => {
    const { tagName } = req.params
    
    try {
        const allPosts = await getPostsByTagName(tagName)

        const postsWithTag = allPosts.filter(post => {
            if (post.active) {
              return true;
            }
            if (req.user && post.author.id == req.user.id) {
              return true;
            }

            return false;
        })


        if (postsWithTag && postsWithTag.length > 0) {
        res.send(postsWithTag) 
    } else {
        next({
            name: "NoPostsFound",
            message: "No posts were found matching that tag name"
        })
    }
    } catch ({ name, message }) {
        next({name, message});
    }
})

module.exports = tagsRouter;
