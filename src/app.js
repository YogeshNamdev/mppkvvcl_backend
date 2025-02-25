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

import supervisorRoute from './routes/supervisor.routes.js'
import focRoute from './routes/foc.routes.js'
import userRoute from './routes/user.routes.js'
import corporateRoute from './routes/corporate.routes.js'
import MDRoute from './routes/md.routes.js'

// Routes
app.use('/api/v1/user', userRoute)
app.use('/api/v1/superwiser', supervisorRoute)
app.use('/api/v1/foc', focRoute)
app.use('/api/v1/corporate', corporateRoute)
app.use('/api/v1/MD', MDRoute)


export { app }