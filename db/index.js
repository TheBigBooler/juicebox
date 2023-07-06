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

const createPost = async ({ authorId, title, content }) => {
  try {
    const { rows } = await pool.query(
    `INSERT INTO posts ("authorId", title, content) VALUES ($1, $2, $3) RETURNING *;`,
    [authorId, title, content]);

    return rows;
  } catch (error) {
    throw error; 
  }
}

async function updatePost(id, fields = {}) {
  
  const setString = Object.keys(fields)
    .map((key, index) => `"${key}"=$${index + 1}`)
    .join(', ');

  if (setString.length === 0) {
    return;
  }

  try {
    const {
      rows: [post],
    } = await pool.query(
      `
      UPDATE posts
      SET ${setString}
      WHERE id=${id}
      RETURNING *;
    `,
      Object.values(fields)
    );

    return post;
  } catch (error) {
    throw error;
  }
}

const getAllPosts = async () => {
  const { rows } = await pool.query(
    `SELECT id, "authorId", title, content
        FROM posts;`
  );
  return rows;
};

const getPostsByUser = async (userId) => {
  try {
    const { rows } = await pool.query(`
    SELECT * FROM posts
    WHERE "authorId"=$1;
    `, [userId]);

    return rows;

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

  const insertValues = tagList.map((_, index) => `$${index + 1}`).join("), (");

  const selectValues = tagList.map((_, index) => `$${index + 1}`).join(", ");
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

createTags(["#fisrt", "#best", "#glory-days"])
module.exports = { pool, getAllUsers, createUser, updateUser, createPost, updatePost, getAllPosts, getPostsByUser, getUserById, createTags };
