const {
  pool,
  getAllUsers,
  createUser,
  updateUser,
  createPost,
  updatePost,
  getAllPosts,
  getPostsByUser,
  getUserById,
} = require("./index");

const testDB = async () => {
    try {
        //get all users
        console.log('Starting to test database...');
        const users = await getAllUsers();
        console.log("getAllUsers:", users);
        //update user
        console.log("Calling updateUser on users[0]");
        const updateUserResult = await updateUser(users[0].id, {
            name: "Newname Sogood",
            location: "Lesterville, KY"
        });
        console.log("Update user:", updateUserResult);
        //get all posts
        console.log("Calling getAllPosts");
        const posts = await getAllPosts();
        console.log("Result:", posts);
        //update post
        console.log("Calling updatePost on posts[0]");
        const updatePostResult = await updatePost(posts[0].id, {
            title: "New Title",
            content: "Updated Content"
        });
        console.log("Result:", updatePostResult)
        //get user by ID
        console.log("Calling getUserById with 1");
        const albert = await getUserById(1);
        console.log("Result:", albert);


        console.log("Finished database test");
    } catch (error) {
        console.error("Error testing database");
        throw error;
    }
}

const createInitialUsers = async () => {
    try {
        console.log("Starting to create users...");

        await createUser({
            username: 'albert', 
            password: 'bertie99',
            name: 'Albert',
            location: "California"
        });
        await createUser({
          username: "sandra",
          password: "2sandy4me",
          name: "Sandra Bullock",
          location: "Alaska"
        });
        await createUser({
          username: "glamgal",
          password: "soglam",
          name: "Fergie",
          location: "Hollywood"
        });

        // console.log(albert);
        // console.log(sandra);
        // console.log(glamgal);

        console.log("Finished creating users!")
    } catch (error) {
        console.error("Error creating users");
        throw error;
    }
}

const dropTables = async () => {
    try {
        console.log("Dropping tables...");
        
        await pool.query(`
        DROP TABLE IF EXISTS post_tags, tags, posts, users;
        `);

        console.log("Finished dropping tables!");
    } catch (error) {
        console.error("Error dropping tables");
        throw error;
    }
}

const createTables = async () => {
  try {
    console.log('Building tables...')
    await pool.query(`
        CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username varchar(255) UNIQUE NOT NULL,
        password varchar(255) NOT NULL,
        name varchar(255) NOT NULL,
        location varchar(255) NOT NULL,
        active BOOLEAN DEFAULT true
      );
        `);
    await pool.query(`
        CREATE TABLE posts (
            id SERIAL PRIMARY KEY,
            "authorId" INTEGER REFERENCES users(id) NOT NULL,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            active BOOLEAN DEFAULT true
        );
        `);
    await pool.query(`
    CREATE TABLE tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
    );
    CREATE TABLE post_tags (
        "postId" INTEGER REFERENCES posts(id) UNIQUE,
        "tagId" INTEGER REFERENCES tags(id) UNIQUE
    ); `)        

        console.log("Finished building tables!");
  } catch (error) {
      console.error("Error building tables");
      throw error;
  }
};

const createInitialPosts = async () => {
    try {
        const [albert, sandra, glamgal] = await getAllUsers();

        await createPost({
            authorId: albert.id,
            title: "First Post",
            content: "This is my first post!"
        });
        await createPost({
          authorId: sandra.id,
          title: "Sandy Beaches",
          content: "I love going to the beach, It's the best!",
        });
        await createPost({
          authorId: glamgal.id,
          title: "Fab",
          content: "slay queen yasss",
        });

    } catch (error) {
        throw error;
    }
}

const rebuildDB = async () => {
    try {
        await dropTables();
        await createTables();
        await createInitialUsers();
        await createInitialPosts();
    } catch (error) {
        console.error(error)
    }
}

rebuildDB()
    .then(testDB)
    .catch(console.error)
    .finally(() => pool.end());