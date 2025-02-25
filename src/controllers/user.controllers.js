import { login_m } from '../models/user.js'

export const login = async (req, res, next) => {
  try {
    await login_m(req, res, next)
  } catch (err) {
    next(err)
  }
}
