import bodyParser from 'body-parser'
import express from 'express'
import {
  get_circle,
  getCategoryData,
  getCategoryWiseComplaintCount,
  getCategoryWiseComplaintMonth,
  getCircleComplaintMonth,
  getCircleDetails,
  getCircleWiseDtrReport,
  getComplaintCount,
  getComplaintsList,
  getComplaintsReport,
  getCZNewCsatSurvey,
  getDayWiseReport,
  getDivisionComplaintMonth,
  getDivisionWiseDtrReport,
  getDTRComplaintCount,
  getElectricityCircleWiseReport,
  getElectricityDateWiseReport,
  getElectricityDivisionWiseReport,
  getEZNewCsatSurvey,
  gethourlyReport,
  getMTDReport,
  getOpenAgeingAnalysis,
  getOpenCategoryAnalysis,
  getRegion,
  getRegionComplaintMonth,
  getRegionWiseDtrReport,
  getSupplyFailureClosure,
  getSupplyFailureSlotWisePendency,
  getTimeWiseCategoryDetails,
  getWZNewCsatSurvey,
  getYTDReport,
} from '../controllers/md.controller.js'
const router = express.Router()
router.use(bodyParser.json())
router.get('/api/get_circle', get_circle)

router.post('/api/getEZNewCsatSurvey', getEZNewCsatSurvey)
router.post('/api/getWZNewCsatSurvey', getWZNewCsatSurvey)
router.post('/api/getCZNewCsatSurvey', getCZNewCsatSurvey)
router.post('/api/getCategoryWiseComplaintCount', getCategoryWiseComplaintCount)
router.post('/api/getElectricityDateWiseReport', getElectricityDateWiseReport)
router.post(
  '/api/getElectricityCircleWiseReport',
  getElectricityCircleWiseReport
)
router.post(
  '/api/getElectricityDivisionWiseReport',
  getElectricityDivisionWiseReport
)
router.post('/api/getDayWiseReport', getDayWiseReport)
router.post('/api/gethourlyReport', gethourlyReport)
router.post('/api/getMTDReport', getMTDReport)
router.post('/api/getYTDReport', getYTDReport)
router.post('/api/getSupplyFailureClosure', getSupplyFailureClosure)
router.get(
  '/api/getSupplyFailureSlotWisePendency',
  getSupplyFailureSlotWisePendency
)
router.get('/api/getRegion', getRegion)
router.get('/api/getCategoryData', getCategoryData)
router.post('/api/getComplaintsReport', getComplaintsReport)
router.post('/api/getCircleDetails', getCircleDetails)
router.post('/api/getDTRComplaintCount', getDTRComplaintCount)
router.post('/api/getRegionWiseDtrReport', getRegionWiseDtrReport)
router.post('/api/getCircleWiseDtrReport', getCircleWiseDtrReport)
router.post('/api/getDivisionWiseDtrReport', getDivisionWiseDtrReport)
router.post('/api/getComplaintCount', getComplaintCount)
router.post('/api/getOpenAgeingAnalysis', getOpenAgeingAnalysis)
router.post('/api/getOpenCategoryAnalysis', getOpenCategoryAnalysis)
router.post('/api/getTimeWiseCategoryDetails', getTimeWiseCategoryDetails)
router.get('/api/getCategoryWiseComplaintMonth', getCategoryWiseComplaintMonth)
router.get('/api/getRegionComplaintMonth', getRegionComplaintMonth)
router.get('/api/getCircleComplaintMonth', getCircleComplaintMonth)
router.get('/api/getDivisionComplaintMonth', getDivisionComplaintMonth)
router.post('/api/getComplaintsList', getComplaintsList)

export default router
