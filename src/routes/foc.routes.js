import bodyParser from 'body-parser'
import express from 'express'
import {
  actionSend,
  actionUpdate,
  get_complaints_History_via_by_id,
  getcomplaintsbyfocID,
  getComplaintsviaGangIDStatus,
  getcountcomplaintsbyID,
  getDTRComplaints,
  getdtrcomplaintsbyID,
  getFOCComplaints,
  getFOCcomplaintsbyID,
  getFOCDashboardCount,
  getFocProfileData,
  getGang,
  getGangLineMan,
  getGanglist,
  getSubCategory,
  UpdateGang,
  updategangdetails,
  updateProfile,
  updateProfilePass,
} from '../controllers/foc.controller.js'
const router = express.Router()

router.use(bodyParser.json())
//router.use(isAuthenticated)
router.post('/api/actionSend', actionSend)
router.get('/api/getDTRComplaints', getDTRComplaints)
router.get('/api/getSubCategory', getSubCategory)
router.post('/api/getGang', getGang)
router.post('/api/getGanglist', getGanglist)
router.post('/api/getFOCComplaints', getFOCComplaints)
router.post('/api/getFOCcomplaintsbyID', getFOCcomplaintsbyID)
router.post('/api/getFocProfileData', getFocProfileData)
router.post('/api/updateProfile', updateProfile)
router.post('/api/updateProfilePass', updateProfilePass)
router.post('/api/updategangdetails', updategangdetails)
router.post('/api/getcountcomplaintsbyID', getcountcomplaintsbyID)
router.post('/api/getcomplaintsbyfocID', getcomplaintsbyfocID)
router.post('/api/getGangLineMan', getGangLineMan)
router.post(
  '/api/get_complaints_History_via_by_id',
  get_complaints_History_via_by_id
)
router.post('/api/getComplaintsviaGangIDStatus', getComplaintsviaGangIDStatus)
router.post('/api/getdtrcomplaintsbyID', getdtrcomplaintsbyID)
router.post('/api/actionUpdate', actionUpdate)

router.post('/api/UpdateGang', UpdateGang)
router.post('/api/getFOCDashboardCount', getFOCDashboardCount)
export default router
