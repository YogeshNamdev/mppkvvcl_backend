import express from 'express'
import bodyParser from 'body-parser'
import { login } from '../controllers/user.js'

const router = express.Router()

router.use(bodyParser.json())
router.post('/api/login', login)

export default router
