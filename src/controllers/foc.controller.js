import {
  actionSend_m,
  actionUpdate_m,
  get_complaints_History_via_by_id_m,
  getcomplaintsbyfocID_m,
  getComplaintsviaGangIDStatus_m,
  getcountcomplaintsbyID_m,
  getDTRComplaints_m,
  getdtrcomplaintsbyID_m,
  getFOCComplaints_m,
  getFOCcomplaintsbyID_m,
  getFOCDashboardCount_m,
  getFocProfileData_m,
  getGang_m,
  getGangLineMan_m,
  getGanglist_m,
  getSubCategory_m,
  UpdateGang_m,
  updategangdetails_m,
  updateProfile_m,
  updateProfilePass_m,
} from '../models/foc.model.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import ErrorHandler from '../utils/errorHandler.js'
  
  export const actionSend = async (req, res, next) => {
    try {
      if (!req.body) return next(new ErrorHandler('Invalid Request', 500))
      if (req.body.action === '')
        return next(new ErrorHandler('Please Select Action', 404))
      if (req.body.complaints_id === '')
        return next(new ErrorHandler('Invalid Request', 404))
      if (req.body.foc_rectification === '')
        return next(new ErrorHandler('Please Select Rectification', 404))
      if (req.body.remark === '')
        return next(new ErrorHandler('Please Enter Remark', 404))
      if (req.body.user_id === '')
        return next(new ErrorHandler('Invalid Request', 404))
  
      await actionSend_m(req.body) // Pass data only to the model function
  
      return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Complaint Updated Successfully'))
    } catch (err) {
      console.error('Error in actionSend:', err)
      next(new ErrorHandler(err.message, 500))
    }
  }
  
  export const getFOCComplaints = async (req, res, next) => {
    try {
      const result = await getFOCComplaints_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Complaints Fetch Successfully'))
    } catch (err) {
      next(new ErrorHandler(err.message, 403))
    }
  }
  export const getGang = async (req, res, next) => {
    if (req.body.id !== '' || req.body.id !== 0) {
      try {
        const result = await getGang_m(req.body.id)
        return res
          .status(200)
          .json(new ApiResponse(200, result, 'Fetch Successfully'))
      } catch (err) {
        console.log(err)
        next(new ErrorHandler(err.message, 403))
      }
    } else {
      next(new ErrorHandler('Invalid ID', 400))
    }
  }
  
  export const getGanglist = async (req, res, next) => {
    if (req.body.id !== '' || req.body.id !== 0) {
      try {
        const result = await getGanglist_m(req.body.id)
        return res
          .status(200)
          .json(new ApiResponse(200, result, 'Fetch Successfully'))
      } catch (err) {
        console.log(err)
        next(new ErrorHandler(err.message, 403))
      }
    } else {
      next(new ErrorHandler('Invalid ID', 400))
    }
  }
  
  export const UpdateGang = async (req, res, next) => {
    try {
      await UpdateGang_m(req.body)
      return res.status(200).json(new ApiResponse(200, {}, 'Fetch Successfully'))
    } catch (error) {
      next(new ErrorHandler(error.message, 403))
    }
  }
  export const get_complaints_History_via_by_id = async (req, res, next) => {
    try {
      if (!req.body) return next(new ErrorHandler('Invalid Request', 500))
      if (req.body.id === '')
        return next(new ErrorHandler('Invalid Request', 404))
  
      const result = await get_complaints_History_via_by_id_m(req.body.id)
  
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Fetch Successfully'))
    } catch (err) {
      console.error('Error in get_complaints_History_via_by_id:', err)
      next(new ErrorHandler(err.message, 500))
    }
  }
  export const getFOCcomplaintsbyID = async (req, res, next) => {
    try {
      if (!req.body || !req.body.id) {
        return next(new ErrorHandler('Invalid Request', 400))
      }
  
      const userId = req.body.id
      const complaintData = await getFOCcomplaintsbyID_m(userId)
  
      if (complaintData) {
        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              complaintData,
              'Complaints retrieved successfully'
            )
          )
      } else {
        next(new ErrorHandler('Complaints not found', 404))
      }
    } catch (err) {
      console.error('Error in getFOCcomplaintsbyID:', err)
      next(new ErrorHandler(err.message, 500))
    }
  }
  export const getdtrcomplaintsbyID = async (req, res, next) => {
    try {
      const { id } = req.body
      const complaintData = await getdtrcomplaintsbyID_m(id)
  
      return res
        .status(200)
        .json(
          new ApiResponse(200, complaintData, 'Complaints retrieved successfully')
        )
    } catch (err) {
      console.error('Error in getdtrcomplaintsbyID:', err)
      next(new ErrorHandler('Internal server error', 500))
    }
  }
  
  export const actionUpdate = async (req, res, next) => {
    try {
      await actionUpdate_m(req.body)
      return res.status(200).json(new ApiResponse(201, {}, 'Update successfully'))
    } catch (error) {
      next(new ErrorHandler(error.message, 403))
    }
  }
  export const getDTRComplaints = async (req, res, next) => {
    try {
      const result = await getDTRComplaints_m(req.params.userId)
  
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'retrieved successfully'))
    } catch (err) {
      console.error('Error in getDTRComplaints:', err)
      next(new ErrorHandler(err.message, 500))
    }
  }
  export const getcomplaintsbyfocID = async (req, res, next) => {
    try {
      const { id, complaintstatus } = req.body
      const result = await getcomplaintsbyfocID_m(id, complaintstatus)
  
      if (result) {
        return res
          .status(200)
          .json(new ApiResponse(200, result, 'retrieved successfully'))
      } else {
        res.status(404).json({
          status: 404,
          message: 'No complaints found',
        })
      }
    } catch (err) {
      console.error('Error in getcomplaintsbyfocID:', err)
      next(new ErrorHandler('Internal server error', 500))
    }
  }
  export const getcountcomplaintsbyID = async (req, res, next) => {
    try {
      const userId = req.body.id
      const complaintData = await getcountcomplaintsbyID_m(userId)
      return res
        .status(200)
        .json(new ApiResponse(200, complaintData, 'retrieved successfully'))
    } catch (err) {
      console.error('Error in getcountcomplaintsbyID:', err)
      next(new ErrorHandler('Internal server error', 500))
    }
  }
  export const updateProfile = async (req, res, next) => {
    try {
      await updateProfile_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, {}, 'retrieved successfully'))
    } catch (err) {
      console.error('Error in updateProfile:', err)
      next(new ErrorHandler('Profile update failed', 500))
    }
  }
  export const updateProfilePass = async (req, res, next) => {
    try {
      // Ensure the request body contains the necessary data
      if (!req.body || !req.body.userId || !req.body.newPassword) {
        return next(new ErrorHandler('Invalid request data', 400))
      }
  
      // Call the model function to perform the update
      await updateProfilePass_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(201, {}, 'Profile password updated successfully'))
    } catch (err) {
      console.error('Error in updateProfilePass:', err)
      next(new ErrorHandler('Internal server error', 500))
    }
  }
  export const getFocProfileData = async (req, res, next) => {
    try {
      const complaintData = await getFocProfileData_m(req.body.id)
  
      // Process the complaint data to ensure all relevant fields are converted to strings
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            complaintData,
            'Profile password updated successfully'
          )
        )
    } catch (err) {
      console.error('Error in getFocProfileData:', err)
      next(new ErrorHandler('Internal server error', 500))
    }
  }
  export const getGangLineMan = async (req, res, next) => {
    try {
      const result = await getGangLineMan_m(req.body.id)
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Retreve successfully'))
    } catch (err) {
      console.error('Error in getGangLineMan:', err)
      next(new ErrorHandler('Internal server error', 500))
    }
  }
  export const getComplaintsviaGangIDStatus = async (req, res, next) => {
    try {
      const complaintData = await getComplaintsviaGangIDStatus_m(req.body)
  
      return res
        .status(200)
        .json(
          new ApiResponse(200, complaintData, 'Complaints retrieved successfully')
        )
    } catch (err) {
      console.error('Error in getComplaintsviaGangIDStatus:', err)
      next(new ErrorHandler('Internal server error', 500))
    }
  }
  export const updategangdetails = async (req, res, next) => {
    try {
      await updategangdetails_m(req.body)
      return res.status(200).json(new ApiResponse(201, {}, 'Update Successful'))
    } catch (err) {
      console.error('Error in updategangdetails:', err)
      next(new ErrorHandler(err.message, 500))
    }
  }
  
  export const getSubCategory = async (req, res, next) => {
    try {
      const result = await getSubCategory_m(req.body.id)
      return res
        .status(200)
        .json(
          new ApiResponse(201, result, 'Subcategories retrieved successfully')
        )
    } catch (err) {
      console.error('Error in getSubCategory:', err)
      next(new ErrorHandler(err.message, 500))
    }
  }
  export const getFOCDashboardCount = async (req, res, next) => {
    try {
      const userId = req.body.id
      const complaintData = await getFOCDashboardCount_m(userId)
      return res
        .status(200)
        .json(
          new ApiResponse(200, complaintData, 'Complaints retrieved successfully')
        )
    } catch (err) {
      console.error('Error in getcountcomplaintsbyID:', err)
      next(new ErrorHandler('Internal server error', 500))
    }
  }
  