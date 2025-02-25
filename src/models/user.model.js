import mariadb from 'mariadb'
import ErrorHandler from '../utils/errorHandler.js'
import { sendCookie } from '../utils/features.js'
const pool = mariadb.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'test',
  connectionLimit: 50,
})

export const login_m = async (req, res, next) => {
  let conn
  try {
    const { users_name, users_password } = req.body
    conn = await pool.getConnection()
    const query = `
      SELECT * FROM users 
      WHERE users_name = ? 
      AND users_password = ? 
      AND users_status = 1
    `
    const user = await conn.query(query, [users_name, users_password])

    if (user.length === 0) {
      return (new ErrorHandler('Invalid Email or Password', 404))
    }

    // Convert BigInt values to strings
    const userWithStrings = JSON.parse(
      JSON.stringify(user[0], (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    )
    sendCookie(userWithStrings, res, 'Login successful', 200)
  } catch (err) {
    next(err)
  } finally {
    if (conn) await conn.end() // end to pool
  }
}
