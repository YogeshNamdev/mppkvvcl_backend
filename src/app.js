import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

import supervisorRoute from './routes/supervisor.router.js'
import focRoute from './routes/foc.router.js'
import userRoute from './routes/user.router.js'
import corporateRoute from './routes/corporate.router.js'
import MDRoute from './routes/md.router.js'

// Routes
app.use('/user', userRoute)
app.use('/superwiser', supervisorRoute)
app.use('/foc', focRoute)
app.use('/corporate', corporateRoute)
app.use('/MD', MDRoute)


export { app }