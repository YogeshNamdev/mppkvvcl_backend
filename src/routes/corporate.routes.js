import bodyParser from 'body-parser'
import express from 'express'
import {
  get_complaints_details_via_by_id,
  get_complaints_History_via_by_id,
  getCopComplaints,
} from '../controllers/corporate.controller.js'
const router = express.Router()
router.use(bodyParser.json())
router.get('/api/getCopComplaints', getCopComplaints)
router.post(
  '/api/get_complaints_details_via_by_id',
  get_complaints_details_via_by_id
)
router.post(
  '/api/get_complaints_History_via_by_id',
  get_complaints_History_via_by_id
)

export default router
