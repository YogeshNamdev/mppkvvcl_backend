import express from 'express'
import {
  actionSupSend,
  Delete_attended_complaint_session,
  DeleteAllSession,
  fetchCategoryData,
  fetchQuestionData,
  fetchSubCategoryData,
  get_all_circle,
  get_all_District,
  get_block_details,
  get_circle_details,
  get_city_details,
  get_complaints_details_via_by_id,
  get_count_of_complaints,
  get_data_via_searchID,
  get_dc_details,
  get_division_details,
  get_fetchAreaNameData,
  get_fetchColonyNameData,
  get_fetchfeederNameData,
  get_fetchvillageNameData,
  get_foc_details,
  get_GramPanchayatData,
  get_location_by_complaints_id,
  get_location_by_dtr_complaints_id,
  get_region,
  get_sub_division_details,
  get_SubstationNameData,
  getAgentAttendedComplaint,
  getAgents,
  getCategory,
  getCopComplaints,
  getCountsofComplaints,
  getdailybriefing,
  getDataChildtosubChild,
  getdtrcomplaintsbyID,
  getFeederList,
  getSettingsDetails,
  getShutDownDetails,
  getSocialAnalytics,
  getSup_dtr_Complaints,
  getSupComplaints,
  getSupComplaints1,
  getSUPcomplaintsbyID,
  getWorngDCComplaints,
  handleAddBriefing,
  handleDeleteButtonClick,
  handleEditBriefing,
  SaveCircle,
  SaveCompComplaint,
  SaveCompDtrComplaint,
  SaveComplaint,
  SaveDC,
  SaveDivision,
  SaveOfficers,
  SaveRegion,
  SaveShutDown,
  SaveSubdivion,
  update_details_came_from,
  UpdateAgentstatus,
  updateDtrWorngDC,
  updateservey,
  updateWorngDC,
  get_feeder_wise_division,
  get_feeder_wise_dc,
  get_feeder_wise_feeder,
} from '../controllers/supervisor.js'
import { isAuthenticated } from '../middlewares/auth.js'
import bodyParser from 'body-parser'
const router = express.Router()

router.use(bodyParser.json())
//router.use(isAuthenticated)
router.get('/api/getCategory', getCategory)
router.post('/api/getSupComplaints', getSupComplaints)
router.post('/api/getSupComplaints1', getSupComplaints1)

router.post('/api/getWorngDCComplaints', getWorngDCComplaints)
router.get('/api/fetchCategoryData', fetchCategoryData)
router.post('/api/get_data_via_searchID', get_data_via_searchID)
router.post('/api/getdtrcomplaintsbyID', getdtrcomplaintsbyID)
router.post('/api/getSup_dtr_Complaints', getSup_dtr_Complaints)
router.get('/api/get_all_circle', get_all_circle)
router.get('/api/get_all_District', get_all_District)
router.get('/api/get_region', get_region)
router.get('/api/DeleteAllSession', DeleteAllSession)
router.get('/api/getSettingsDetails', getSettingsDetails)
router.get('/api/get_count_of_complaints', get_count_of_complaints)
router.get('/api/getAgentAttendedComplaint', getAgentAttendedComplaint)
router.get('/api/getdailybriefing', getdailybriefing)
router.get('/api/getFeederList', getFeederList)
router.get('/api/getShutDownDetails', getShutDownDetails)
router.post('/api/getSocialAnalytics', getSocialAnalytics)
router.post('/api/fetchSubCategoryData', fetchSubCategoryData)
router.post('/api/handleAddBriefing', handleAddBriefing)
router.post('/api/handleEditBriefing', handleEditBriefing)
router.post('/api/handleDeleteButtonClick', handleDeleteButtonClick)
router.post(
  '/api/Delete_attended_complaint_session',
  Delete_attended_complaint_session
)

router.post('/api/getSUPcomplaintsbyID', getSUPcomplaintsbyID)

router.post('/api/get_location_by_complaints_id', get_location_by_complaints_id)
router.post(
  '/api/get_location_by_dtr_complaints_id',
  get_location_by_dtr_complaints_id
)
router.post('/api/get_city_details', get_city_details)
router.post('/api/get_circle_details', get_circle_details)

router.post('/api/get_fetchColonyNameData', get_fetchColonyNameData)
router.post('/api/get_fetchAreaNameData', get_fetchAreaNameData)

router.post('/api/get_block_details', get_block_details)
router.post('/api/get_GramPanchayatData', get_GramPanchayatData)
router.post('/api/get_fetchvillageNameData', get_fetchvillageNameData)
router.post('/api/SaveShutDown', SaveShutDown)
router.post('/api/SaveOfficers', SaveOfficers)
router.post('/api/SaveComplaint', SaveComplaint)
router.post('/api/SaveCompComplaint', SaveCompComplaint)
router.post('/api/SaveCompDtrComplaint', SaveCompDtrComplaint)

router.post('/api/fetchQuestionData', fetchQuestionData)
router.post('/api/getDataChildtosubChild', getDataChildtosubChild)

router.post('/api/UpdateAgentstatus', UpdateAgentstatus)

router.post('/api/get_division_details', get_division_details)
router.post('/api/get_sub_division_details', get_sub_division_details)
router.post('/api/get_dc_details', get_dc_details)
router.post('/api/get_foc_details', get_foc_details)
router.post('/api/get_SubstationNameData', get_SubstationNameData)
router.post('/api/get_fetchfeederNameData', get_fetchfeederNameData)

router.post('/api/updateWorngDC', updateWorngDC)
router.post('/api/updateDtrWorngDC', updateDtrWorngDC)
router.get('/api/getAgents', getAgents)

router.post('/api/update_details_came_from', update_details_came_from)

router.post('/api/actionSupSend', actionSupSend)
router.post('/api/updateservey', updateservey)

router.get('/api/getCountsofComplaints', getCountsofComplaints)

// router.post('/api/deleteTodos', deleteTodos)
// router.post('/api/updateTodo', updateTodo)
////Location////
router.post('/api/SaveDC', SaveDC)
router.post('/api/SaveSubdivion', SaveSubdivion)
router.post('/api/SaveDivision', SaveDivision)
router.post('/api/SaveCircle', SaveCircle)
router.post('/api/SaveRegion', SaveRegion)

///CORPORATE MODULE//
router.post(
  '/api/get_complaints_details_via_by_id',
  get_complaints_details_via_by_id
)

router.get('/api/getCopComplaints', getCopComplaints)
router.get('/api/get_feeder_wise_division', get_feeder_wise_division)
router.post('/api/get_feeder_wise_dc', get_feeder_wise_dc)
router.post('/api/get_feeder_wise_feeder', get_feeder_wise_feeder)

///CORPORATE MODULE//

export default router
