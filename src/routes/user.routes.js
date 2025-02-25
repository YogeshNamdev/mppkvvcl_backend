import bodyParser from 'body-parser'
import express from 'express'
import { login } from '../controllers/user.controller.js'

const router = express.Router()

router.use(bodyParser.json())
router.post('/api/login', login)

export default router
