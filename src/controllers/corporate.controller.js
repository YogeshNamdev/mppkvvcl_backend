import {
    get_complaints_details_via_by_id_m,
    get_complaints_History_via_by_id_m,
    getCopComplaints_m,
  } from '../models/corporate.js'
  import { ApiResponse } from '../utils/ApiResponse.js'
  import ErrorHandler from '../utils/errorHandler.js'
  
  export const getCopComplaints = async (req, res, next) => {
    try {
      const result = await getCopComplaints_m()
  
      // Transform data
      // for (const data of result) {
      //   data.id = data.id.toString()
      //   data.complaints_consumer_id = data.complaints_consumer_id.toString()
      // }
  
      res.json({
        status: 200,
        data: result,
      })
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
  export const get_complaints_History_via_by_id = async (req, res, next) => {
    try {
      if (!req.body) return next(new ErrorHandler('Invalid Request', 500))
      if (req.body.complaints_id === '')
        return next(new ErrorHandler('Invalid Request', 404))
  
      const result = await get_complaints_History_via_by_id_m(
        req.body.complaints_id
      )
      res.json({
        status: 200,
        data: result,
      })
    } catch (err) {
      console.error('Error in get_complaints_History_via_by_id:', err)
      next(new ErrorHandler(err.message, 500))
    }
  }
  