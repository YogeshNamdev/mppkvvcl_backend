import {
  actionSupSend_m,
  check_login_details_m,
  Delete_attended_complaint_session_m,
  DeleteAllSession_m,
  deleteTodos_m,
  fetchCategoryData_m,
  fetchQuestionData_m,
  fetchSubCategoryData_m,
  get_all_circle_m,
  get_all_District_m,
  get_block_details_m,
  get_circle_details_m,
  get_city_details_m,
  get_complaints_details_via_by_id_m,
  get_count_of_complaints_m,
  get_data_via_searchID_m,
  get_dc_details_m,
  get_division_details_m,
  get_feeder_wise_dc_m,
  get_feeder_wise_division_m,
  get_feeder_wise_feeder_m,
  get_fetchAreaNameData_m,
  get_fetchColonyNameData_m,
  get_fetchfeederNameData_m,
  get_fetchvillageNameData_m,
  get_foc_details_m,
  get_GramPanchayatData_m,
  get_location_by_complaints_id_m,
  get_location_by_dtr_complaints_id_m,
  get_region_m,
  get_sub_division_details_m,
  get_SubstationNameData_m,
  getAgentAttendedComplaint_m,
  getAgents_m,
  getCategory_m,
  getCopComplaints_m,
  getCountsofComplaints_m,
  getdailybriefing_m,
  getDataChildtosubChild_m,
  getdtrcomplaintsbyID_m,
  getFeederList_m,
  getSettingsDetails_m,
  getShutDownDetails_m,
  getSocialAnalytics_m,
  getSup_dtr_Complaints_m,
  getSupComplaints_m,
  getSupComplaints_m1,
  getSUPcomplaintsbyID_m,
  getWorngDCComplaints_m,
  handleAddBriefing_m,
  handleDeleteButtonClick_m,
  handleEditBriefing_m,
  SaveCircle_m,
  SaveCompComplaint_m,
  SaveCompDtrComplaint_m,
  SaveComplaint_m,
  SaveDC_m,
  SaveDivision_m,
  SaveOfficers_m,
  SaveRegion_m,
  SaveShutDown_m,
  SaveSubdivion_m,
  update_details_came_from_m,
  UpdateAgentstatus_m,
  updateDtrWorngDC_m,
  updateservey_m,
  updateTodo_m,
  updateWorngDC_m,
} from '../models/supervisor.model.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import ErrorHandler from '../utils/errorHandler.js'
  export const SaveShutDown = async (req, res, next) => {
    try {
      await SaveShutDown_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, {}, 'ShutDown Added Successfully'))
    } catch (err) {
      console.error('Error in SaveShutDown:', err)
      next(new ErrorHandler('Failed to add shut down', 403))
    }
  }
  export const SaveOfficers = async (req, res, next) => {
    try {
      await SaveOfficers_m(req.body)
  
      return res
        .status(200)
        .json(new ApiResponse(200, {}, 'ShutDown Added Successfully'))
    } catch (err) {
      console.error('Error in SaveOfficers:', err)
      next(new ErrorHandler('Failed to add officer', 403))
    }
  }
  export const fetchQuestionData = async (req, res, next) => {
    try {
      const result = await fetchQuestionData_m(req.body.id)
  
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Complaint Showning Suceesfully'))
    } catch (err) {
      console.error('Error in fetchQuestionData:', err)
      next(new ErrorHandler('Failed to fetch question data', 403))
    }
  }
  
  export const getDataChildtosubChild = async (req, res, next) => {
    try {
      const result = await getDataChildtosubChild_m(req.body)
  
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Complaint Showning Suceesfully'))
    } catch (err) {
      console.error('Error in getDataChildtosubChild:', err)
      next(new ErrorHandler('Failed to fetch child to sub-child data', 403))
    }
  }
  export const SaveComplaint = async (req, res, next) => {
    try {
      const result = await SaveComplaint_m(req.body)
  
      res.json({
        status: result.code,
        complaint_id: result.complaint_id,
        message: result.message,
      })
    } catch (err) {
      next(new ErrorHandler(err.message, 403))
    }
  }
  export const actionSupSend = async (req, res, next) => {
    try {
      await actionSupSend_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Complaint Showning Suceesfully'))
    } catch (err) {
      console.error('Error updating complaint:', err)
      ErrorHandler.handle(err, res) // Utilize your ErrorHandler class
    }
  }
  
  export const getCountsofComplaints = async (req, res, next) => {
    try {
      const result = await getCountsofComplaints_m()
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Complaint Showning Suceesfully'))
    } catch (err) {
      console.error('Error fetching counts of complaints:', err)
      ErrorHandler.handle(err, res) // Utilize your ErrorHandler class
    }
  }
  
  export const get_data_via_searchID = async (req, res, next) => {
    try {
      const result = await get_data_via_searchID_m(req.body)
      console.log('result', result.response)
      if (result.response == false) {
        return res.status(400).json(new ApiResponse(400, result, result.message))
      } else {
        return res
          .status(200)
          .json(new ApiResponse(200, result, 'Data Fetch Successfully'))
      }
    } catch (err) {
      console.error('Error fetching data via search ID:', err)
      //ErrorHandler.handle(err, res) // Utilize your ErrorHandler class
    }
  }
  export const getSupComplaints = async (req, res, next) => {
    try {
      // Await the result from the model function
      const result = await getSupComplaints_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Complaint Showning Suceesfully'))
    } catch (err) {
      // Handle error with appropriate status code
      if (err instanceof ErrorHandler) {
        next(err) // Pass ErrorHandler instance to middleware
      } else {
        next(new ErrorHandler(500, err.message)) // Internal server error for unexpected errors
      }
    }
  }
  
  export const getSupComplaints1 = async (req, res, next) => {
    try {
      // Await the result from the model function
      const result = await getSupComplaints_m1(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Complaint Showning Suceesfully'))
    } catch (err) {
      // Handle error with appropriate status code
      if (err instanceof ErrorHandler) {
        next(err) // Pass ErrorHandler instance to middleware
      } else {
        next(new ErrorHandler(500, err.message)) // Internal server error for unexpected errors
      }
    }
  }
  
  export const getCopComplaints = async (req, res, next) => {
    try {
      const result = await getCopComplaints_m()
  
      // Transform data
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Complaint Showning Suceesfully'))
    } catch (err) {
      // Handle error
      next(new ErrorHandler(403, err.message)) // Use ErrorHandler class
    }
  }
  export const getWorngDCComplaints = async (req, res, next) => {
    try {
      const result = await getWorngDCComplaints_m(req.body)
      return res
        .status(200)
        .json(
          new ApiResponse(200, result, 'Setting Details Successfully Retreve')
        )
    } catch (err) {
      // Handle error
      next(new ErrorHandler(403, err.message))
    }
  }
  
  export const getSup_dtr_Complaints = async (req, res, next) => {
    try {
      const result = await getSup_dtr_Complaints_m(req.body)
  
      // Transform data
      // for (const data of result) {
      //   data.id = data.id.toString()
      //   // data.complaints_consumer_id = data.complaints_consumer_id.toString(); // This line is commented out in the original code
      // }
      return res
        .status(200)
        .json(
          new ApiResponse(200, result, 'DTR Complaints Successfully Retreive')
        )
    } catch (err) {
      // Handle error
      next(new ErrorHandler(403, err.message)) // Use ErrorHandler class
    }
  }
  
  export const get_all_circle = async (req, res, next) => {
    try {
      const result = await get_all_circle_m()
      return res
        .status(200)
        .json(new ApiResponse(200, result, 'Circle Successfully Retreive'))
    } catch (err) {
      // Handle error
      next(new ErrorHandler(403, err.message)) // Use ErrorHandler class
    }
  }
  
  export const getSettingsDetails = async (req, res, next) => {
    try {
      const result = await getSettingsDetails_m()
  
      return res
        .status(200)
        .json(
          new ApiResponse(200, result, 'Setting Details Successfully Retreve')
        )
    } catch (err) {
      // Handle error
      next(new ErrorHandler(403, err.message)) // Use ErrorHandler class
    }
  }
  
  export const get_count_of_complaints = async (req, res, next) => {
    try {
      const result = await get_count_of_complaints_m()
  
      return res.status(200).json(new ApiResponse(200, result, 'Successfully'))
    } catch (err) {
      // Handle error
      next(new ErrorHandler(403, err.message)) // Use ErrorHandler class
    }
  }
  
  export const get_block_details = async (req, res, next) => {
    try {
      const result = await get_block_details_m(req.body.id)
      return res.status(200).json(new ApiResponse(200, result, 'Successfully'))
    } catch (err) {
      // Handle error
      next(new ErrorHandler(403, err.message)) // Use ErrorHandler class
    }
  }
  
  export const get_fetchColonyNameData = async (req, res, next) => {
    try {
      const result = await get_fetchColonyNameData_m(req.body.id)
  
      return res.status(200).json(new ApiResponse(200, result, 'Successfully'))
    } catch (err) {
      // Handle error
      next(new ErrorHandler(403, err.message)) // Use ErrorHandler class
    }
  }
  
  export const get_complaints_details_via_by_id = (req, res, next) => {
    // console.log('req', req.body)
    get_complaints_details_via_by_id_m(req.body)
      .then((result) => {
        // Check if the properties exist and have the expected structure
        const info = result.info && result.info[0] ? result.info[0] : []
        const ae_det = result.ae_det && result.ae_det[0] ? result.ae_det[0] : []
        const je_det = result.je_det && result.je_det[0] ? result.je_det[0] : []
        const escalation =
          result.escalation && result.escalation[0] ? result.escalation[0] : []
        return res.status(200).json(new ApiResponse(200, result, 'Successfully'))
      })
      .catch((err) => {
        console.error(err)
        res.json({
          status: 500,
          message: err.message,
        })
        // next(
        //   new ErrorHandler(
        //     err.message || 'Internal server error',
        //     err.statusCode || 500
        //   )
        // )
      })
  }
  export const get_fetchAreaNameData = async (req, res, next) => {
    try {
      const result = await get_fetchAreaNameData_m(req.body.id)
      return res.status(200).json(new ApiResponse(200, result, 'Successfully'))
    } catch (err) {
      console.error(err)
      next(new ErrorHandler(err.message, 403))
    }
  }
  
  export const getSocialAnalytics = async (req, res, next) => {
    try {
      const result = await getSocialAnalytics_m(req.body.p_type)
      return res.status(200).json(new ApiResponse(200, result, 'Successfully'))
    } catch (err) {
      console.error(err)
      next(new ErrorHandler(err.message, 403))
    }
  }
  export const get_city_details = async (req, res, next) => {
    try {
      const result = await get_city_details_m(req.body.id)
      return res.status(200).json(new ApiResponse(200, result, 'Successfully'))
    } catch (err) {
      console.error(err)
      next(new ErrorHandler(err.message, 403))
    }
  }
  export const get_GramPanchayatData = async (req, res, next) => {
    try {
      const result = await get_GramPanchayatData_m(req.body.id)
      return res.status(200).json(new ApiResponse(200, result, 'Successfully'))
    } catch (err) {
      console.error(err)
      next(new ErrorHandler(err.message, 403))
    }
  }
  
  export const get_fetchvillageNameData = async (req, res, next) => {
    try {
      const result = await get_fetchvillageNameData_m(req.body)
      return res.status(200).json(new ApiResponse(200, result, 'Successfully'))
    } catch (err) {
      console.error(err)
      next(new ErrorHandler(err.message, 403))
    }
  }
  export const get_all_District = async (req, res, next) => {
    try {
      const result = await get_all_District_m()
      return res.status(200).json(new ApiResponse(200, result, 'Successfully'))
    } catch (err) {
      console.error(err)
      next(new ErrorHandler(err.message, 403))
    }
  }
  
  export const fetchCategoryData = async (req, res, next) => {
    try {
      const result = await fetchCategoryData_m()
      return res.status(200).json(new ApiResponse(200, result, 'Successfully'))
    } catch (err) {
      console.error(err)
      next(new ErrorHandler(err.message, 403))
    }
  }
  export const fetchSubCategoryData = async (req, res, next) => {
    try {
      const result = await fetchSubCategoryData_m(req.body.id)
  
      return res.status(200).json(new ApiResponse(200, result, 'Successfully'))
    } catch (err) {
      console.error(err)
      next(new ErrorHandler(err.message, 403))
    }
  }
  export const get_region = async (req, res, next) => {
    try {
      const result = await get_region_m()
      return res.status(200).json(new ApiResponse(200, result, 'Successfully'))
    } catch (err) {
      console.error(err)
      next(new ErrorHandler(err.message, 403))
    }
  }
  
  export const getdailybriefing = async (req, res, next) => {
    try {
      const result = await getdailybriefing_m()
      return res.status(200).json(new ApiResponse(200, result, 'Successfully'))
    } catch (err) {
      console.error(err)
      next(new ErrorHandler(err.message, 403))
    }
  }
  export const get_SubstationNameData = async (req, res, next) => {
    try {
      const result = await get_SubstationNameData_m(req.body.id)
      return res.status(200).json(new ApiResponse(200, result, 'Successfully'))
    } catch (err) {
      console.error(err)
      next(new ErrorHandler(err.message, 403))
    }
  }
  export const get_fetchfeederNameData = async (req, res, next) => {
    try {
      const result = await get_fetchfeederNameData_m(req.body.id)
  
      return res.status(200).json(new ApiResponse(200, result, 'Successfully'))
    } catch (err) {
      console.error('Error in get_fetchfeederNameData:', err.message)
      res.status(403).json({
        message: err.message,
      })
    }
  }
  
  export const getCategory = async (req, res, next) => {
    try {
      const result = await getCategory_m()
      return res.status(200).json(new ApiResponse(200, result, 'Successfully'))
    } catch (err) {
      console.error('Error in getCategory:', err.message)
      next(new ErrorHandler('Failed to fetch category data', 403)) // Pass error to the global error handler
    }
  }
  
  export const deleteTodos = async (req, res, next) => {
    try {
      await deleteTodos_m(req.body.id)
      return res.status(200).json(new ApiResponse(200, {}, 'Successfully'))
    } catch (err) {
      console.error('Error in deleteTodos:', err.message)
      next(new ErrorHandler('Failed to delete todo item', 403)) // Pass error to the global error handler
    }
  }
  export const get_location_by_complaints_id = async (req, res, next) => {
    const id = req.body.id // Assuming you are getting the complaint ID from the request body
    try {
      const complaintData = await get_location_by_complaints_id_m(id)
  
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
        res.status(404).json({
          status: 404,
          message: 'Complaints not found',
        })
      }
    } catch (err) {
      console.error('Error fetching location by complaints ID:', err.message)
      next(new ErrorHandler('Internal server error', 500)) // Pass error to the global error handler
    }
  }
  
  export const get_location_by_dtr_complaints_id = async (req, res, next) => {
    const id = req.body.id // Assuming you are getting the complaint ID from the request body
  
    try {
      const complaintData = await get_location_by_dtr_complaints_id_m(id)
  
      if (complaintData && complaintData.res) {
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
        res.status(404).json({
          status: 404,
          message: 'Complaints not found',
        })
      }
    } catch (err) {
      console.error('Error fetching location by DTR complaints ID:', err.message)
      next(new ErrorHandler('Internal server error', 500)) // Pass error to the global error handler
    }
  }
  
  export const getSUPcomplaintsbyID = async (req, res, next) => {
    const userId = req.body.id // Assuming you are getting the user ID from the request body
  
    try {
      const complaintData = await getSUPcomplaintsbyID_m(userId)
  
      if (complaintData) {
        // Convert IDs to string if they exist
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
        res.status(404).json({
          status: 404,
          message: 'Complaints not found',
        })
      }
    } catch (err) {
      console.error('Error fetching complaints by ID:', err.message)
      next(new ErrorHandler('Internal server error', 500)) // Pass error to the global error handler
    }
  }
  
  export const updateTodo = async (req, res, next) => {
    try {
      await updateTodo_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, {}, 'updated successfully'))
    } catch (err) {
      console.error('Error updating todo:', err.message)
      next(new ErrorHandler('Failed to update todo', 500)) // Pass error to the global error handler
    }
  }
  
  export const handleAddBriefing = async (req, res, next) => {
    try {
      await handleAddBriefing_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Briefing added successfully'))
    } catch (err) {
      console.error('Error adding briefing:', err.message)
      next(new ErrorHandler('Failed to add briefing', 500)) // Pass error to the global error handler
    }
  }
  export const handleEditBriefing = async (req, res, next) => {
    try {
      await handleEditBriefing_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Briefing updated successfully'))
    } catch (err) {
      console.error('Error updating briefing:', err.message)
      next(new ErrorHandler('Failed to update briefing', 500)) // Pass error to the global error handler
    }
  }
  
  export const getAgents = async (req, res, next) => {
    try {
      const agent_details = await getAgents_m()
  
      // Ensure IDs are converted to string
      return res
        .status(200)
        .json(
          new ApiResponse(200, agent_details, 'Agents retrieved successfully')
        )
    } catch (err) {
      console.error('Error retrieving agents:', err.message)
      next(new ErrorHandler('Failed to retrieve agents', 500)) // Pass error to the global error handler
    }
  }
  
  export const getAgentAttendedComplaint = async (req, res, next) => {
    try {
      const agent_details = await getAgentAttendedComplaint_m()
      return res
        .status(200)
        .json(
          new ApiResponse(200, agent_details, 'Complaints retrieved successfully')
        )
    } catch (err) {
      console.error('Error retrieving agent attended complaints:', err.message)
      next(new ErrorHandler('Failed to retrieve agent attended complaints', 500)) // Pass error to the global error handler
    }
  }
  
  export const getFeederList = async (req, res, next) => {
    try {
      const feederList = await getFeederList_m()
      return res
        .status(200)
        .json(
          new ApiResponse(200, feederList, 'Feeder list retrieved successfully')
        )
    } catch (err) {
      console.error('Error retrieving feeder list:', err.message)
      next(new ErrorHandler('Failed to retrieve feeder list', 500)) // Pass error to the global error handler
    }
  }
  export const handleDeleteButtonClick = async (req, res, next) => {
    try {
      await handleDeleteButtonClick_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, feederList, 'Delete successfully'))
    } catch (err) {
      console.error('Error handling delete button click:', err.message)
      next(new ErrorHandler('Failed to update Todo', 500)) // Pass error to the global error handler
    }
  }
  export const update_details_came_from = async (req, res, next) => {
    try {
      await update_details_came_from_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Details updated successfully'))
    } catch (err) {
      console.error('Error updating details:', err.message)
      next(new ErrorHandler('Failed to update details', 500)) // Pass error to the global error handler
    }
  }
  
  export const check_login_details = async (req, res, next) => {
    try {
      const user = await check_login_details_m(req.body)
  
      if (user.length === 0) {
        // No user found with the given credentials
        return next(new ErrorHandler('Invalid username or password', 401)) // Unauthorized
      }
      return res.status(200).json(new ApiResponse(200, user, 'Login successful'))
    } catch (err) {
      console.error('Error checking login details:', err.message)
      next(new ErrorHandler('Failed to check login details', 500)) // Pass error to the global error handler
    }
  }
  
  export const get_circle_details = async (req, res, next) => {
    try {
      const complaintData = await get_circle_details_m(req.body.id)
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            complaintData,
            'Circle details retrieved successfully'
          )
        )
    } catch (err) {
      console.error('Error retrieving circle details:', err.message)
      next(new ErrorHandler('Failed to retrieve circle details', 500)) // Pass error to the global error handler
    }
  }
  export const get_division_details = async (req, res, next) => {
    try {
      const complaintData = await get_division_details_m(req.body.id)
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            complaintData,
            'Circle details retrieved successfully'
          )
        )
    } catch (err) {
      console.error('Error retrieving division details:', err.message)
      next(new ErrorHandler('Failed to retrieve division details', 500)) // Pass error to the global error handler
    }
  }
  
  export const get_sub_division_details = async (req, res, next) => {
    try {
      const subDivisionData = await get_sub_division_details_m(req.body.id)
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            subDivisionData,
            'Sub-division details retrieved successfully'
          )
        )
    } catch (err) {
      console.error('Error retrieving sub-division details:', err.message)
      next(new ErrorHandler('Failed to retrieve sub-division details', 500)) // Pass error to the global error handler
    }
  }
  export const get_dc_details = async (req, res, next) => {
    try {
      const dcDetails = await get_dc_details_m(req.body.id)
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            dcDetails,
            'Distributed center details retrieved successfully'
          )
        )
    } catch (err) {
      console.error('Error retrieving distributed center details:', err.message)
      next(new ErrorHandler('Failed to retrieve distributed center details', 500)) // Pass error to the global error handler
    }
  }
  
  export const get_foc_details = async (req, res, next) => {
    try {
      const focDetails = await get_foc_details_m(req.body.id)
      return res
        .status(200)
        .json(
          new ApiResponse(200, focDetails, 'FOC details retrieved successfully')
        )
    } catch (err) {
      console.error('Error retrieving FOC details:', err.message)
      next(new ErrorHandler('Failed to retrieve FOC details', 500)) // Pass error to the global error handler
    }
  }
  export const updateWorngDC = async (req, res, next) => {
    try {
      await updateWorngDC_m(req.body)
  
      return res.status(200).json(new ApiResponse(200, {}, 'Update successfu'))
    } catch (err) {
      console.error('Error updating wrong DC:', err.message)
      next(new ErrorHandler('Failed to update wrong DC', 500)) // Pass error to the global error handler
    }
  }
  export const updateservey = async (req, res, next) => {
    try {
      await updateservey_m(req.body)
  
      return res.status(200).json(new ApiResponse(200, {}, 'Update successfu'))
    } catch (err) {
      console.error('Error updating survey:', err.message)
      next(new ErrorHandler('Failed to update survey', 500)) // Pass error to the global error handler
    }
  }
  export const UpdateAgentstatus = async (req, res, next) => {
    try {
      await UpdateAgentstatus_m(req.body)
      return res.status(200).json(new ApiResponse(200, {}, 'Update successfu'))
    } catch (err) {
      console.error('Error updating agent status:', err.message)
      next(new ErrorHandler('Failed to update agent status', 500)) // Pass error to the global error handler
    }
  }
  export const updateDtrWorngDC = async (req, res, next) => {
    try {
      //console.log(req.body)
      await updateDtrWorngDC_m(req.body)
      return res.status(200).json(new ApiResponse(200, {}, 'Update successful'))
    } catch (err) {
      console.error('Error updating DTR wrong DC:', err.message)
      next(new ErrorHandler('Failed to update DTR wrong DC', 500)) // Pass error to the global error handler
    }
  }
  export const Delete_attended_complaint_session = async (req, res, next) => {
    try {
      await Delete_attended_complaint_session_m(req.body)
      return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Complaint session deleted successfully'))
    } catch (err) {
      console.error('Error deleting attended complaint session:', err.message)
      next(new ErrorHandler('Failed to delete attended complaint session', 500)) // Pass error to the global error handler
    }
  }
  
  export const getShutDownDetails = async (req, res, next) => {
    try {
      const ShutDown = await getShutDownDetails_m()
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            ShutDown,
            'ShutDown details retrieved successfully'
          )
        )
    } catch (err) {
      console.error('Error retrieving ShutDown details:', err.message)
      next(new ErrorHandler('Failed to retrieve ShutDown details', 500))
    }
  }
  
  export const SaveDC = (req, res, next) => {
    SaveDC_m(req.body)
      .then(() => {
        return res.status(200).json(new ApiResponse(200, {}, 'Save DC'))
      })
      .catch((err) => {
        console.log(err)
        res.json({
          status: 403,
          message: err,
        })
      })
  }
  export const SaveRegion = (req, res, next) => {
    SaveRegion_m(req.body)
      .then(() => {
        return res.status(200).json(new ApiResponse(200, {}, 'Save Region'))
      })
      .catch((err) => {
        console.log(err)
        res.json({
          status: 403,
          message: err,
        })
      })
  }
  export const SaveCircle = (req, res, next) => {
    SaveCircle_m(req.body)
      .then(() => {
        return res.status(200).json(new ApiResponse(200, {}, 'Save Circle'))
      })
      .catch((err) => {
        console.log(err)
        res.json({
          status: 403,
          message: err,
        })
      })
  }
  export const SaveDivision = (req, res, next) => {
    SaveDivision_m(req.body)
      .then(() => {
        return res.status(200).json(new ApiResponse(200, {}, 'Save Division'))
      })
      .catch((err) => {
        console.log(err)
        res.json({
          status: 403,
          message: err,
        })
      })
  }
  export const SaveSubdivion = (req, res, next) => {
    SaveSubdivion_m(req.body)
      .then(() => {
        res.json({
          status: 200,
          message: 'Update Todo',
        })
      })
      .catch((err) => {
        console.log(err)
        res.json({
          status: 403,
          message: err,
        })
      })
  }
  export const DeleteAllSession = (req, res, next) => {
    DeleteAllSession_m(req.body)
      .then(() => {
        res.json({
          status: 200,
          message: 'Update Todo',
        })
      })
      .catch((err) => {
        console.log(err)
        res.json({
          status: 403,
          message: err,
        })
      })
  }
  export const SaveCompComplaint = (req, res, next) => {
    SaveCompComplaint_m(req.body)
      .then((result) => {
        res.json({
          status: result.code,
          complaint_id: result.complaint_id,
          message: result.message,
          response: result.response,
        })
      })
      .catch((err) => {
        console.log(err)
        res.json({
          status: 403,
          message: err,
        })
      })
  }
  export const SaveCompDtrComplaint = (req, res, next) => {
    SaveCompDtrComplaint_m(req.body)
      .then((result) => {
        res.json({
          status: result.code,
          complaint_id: result.complaint_id,
          message: result.message,
          response: result.response,
        })
      })
      .catch((err) => {
        console.error(err)
        next(
          new ErrorHandler(
            err.message || 'Internal server error',
            err.statusCode || 500
          )
        )
      })
  }
  export const getdtrcomplaintsbyID = async (req, res, next) => {
    try {
      const complaintData = await getdtrcomplaintsbyID_m(req.body.id)
  
      return res
        .status(200)
        .json(
          new ApiResponse(200, complaintData, 'Complaint retrieved successfully')
        )
    } catch (err) {
      console.error(err)
      next(new ErrorHandler('Internal server error', 500))
    }
  }
  
  export const get_feeder_wise_division = async (req, res, next) => {
    try {
      const divisions = await get_feeder_wise_division_m()
      return res
        .status(200)
        .json(new ApiResponse(200, divisions, 'Division Fetch Successfully'))
    } catch (err) {
      console.error(err)
      next(new ErrorHandler('Internal server error', 500))
    }
  }
  
  export const get_feeder_wise_dc = async (req, res, next) => {
    try {
      const dcs = await get_feeder_wise_dc_m(req.body.division)
      return res
        .status(200)
        .json(new ApiResponse(200, dcs, 'DC Fetch Successfully'))
    } catch (err) {
      console.error(err)
      next(new ErrorHandler('Internal server error', 500))
    }
  }
  export const get_feeder_wise_feeder = async (req, res, next) => {
    try {
      const feeders = await get_feeder_wise_feeder_m(req.body.dc_name)
      return res
        .status(200)
        .json(new ApiResponse(200, feeders, 'Feeder Fetch Successfully'))
    } catch (err) {
      console.error(err)
      next(new ErrorHandler('Internal server error', 500))
    }
  }
  