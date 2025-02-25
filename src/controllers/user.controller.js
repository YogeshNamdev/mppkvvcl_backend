import { login_m } from '../models/user.model.js'

export const login = async (req, res, next) => {
  try {
    await login_m(req, res, next)
  } catch (err) {
    next(err)
  }
}
