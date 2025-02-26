import bodyParser from 'body-parser'
import {asysnHandler} from '../utils/asyncHandler.js'
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


router.route('/getFOCDashboardCount').post(asysnHandler(getFOCDashboardCount))
router.route('/getcomplaintsbyfocID').post(asysnHandler(getcomplaintsbyfocID))
router.route('/getFOCComplaints').post(asysnHandler(getFOCComplaints))
router.route('/getFOCcomplaintsbyID').post(asysnHandler(getFOCcomplaintsbyID))

router.route('/actionSend').post(asysnHandler(actionSend))
router.route('/getDTRComplaints').get(asysnHandler(getDTRComplaints))
router.route('/getSubCategory').get(asysnHandler(getSubCategory))
router.route('/getGang').post(asysnHandler(getGang))
router.route('/getGanglist').post(asysnHandler(getGanglist))
router.route('/getFocProfileData').post(asysnHandler(getFocProfileData))
router.route('/updateProfile').post(asysnHandler(updateProfile))
router.route('/updateProfilePass').post(asysnHandler(updateProfilePass))
router.route('/updategangdetails').post(asysnHandler(updategangdetails))
router.route('/getcountcomplaintsbyID').post(asysnHandler(getcountcomplaintsbyID))
router.route('/getGangLineMan').post(asysnHandler(getGangLineMan))
router.route('/get_complaints_History_via_by_id').post(asysnHandler(get_complaints_History_via_by_id))
router.route('/getComplaintsviaGangIDStatus').post(asysnHandler(getComplaintsviaGangIDStatus))
router.route('/getdtrcomplaintsbyID').post(asysnHandler(getdtrcomplaintsbyID))
router.route('/actionUpdate').post(asysnHandler(actionUpdate))
router.route('/UpdateGang').post(asysnHandler(UpdateGang))

export default router
