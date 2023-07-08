const Pool = require("pg").Pool;

const pool = new Pool({
  user: "me",
  host: "localhost",
  database: "juiceboxdev",
  password: "Platypus123!",
  port: 5432,
});

const getAllUsers = async () => {
  const { rows } = await pool.query(
    `SELECT id, username, name, location, active
        FROM users;`
  );
  return rows;
};

const createUser = async ({ username, password, name, location }) => {
  try {
    const { rows: [ user ] } = await pool.query(
      `
            INSERT INTO users (username, password, name, location) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING RETURNING *;
        `,
      [username, password, name, location]
    );

    return user;
  } catch (error) {
    throw error;
  }
};

async function updateUser(id, fields = {}) {
  // build the set string
  const setString = Object.keys(fields).map(
    (key, index) => `"${ key }"=$${ index + 1 }`
  ).join(', ');

  // return early if this is called without fields
  if (setString.length === 0) {
    return;
  }

  try {
    const { rows: [ user ] } = await pool.query(`
      UPDATE users
      SET ${ setString }
      WHERE id=${id}
      RETURNING *;
    `, Object.values(fields));

    return user;
  } catch (error) {
    throw error;
  }
}

const createPost = async ({ authorId, title, content, tags = [] }) => {
  try {
    const { rows: [ post ] } = await pool.query(
    `INSERT INTO posts ("authorId", title, content) VALUES ($1, $2, $3) RETURNING *;`,
    [authorId, title, content]);

    const tagList = await createTags(tags);

    return await addTagsToPost(post.id, tagList);
  } catch (error) {
    throw error; 
  }
}

async function updatePost(postId, fields = {}) {
  // read off the tags & remove that field
  const { tags } = fields; // might be undefined
  delete fields.tags;

  // build the set string
  const setString = Object.keys(fields)
    .map((key, index) => `"${key}"=$${index + 1}`)
    .join(', ');

  try {
    // update any fields that need to be updated
    if (setString.length > 0) {
      await pool.query(
        `
        UPDATE posts
        SET ${setString}
        WHERE id=${postId}
        RETURNING *;
      `,
        Object.values(fields)
      );
    }

    // return early if there's no tags to update
    if (tags === undefined) {
      return await getPostById(postId);
    }

    // make any new tags that need to be made
    const tagList = await createTags(tags);
    const tagListIdString = tagList.map((tag) => `${tag.id}`).join(', ');

    // delete any post_tags from the database which aren't in that tagList
    await pool.query(
      `
      DELETE FROM post_tags
      WHERE "tagId"
      NOT IN (${tagListIdString})
      AND "postId"=$1;
    `,
      [postId]
    );

    // and create post_tags as necessary
    await addTagsToPost(postId, tagList);

    return await getPostById(postId);
  } catch (error) {
    throw error;
  }
}

const getAllPosts = async () => {
  try {
    const { rows: postIds } = await pool.query(`
      SELECT id
      FROM posts;
    `);

    const posts = await Promise.all(
      postIds.map((post) => getPostById(post.id))
    );

    return posts;
  } catch (error) {
    throw error;
  }
};

async function getPostsByUser(userId) {
  try {
    const { rows: postIds } = await pool.query(
      `
      SELECT id 
      FROM posts 
      WHERE "authorId"=$1;
    `,
      [userId]
    );

    const posts = await Promise.all(
      postIds.map((post) => getPostById(post.id))
    );

    return posts;
  } catch (error) {
    throw error;
  }
}

const getUserById = async (userId) => {
    try {
      const {
        rows: [user],
      } = await pool.query(`
      SELECT id, username, name, location, active
      FROM users
      WHERE id=${userId}
    `);

      if (!user) {
        return null;
      }

      user.posts = await getPostsByUser(userId);
      return user;
    } catch (error) {
      throw error;
    }
}

const createTags = async (tagList) => {
  if (tagList.length === 0) {
    return;
  }

  const insertValues = tagList.map((_, index) => `$${index + 1}`).join('), (');

  const selectValues = tagList.map((_, index) => `$${index + 1}`).join(', ');
  try {
    await pool.query(`
    INSERT INTO tags (name) 
    VALUES (${insertValues})
    ON CONFLICT (name) DO NOTHING;`,
    tagList)

    const { rows } = await pool.query(`
    SELECT * FROM tags
    WHERE name
    IN (${selectValues});`, 
    tagList)
    console.log(rows)
    return rows;


  } catch (error) {
    throw error;
  }
}

async function createPostTag(postId, tagId) {
  try {
    await pool.query(
      `
      INSERT INTO post_tags("postId", "tagId")
      VALUES ($1, $2)
      ON CONFLICT ("postId", "tagId") DO NOTHING;
    `,
      [postId, tagId]
    );
  } catch (error) {
    throw error;
  }
}

async function addTagsToPost(postId, tagList) {
  try {
    const createPostTagPromises = tagList.map((tag) =>
      createPostTag(postId, tag.id)
    );

    await Promise.all(createPostTagPromises);

    return await getPostById(postId);
  } catch (error) {
    throw error;
  }
}

async function getPostById(postId) {
  try {
    const {
      rows: [post],
    } = await pool.query(
      `
      SELECT *
      FROM posts
      WHERE id=$1;
    `,
      [postId]
    );

    const { rows: tags } = await pool.query(
      `
      SELECT tags.*
      FROM tags
      JOIN post_tags ON tags.id=post_tags."tagId"
      WHERE post_tags."postId"=$1;
    `,
      [postId]
    );

    const {
      rows: [author],
    } = await pool.query(
      `
      SELECT id, username, name, location
      FROM users
      WHERE id=$1;
    `,
      [post.authorId]
    );

    post.tags = tags;
    post.author = author;

    delete post.authorId;

    return post;
  } catch (error) {
    throw error;
  }
}

async function getPostsByTagName(tagName) {
  try {
    const { rows: postIds } = await pool.query(
      `
      SELECT posts.id
      FROM posts
      JOIN post_tags ON posts.id=post_tags."postId"
      JOIN tags ON tags.id=post_tags."tagId"
      WHERE tags.name=$1;
    `,
      [tagName]
    );

    return await Promise.all(postIds.map((post) => getPostById(post.id)));
  } catch (error) {
    throw error;
  }
} 

const getAllTags = async () => {
  try {
    const {rows} = await pool.query(`
    SELECT * FROM tags`)

    return rows;
  } catch (error) {
    throw error;
  }
}

async function getUserByUsername(username) {
  try {
    const {
      rows: [user],
    } = await pool.query(
      `
      SELECT *
      FROM users
      WHERE username=$1;
    `,
      [username]
    );

    return user;
  } catch (error) {
    throw error;
  }
}

module.exports = { pool, getAllUsers, createUser, updateUser, createPost, updatePost, getAllPosts, getPostsByUser, getUserById, createTags, createPostTag, addTagsToPost, getPostById, getPostsByTagName, getAllTags, getUserByUsername };
