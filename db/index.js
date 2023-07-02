const Pool = require('pg').Pool

const pool = new Pool({
    user: 'me',
    host: "localhost",
    database: "juiceboxdev",
    password: "Platypus123!",
    port: 5432
})

const getAllUsers = async () => {
    const { rows } = await pool.query(
        `SELECT id, username
        FROM users;`
    );
    return rows;
}

const createUser = async ({username, password}) => {
    try {
        const { rows } = await pool.query(`
            INSERT INTO users (username, password) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING RETURNING *;
        `, [ username, password ]);

        return rows;
    } catch (error) {
        throw error;
    }
}


module.exports = { pool, getAllUsers, createUser }