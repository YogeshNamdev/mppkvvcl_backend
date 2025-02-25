import jwt from 'jsonwebtoken'

export const sendCookie = (user, res, message, statusCode = 200) => {
  const token = jwt.sign({ users_id: user.users_id }, 'nsvbvjhdsvbjds')

  res
    .status(statusCode)
    .cookie('token', token, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000,

      sameSite: process.env.NODE_ENV === 'DEVELOPMENT' ? 'lax' : 'none',
      secure: process.env.NODE_ENV === 'DEVELOPMENT' ? false : true,
    })
    .json({
      success: true,
      message,
    })
}
