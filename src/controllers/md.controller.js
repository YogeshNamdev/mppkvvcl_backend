import {
    getEZNewCsatSurvey_m,
    getCZNewCsatSurvey_m,
    getWZNewCsatSurvey_m,
    getCategoryWiseComplaintCount_m,
    getElectricityDateWiseReport_m,
    getElectricityCircleWiseReport_m,
    getElectricityDivisionWiseReport_m,
    getDayWiseReport_m,
    gethourlyReport_m,
    getMTDReport_m,
    getYTDReport_m,
    get_circle_m,
    getSupplyFailureClosure_m,
    getSupplyFailureSlotWisePendency_m,
    getRegion_m,
    getCategoryData_m,
    getComplaintsReport_m,
    getCircleDetails_m,
    getDTRComplaintCount_m,
    getDivisionWiseDtrReport_m,
    getCircleWiseDtrReport_m,
    getRegionWiseDtrReport_m,
    getComplaintCount_m,
    getOpenAgeingAnalysis_m,
    getOpenCategoryAnalysis_m,
    getTimeWiseCategoryDetails_m,
    getCategoryWiseComplaintMonth_m,
    getRegionComplaintMonth_m,
    getCircleComplaintMonth_m,
    getDivisionComplaintMonth_m,
    getComplaintsList_m,
  } from '../models/md.js'
  import { ApiResponse } from '../utils/ApiResponse.js'
  import ErrorHandler from '../utils/errorHandler.js'
  
  export const getEZNewCsatSurvey = async (req, res, next) => {
    try {
      const result = await getEZNewCsatSurvey_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Complaints Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  export const getWZNewCsatSurvey = async (req, res, next) => {
    try {
      const result = await getWZNewCsatSurvey_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Complaints Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  export const getCZNewCsatSurvey = async (req, res, next) => {
    try {
      const result = await getCZNewCsatSurvey_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Complaints Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  export const getCategoryWiseComplaintCount = async (req, res, next) => {
    try {
      const result = await getCategoryWiseComplaintCount_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Complaints Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  export const getElectricityDateWiseReport = async (req, res, next) => {
    try {
      const result = await getElectricityDateWiseReport_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Complaints Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  export const getElectricityCircleWiseReport = async (req, res, next) => {
    try {
      const result = await getElectricityCircleWiseReport_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Complaints Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  export const getElectricityDivisionWiseReport = async (req, res, next) => {
    try {
      const result = await getElectricityDivisionWiseReport_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Complaints Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  export const getDayWiseReport = async (req, res, next) => {
    try {
      const result = await getDayWiseReport_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Complaints Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  export const gethourlyReport = async (req, res, next) => {
    try {
      const result = await gethourlyReport_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Complaints Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  
  export const getMTDReport = async (req, res, next) => {
    try {
      const result = await getMTDReport_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Complaints Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  export const getYTDReport = async (req, res, next) => {
    try {
      const result = await getYTDReport_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Complaints Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  export const get_circle = async (req, res, next) => {
    try {
      const result = await get_circle_m()
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Circle Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  export const getSupplyFailureClosure = async (req, res, next) => {
    try {
      const result = await getSupplyFailureClosure_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Circle Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  export const getSupplyFailureSlotWisePendency = async (req, res, next) => {
    try {
      const result = await getSupplyFailureSlotWisePendency_m()
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Circle Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  export const getRegion = async (req, res, next) => {
    try {
      const result = await getRegion_m()
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Circle Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  
  export const getCategoryData = async (req, res, next) => {
    try {
      const result = await getCategoryData_m()
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Circle Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  
  export const getComplaintsReport = async (req, res, next) => {
    try {
      const result = await getComplaintsReport_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Circle Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  
  export const getCircleDetails = async (req, res, next) => {
    try {
      const result = await getCircleDetails_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Circle Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  export const getDTRComplaintCount = async (req, res, next) => {
    try {
      const result = await getDTRComplaintCount_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Count Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  export const getRegionWiseDtrReport = async (req, res, next) => {
    try {
      const result = await getRegionWiseDtrReport_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Count Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  export const getCircleWiseDtrReport = async (req, res, next) => {
    try {
      const result = await getCircleWiseDtrReport_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Count Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  export const getDivisionWiseDtrReport = async (req, res, next) => {
    try {
      const result = await getDivisionWiseDtrReport_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Count Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  
  export const getComplaintCount = async (req, res, next) => {
    try {
      const result = await getComplaintCount_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Count Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  
  export const getOpenAgeingAnalysis = async (req, res, next) => {
    try {
      const result = await getOpenAgeingAnalysis_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Count Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  export const getOpenCategoryAnalysis = async (req, res, next) => {
    try {
      const result = await getOpenCategoryAnalysis_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Count Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  export const getTimeWiseCategoryDetails = async (req, res, next) => {
    try {
      const result = await getTimeWiseCategoryDetails_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Count Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  export const getCategoryWiseComplaintMonth = async (req, res, next) => {
    try {
      const result = await getCategoryWiseComplaintMonth_m()
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Count Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  export const getRegionComplaintMonth = async (req, res, next) => {
    try {
      const result = await getRegionComplaintMonth_m()
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Count Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  export const getCircleComplaintMonth = async (req, res, next) => {
    try {
      const result = await getCircleComplaintMonth_m()
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Count Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  export const getDivisionComplaintMonth = async (req, res, next) => {
    try {
      const result = await getDivisionComplaintMonth_m()
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Count Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  
  export const getComplaintsList = async (req, res, next) => {
    try {
      const result = await getComplaintsList_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Complaints Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(403, err.message))
    }
  }
  