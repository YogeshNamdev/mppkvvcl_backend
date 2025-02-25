import mariadb from 'mariadb'
import pool from '../db/dcConnection.js'
import { format, addYears } from 'date-fns'
import ErrorHandler from '../utils/errorHandler.js'
// const pool = mariadb.createPool({
//   host: 'localhost',
//   user: 'root',
//   password: 'root',
//   database: 'test',
//   connectionLimit: 50,
// })

export const actionSupSend_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    console.log('valuse', data)
    // Update complaint status
    const updateResult = await conn.query(
      'UPDATE complaints SET complaints_current_status = ? WHERE complaints_id = ?',
      [data.action, data.complaints_id]
    )

    if (updateResult.affectedRows > 0) {
      // Insert into complaint history
      const historyResult = await conn.query(
        'INSERT INTO complaints_history (complaints_history_complaint_id, complaints_history_type, complaints_history_followup_by, complaints_history_remark, complaints_history_status, complaints_history_attended_date) VALUES (?, ?, ?, ?, ?, ?)',
        [
          data.complaints_id,
          'Action And Remark',
          'Agent',
          data.remark,
          data.action,
          data.date_time_attended,
        ]
      )
      console.log('Inserted history record with ID:', historyResult.insertId)
    }
  } catch (err) {
    console.error('Database operation failed:', err)
    throw new Error('Database operation failed') // Rethrow to be caught in the controller
  } finally {
    if (conn) conn.release() // Release connection back to pool
  }
}
export const check_login_details_m = async (users) => {
  let conn

  try {
    conn = await pool.getConnection()

    const query = `
      SELECT * FROM users
      WHERE user_name = ? AND user_password = ?
    `

    const [rows] = await conn.query(query, [
      users.user_name,
      users.user_password,
    ])

    return rows
  } catch (err) {
    console.error(
      'Error executing query in check_login_details_m:',
      err.message
    )
    throw new ErrorHandler('Database query failed', 500) // Use ErrorHandler for consistent error formatting
  } finally {
    if (conn) conn.release() // Release connection back to the pool
  }
}

export const Delete_attended_complaint_session_m = async (data) => {
  if (!data.ameyo_session_id || typeof data.ameyo_campaign_id !== 'number') {
    throw new ErrorHandler('Invalid data provided', 400) // Validate input data
  }

  let conn
  try {
    conn = await pool.getConnection()

    const query =
      data.ameyo_campaign_id == 12
        ? 'DELETE FROM ameyo WHERE ameyo_session_id = ?'
        : 'DELETE FROM ameyo_closer WHERE ameyo_session_id = ?'

    await conn.query(query, [data.ameyo_session_id])
  } catch (err) {
    console.error(
      'Error executing Delete_attended_complaint_session_m:',
      err.message
    )
    throw new ErrorHandler('Failed to delete attended complaint session', 500) // Use ErrorHandler for consistent error formatting
  } finally {
    if (conn) conn.release() // Release connection back to the pool
  }
}
export const DeleteAllSession_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    await conn.query('delete from ameyo_closer')
  } finally {
    if (conn) conn.end() //end to pool
  }
}
export const deleteTodos_m = async (id) => {
  let conn
  try {
    conn = await pool.getConnection()
    await conn.query(
      'DELETE FROM todo WHERE id = ?',
      [id] // Use parameterized query to prevent SQL injection
    )
  } catch (err) {
    console.error('Error deleting todo item:', err.message)
    throw new ErrorHandler('Database query failed', 500) // Use ErrorHandler for consistent error formatting
  } finally {
    if (conn) conn.release() // Release connection back to the pool
  }
}
export const fetchCategoryData_m = async () => {
  let conn

  try {
    conn = await pool.getConnection()
    const res = await conn.query(
      'SELECT category_main_id, category_main_name FROM category_main WHERE merge_show = 1'
    )

    return res
  } catch (error) {
    throw new ErrorHandler(error.message, 500)
  } finally {
    if (conn) conn.end() // Ensure the connection is always closed
  }
}

export const fetchQuestionData_m = async (id) => {
  let conn
  try {
    conn = await pool.getConnection()

    const [questions] = await conn.query(
      'SELECT q_id, q_title_hindi, q_type FROM questions_master WHERE q_subcategory = ? AND q_parent_ques IS NULL AND q_status = 0 ORDER BY q_order',
      [id]
    )
    const [questionIdsData] = await conn.query(
      'SELECT GROUP_CONCAT(q_id) AS question_ids FROM questions_master WHERE q_subcategory = ? AND q_parent_ques IS NULL AND q_status = 0 ORDER BY q_order',
      [id]
    )
    if (
      !questionIdsData[0].question_ids ||
      questionIdsData[0].question_ids == null
    ) {
      throw new ErrorHandler('No questions found', 404)
    }

    const [options] = await conn.query(
      `SELECT * FROM options_master WHERE opt_question IN (${questionIdsData[0].question_ids})`
    )

    return { questions, options }
  } catch (err) {
    console.error('Error in fetchQuestionData_m:', err)
    throw new ErrorHandler('Database query failed', 500)
  } finally {
    if (conn) conn.release() // End the connection back to the pool
  }
}
export const fetchSubCategoryData_m = async (id) => {
  let conn

  try {
    conn = await pool.getConnection()
    const res = await conn.query(
      'SELECT category_sub_id, category_sub_name FROM category_sub WHERE category_sub_status = 1 AND category_sub_main_id = ?',
      [id]
    )

    return res
  } catch (error) {
    throw new ErrorHandler(error.message, 500)
  } finally {
    if (conn) conn.end() // Ensure the connection is always closed
  }
}
export const get_all_circle_m = async () => {
  let conn
  try {
    conn = await pool.getConnection()
    const [res] = await conn.query(
      'SELECT circle_id, circle_name FROM circle WHERE circle_status = 1'
    )

    return res // Directly return the result
  } catch (err) {
    throw new ErrorHandler(500, err.message) // Use ErrorHandler class
  } finally {
    if (conn) conn.end() // End connection to pool
  }
}
export const get_all_District_m = async () => {
  let conn

  try {
    conn = await pool.getConnection()
    const res = await conn.query(
      'SELECT district_id, district_name FROM district WHERE district_status = 1'
    )

    return { res }
  } catch (error) {
    throw new ErrorHandler(error.message, 500)
  } finally {
    if (conn) conn.end() // Ensure the connection is always closed
  }
}
export const get_block_details_m = async (id) => {
  let conn

  try {
    conn = await pool.getConnection()
    const res1 = await conn.query(
      'SELECT block_name, block_id FROM block WHERE block_district_id = ?',
      [id]
    )
    return { res1 }
  } catch (err) {
    throw new ErrorHandler(500, err.message) // Use ErrorHandler class
  } finally {
    if (conn) conn.end() // End connection to pool
  }
}
export const get_circle_details_m = async (id) => {
  let conn

  try {
    conn = await pool.getConnection()

    const query = `
      SELECT circle_name, circle_id 
      FROM circle 
      WHERE circle_region_id = ?
    `

    const [res1] = await conn.query(query, [id])

    return { res1 }
  } catch (err) {
    console.error('Error executing query in get_circle_details_m:', err.message)
    throw new ErrorHandler('Database query failed', 500) // Use ErrorHandler for consistent error formatting
  } finally {
    if (conn) conn.release() // Release connection back to the pool
  }
}
export const get_city_details_m = async (id) => {
  let conn

  try {
    conn = await pool.getConnection()
    const res1 = await conn.query(
      'SELECT city_name, city_id FROM city WHERE city_district_id = ?',
      [id]
    )

    return { res1 }
  } catch (error) {
    throw new ErrorHandler(error.message, 500)
  } finally {
    if (conn) conn.end() // Ensure the connection is always closed
  }
}
// export const get_complaints_details_via_by_id_m = async (data) => {
//   let conn
//   try {
//     conn = await pool.getConnection()

//     const [complaintRes] = await conn.query(
//       'SELECT complaints_consumer_id FROM complaints WHERE complaints_id = ?',
//       [data.complaints_id]
//     )

//     const baseQuery = `
//       SELECT
//         a.*,
//         cat.category_main_name,
//         scat.category_sub_name,
//         foc.foc_name,
//         region.region_name,
//         circle.circle_name,
//         division.division_name,
//         sub_division.sub_division_name,
//         dc.distributed_center_name,
//         district.district_name,
//         city.city_name,
//         block.block_name,
//         gram_panchayat.gram_panchayat_name,
//         village.village_name,
//         area.area_name,
//         colony.colony_name
//       FROM complaints AS a
//       INNER JOIN category_main AS cat ON cat.category_main_id = a.complaints_main_category
//       LEFT JOIN category_sub AS scat ON scat.category_sub_id = a.complaints_sub_category
//       LEFT JOIN foc_masters AS foc ON foc.foc_id = a.complaints_assign_foc_center_id
//       LEFT JOIN region ON region.region_id = a.complaints_region
//       LEFT JOIN circle ON circle.circle_id = a.complaints_circle
//       LEFT JOIN division ON division.division_id = a.complaints_division
//       LEFT JOIN sub_division ON sub_division.sub_division_id = a.complaints_sub_division
//       LEFT JOIN distributed_center AS dc ON dc.distributed_center_id = a.complaints_dc
//       LEFT JOIN district ON district.district_id = a.complaints_district
//       LEFT JOIN city ON city.city_id = a.complaints_city
//       LEFT JOIN block ON block.block_id = a.complaints_block
//       LEFT JOIN gram_panchayat ON gram_panchayat.gram_panchayat_id = a.complaints_panchayat
//       LEFT JOIN village ON village.village_id = a.complaints_village
//       LEFT JOIN area ON area.area_id = a.complaints_area
//       LEFT JOIN colony ON colony.colony_id = a.complaints_colony
//       WHERE a.complaints_id = ?
//     `

//     let [info] = await conn.query(baseQuery, [data.complaints_id])

//     const [escalationDetails] = await conn.query(
//       `
//       SELECT
//         users_first_name, users_last_name, users_mobile, escalation_officer_type, escalation_time
//       FROM complaints_escalation
//       LEFT JOIN users ON users.users_id = escalation_officer_id
//       WHERE escalation_complaint_id = ?
//       GROUP BY escalation_officer_type
//       ORDER BY escalation_id
//       `,
//       [data.complaints_id]
//     )

//     let escalation = []
//     let level = 1

//     escalationDetails.forEach((value) => {
//       const {
//         escalation_officer_type,
//         users_first_name,
//         users_last_name,
//         users_mobile,
//         escalation_time,
//       } = value

//       const officerTypeMapping = {
//         7: 'JE',
//         6: 'AE',
//       }

//       const type = officerTypeMapping[escalation_officer_type] || 'Unknown'
//       const name = `${users_first_name} ${users_last_name}`
//       const tat = `${escalation_time} H`

//       escalation.push({ name, mob: users_mobile, type, level, tat })
//       level++
//     })

//     let lunit = []
//     if (info.complaints_lt_ht_type === 2 && complaintRes.length > 0) {
//       lunit = await conn.query(
//         `
//         SELECT
//           CASE
//             WHEN load_unit = 1 THEN 'Watt'
//             WHEN load_unit = 2 THEN 'Kilo Watt'
//             WHEN load_unit = 3 THEN 'HP'
//             ELSE 'NA'
//           END AS lunitq,
//           Consumer_load, consumer_meter_number
//         FROM consumer
//         WHERE consumer_id = ?
//         `,
//         [complaintRes[0].complaints_consumer_id]
//       )
//     }

//     const [fid_mert] =
//       complaintRes.length > 0
//         ? await conn.query(
//             `
//       SELECT consumer_fidder_id, consumer_meter_number
//       FROM consumer
//       WHERE consumer_id = ?
//       `,
//             [complaintRes[0].complaints_consumer_id]
//           )
//         : [[]]

//     const [questions] = await conn.query(
//       `
//       SELECT *
//       FROM complaints_question
//       LEFT JOIN questions_master ON complaints_question.question_id = questions_master.q_id
//       LEFT JOIN options_master ON options_master.opt_id = complaints_question.question_option_id
//       WHERE complaints_question.complaint_id = ?
//       `,
//       [data.complaints_id]
//     )

//     const jeDetails = await getJEData(conn, info, 7)
//     const aeDetails = await getAEData(conn, info, 6)

//     const [foc_det] =
//       info.complaints_assign_foc_center_id !== 0
//         ? await conn.query(
//             `
//       SELECT users_first_name, users_foc_mobile
//       FROM users
//       WHERE users_foc_center_id = ? AND users_type = 9 AND users_status = 1
//       `,
//             [info.complaints_assign_foc_center_id]
//           )
//         : [[]]

//     const [history] = await conn.query(
//       `
//       SELECT complaints_history_id, complaints_history_created_date, complaints_history_status,
//              complaints_history_followup_by, complaints_history_remark
//       FROM complaints_history
//       WHERE complaints_history_complaint_id = ?
//       ORDER BY complaints_history_id DESC
//       `,
//       [data.complaints_id]
//     )

//     return {
//       info,
//       ae_det: aeDetails,
//       je_det: jeDetails,
//       questions: questions.length ? questions : [],
//       lunit,
//       fid_mert: fid_mert.length ? fid_mert : [],
//       escalation,
//       foc_det,
//       res2: history,
//     }
//   } finally {
//     if (conn) conn.release()
//   }
// }

// // Helper function to fetch officer details
// async function getJEData(conn, info, officerType) {
//   let cond = ''
//   const queries = []
//   let category = info[0].complaints_main_category
//   let dc = info[0].complaints_dc
//   let gr_no = info[0].complaints_consumer_gr_no
//   let loc_no = info[0].complaints_consumer_loc_no
//   if (officerType == 7) {
//     const [je_count] = await conn.query(
//       `
//       SELECT users_id FROM users
//       WHERE users_status = 1
//       AND users_type = ${officerType}
//       AND users_distributed_center_id = ${dc}
//       `
//     )
//     if(je_count.length>=1){
//         const [je_cate] = await conn.query(
//         `
//         SELECT users_id FROM users
//         WHERE users_status = 1
//         AND users_type = ${officerType}
//         AND users_distributed_center_id = ${dc}
//         AND find_in_set(${category}, users_category)
//         `
//       )
//       const [je_loc] = await conn.query(
//         `
//         SELECT users_id FROM users
//         WHERE users_status = 1
//         AND users_type = ${officerType}
//         AND users_distributed_center_id = ${dc}
//         AND find_in_set(${loc_no}, users_loc)
//         `
//       )
//       const [je_grp] = await conn.query(
//         `
//         SELECT users_id FROM users
//         WHERE users_status = 1
//         AND users_type = ${officerType}
//         AND users_distributed_center_id = ${dc}
//         AND find_in_set(${gr_no}, users_group)
//         `
//       )
//       if(je_cate.length!=0 && je_loc.length != 0 && je_grp.length != 0){
//          cond +=  ` AND find_in_set(${gr_no}, users_group) AND find_in_set(${loc_no}, users_loc) AND find_in_set(${category}, users_category)`;
//       }else if (je_cate.length!=0 && je_grp.length != 0){
//          cond +=  ` AND find_in_set(${gr_no}, users_group) AND find_in_set(${category}, users_category)`;

//       }else if (je_cate.length!=0 && je_loc.length != 0){
//          cond +=  ` AND find_in_set(${loc_no}, users_loc) AND find_in_set(${category}, users_category)`;
//       }else if(je_loc.length != 0 && je_grp.length != 0){
//          cond +=  ` AND find_in_set(${gr_no}, users_group) AND find_in_set(${loc_no}, users_loc)`;
//       }else if(je_loc.length != 0){
//          cond +=  ` AND find_in_set(${loc_no}, users_loc)`;
//       }else if(je_grp.length != 0){
//          cond +=  ` AND find_in_set(${gr_no}, users_group)`;
//       }else if(je_cate.length!=0){
//          cond +=  ` AND find_in_set(${category}, users_category)`;
//       }
//     }
//     if(je_count.length>=1){
//       cond +=  ` AND find_in_set(${category}, users_category)`;
//       const [je_details] = await conn.query(
//         ` select users_first_name,users_last_name,users_mobile,users_mobile_2 from users where users_status = 1 and users_type=7 and if(users_common_dc=1,find_in_set(${dc},users_common_dc_id),users_distributed_center_id=${dc} `
//       )
//     }else{

//     }

//   }

//   if (info[0].complaints_consumer_loc_no) {
//     cond += ` AND users_loc LIKE '%${info[0].complaints_consumer_loc_no}%'`
//   }
//   if (info[0].complaints_consumer_gr_no) {
//     cond += ` AND users_group LIKE '%${info[0].complaints_consumer_gr_no}%'`
//   }
//   if (info[0].complaints_main_category) {
//     cond += ` AND users_category LIKE '%${info[0].complaints_main_category}%'`
//   }

//   const [officerDetails] = await conn.query(
//     `
//     SELECT users_first_name, users_last_name, users_mobile
//     FROM users
//     WHERE users_status = 1
//       AND users_type = ${officerType}
//       AND users_distributed_center_id = ${info[0].complaints_dc}
//       ${cond}
//     `
//   )
//   return officerDetails.length ? officerDetails : []
// }
// async function getOfficerData(conn, info, officerType) {
//   let cond = ''
//   const queries = []
//   console.log('officerType', officerType)
//   if (info[0].complaints_consumer_loc_no) {
//     cond += ` AND users_loc LIKE '%${info[0].complaints_consumer_loc_no}%'`
//   }
//   if (info[0].complaints_consumer_gr_no) {
//     cond += ` AND users_group LIKE '%${info[0].complaints_consumer_gr_no}%'`
//   }
//   if (info[0].complaints_main_category) {
//     cond += ` AND users_category LIKE '%${info[0].complaints_main_category}%'`
//   }

//   const [officerDetails] = await conn.query(
//     `
//     SELECT users_first_name, users_last_name, users_mobile
//     FROM users
//     WHERE users_status = 1
//       AND users_type = ${officerType}
//       AND users_distributed_center_id = ${info[0].complaints_dc}
//       ${cond}
//     `
//   )
//   return officerDetails.length ? officerDetails : []
// }
export const get_complaints_details_via_by_id_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    //let info, que, level, prd, escalation, lunit, fid_mert, questions
    const res = await conn.query(
      'SELECT complaints_consumer_id FROM `complaints` WHERE complaints_id = ' +
        data.complaints_id +
        ''
    )
    if (res && res.length > 0) {
      var [info] = await conn.query(
        'SELECT a.*, cat.category_main_name, scat.category_sub_name, foc.foc_name, region.region_name, circle.circle_name, division.division_name, sub_division.sub_division_name, dc.distributed_center_name, district.district_name, city.city_name, block.block_name, gram_panchayat.gram_panchayat_name, village.village_name, area.area_name, colony.colony_name   FROM `complaints` as a INNER JOIN category_main as cat ON cat.category_main_id=a.complaints_main_category  LEFT JOIN category_sub as scat ON scat.category_sub_id=a.complaints_sub_category LEFT JOIN foc_masters as foc ON foc.foc_id=a.complaints_assign_foc_center_id  LEFT JOIN region  ON region.region_id=a.complaints_region  LEFT JOIN circle  ON circle.circle_id=a.complaints_circle LEFT JOIN division  ON division.division_id=a.complaints_division LEFT JOIN sub_division  ON sub_division.sub_division_id=a.complaints_sub_division LEFT JOIN distributed_center as dc  ON dc.distributed_center_id=a.complaints_dc LEFT JOIN district ON district.district_id=a.complaints_district LEFT JOIN city ON city.city_id=a.complaints_city  LEFT JOIN block ON block.block_id=a.complaints_block LEFT JOIN gram_panchayat ON gram_panchayat.gram_panchayat_id=a.complaints_panchayat LEFT JOIN village ON village.village_id=a.complaints_village  LEFT JOIN area ON area.area_id=a.complaints_area LEFT JOIN colony ON colony.colony_id=a.complaints_colony WHERE complaints_id=' +
          data.complaints_id +
          ''
      )
    } else {
      var [info] = await conn.query(
        'SELECT * FROM `complaints` INNER JOIN category_main ON category_main.category_main_id=complaints_main_category  LEFT JOIN category_sub ON category_sub.category_sub_id=complaints_sub_category INNER JOIN region ON region.region_id=complaints_region INNER JOIN circle ON circle.circle_id=complaints_circle LEFT JOIN division ON division.division_id=complaints_division LEFT JOIN sub_division ON sub_division.sub_division_id=complaints_sub_division LEFT JOIN distributed_center ON distributed_center.distributed_center_id=complaints_dc LEFT JOIN district ON district.district_id=complaints_district LEFT JOIN city ON city.city_id=complaints_city  LEFT JOIN block ON block.block_id=complaints_block LEFT JOIN gram_panchayat ON gram_panchayat.gram_panchayat_id=complaints_panchayat LEFT JOIN village ON village.village_id=complaints_village  LEFT JOIN area ON area.area_id=complaints_area LEFT JOIN colony ON colony.colony_id=complaints_colony WHERE complaints_id=' +
          data.complaints_id +
          ''
      )
    }

    var [que] = await conn.query(
      'select * from complaints_escalation LEFT JOIN users on users.users_id=escalation_officer_id LEFT JOIN gang on gang.gang_id=escalation_gang_id where escalation_complaint_id= ? group by escalation_officer_type order by escalation_id',
      [data.complaints_id]
    )

    let level = 1
    let prd = 5
    const arr = []
    if (que.length > 0) {
      que.forEach((value) => {
        const arr1 = {}

        if (value.escalation_officer_id !== '') {
          let name = value.users_first_name + ' ' + value.users_last_name
          let type, mob
          if (value.escalation_officer_type == 7) {
            type = 'JE'
            mob = value.users_mobile
          } else if (value.escalation_officer_type == 6) {
            type = 'AE'
            mob = value.users_mobile
          }

          const tat = value.escalation_time + ' H'

          arr1.name = name
          arr1.mob = mob
          arr1.type = type
          arr1.level = level
          arr1.tat = tat

          arr.push(arr1)

          level++
          prd--
        }
      })
    }

    var escalation = arr
    var lunit = []

    if (info.complaints_lt_ht_type == 2) {
      if (
        info[0].complaints_consumer_id != 0 ||
        info[0].complaints_consumer_id != ''
      ) {
        lunit = await conn.query(
          'SELECT CASE WHEN load_unit = 1 THEN "Watt" WHEN load_unit = 2 THEN "Kilo Watt" WHEN load_unit = 3 THEN "HP"  ELSE "NA" END AS lunitq,Consumer_load,consumer_meter_number FROM `consumer` WHERE consumer_id = ' +
            info[0].complaints_consumer_id +
            ''
        )
        if (lunit.length == 0) {
          var lunit = []
        }
      }
    }
    if (
      info[0].complaints_consumer_id != 0 ||
      info[0].complaints_consumer_id != ''
    ) {
      var [fid_mert] = await conn.query(
        'SELECT consumer_fidder_id,consumer_meter_number FROM `consumer` WHERE consumer_id = ' +
          info[0].complaints_consumer_id +
          ''
      )
      if (fid_mert.length == 0) {
        var fid_mert = []
      }
    } else {
      var fid_mert = []
    }

    var [questions] = await conn.query(
      'SELECT * FROM `complaints_question` LEFT JOIN questions_master on complaints_question.question_id=questions_master.q_id LEFT JOIN options_master on options_master.opt_id=complaints_question.question_option_id   WHERE complaints_question.complaint_id=' +
        data.complaints_id +
        ''
    )
    if (questions.length == 0) {
      questions = []
    }
    if (info[0].complaints_dc != 0) {
      var cond = ''
      var [je_count] = await conn.query(
        'SELECT users_id FROM users WHERE users_type = 7 AND users_status = 1 AND users_distributed_center_id = ?',
        [info[0].complaints_dc]
      )
      if (je_count && je_count.length > 0) {
        var mat = info[0].complaints_main_category

        var [category_officer] = await conn.query(
          'SELECT users_id FROM users WHERE users_type = 7 AND users_status = 1 AND users_distributed_center_id = ?  and find_in_set(?,users_category)',
          [info[0].complaints_dc, mat]
        )
        var [je_loc_id] = await conn.query(
          'SELECT users_id FROM users WHERE users_type = 7 AND users_status = 1 AND users_distributed_center_id = ? and find_in_set(?,users_loc)',
          [info[0].complaints_dc, info[0].complaints_consumer_loc_no]
        )
        var [je_grp_id] = await conn.query(
          'SELECT users_id FROM users WHERE users_type = 7 AND users_status = 1 AND users_distributed_center_id = ? and find_in_set(?,users_group)',
          [info[0].complaints_dc, info[0].complaints_consumer_gr_no]
        )
        if (
          category_officer.length > 0 &&
          je_loc_id.length > 0 &&
          je_grp_id.length > 0
        ) {
          cond +=
            'and find_in_set(' +
            mat +
            ',users_category) and find_in_set("' +
            info[0].complaints_consumer_loc_no +
            '",users_loc) and find_in_set("' +
            info[0].complaints_consumer_gr_no +
            '",users_group)'
        } else if (category_officer.length > 0 && je_grp_id.length > 0) {
          cond +=
            'and find_in_set(' +
            mat +
            ',users_category) and find_in_set("' +
            info[0].complaints_consumer_gr_no +
            '",users_group)'
        } else if (category_officer.length > 0 && je_loc_id.length > 0) {
          cond +=
            'and find_in_set(' +
            mat +
            ',users_category) and find_in_set("' +
            info[0].complaints_consumer_loc_no +
            '",users_loc)'
        } else if (je_grp_id.length > 0 && je_loc_id.length > 0) {
          cond +=
            'and find_in_set("' +
            info[0].complaints_consumer_loc_no +
            '",users_loc) and find_in_set("' +
            info[0].complaints_consumer_gr_no +
            '",users_group)'
        } else if (category_officer.length > 0) {
          cond += 'and find_in_set(' + mat + ',users_category)'
        } else if (je_loc_id.length > 0) {
          cond +=
            'and find_in_set("' +
            info[0].complaints_consumer_loc_no +
            '",users_loc)'
        } else if (je_grp_id.length > 0) {
          cond +=
            'and find_in_set("' +
            info[0].complaints_consumer_gr_no +
            '",users_group)'
        }

        var [je_det] = await conn.query(
          'select users_first_name,users_last_name,users_mobile from users where users_status = 1 and users_type=7 and if(users_common_dc=1,find_in_set(' +
            info[0].complaints_dc +
            ',users_common_dc_id),users_distributed_center_id=' +
            info[0].complaints_dc +
            ') ' +
            cond +
            ''
        )
      } else {
        let omIndex = info[0].division_name.lastIndexOf('(O&M)')
        if (omIndex !== -1) {
          // let omSubstring = info[0].division_name.slice(omIndex);
          // console.log(omSubstring); // Output the substring starting from '(O&M)' to the end
          // // You can use 'omSubstring' as needed in your code
        } else {
          if (info[0].complaints_consumer_loc_no != '') {
            cond +=
              ' and find_in_set("' +
              info[0].complaints_consumer_loc_no +
              '",users_loc)'
          }
          if (info[0].complaints_consumer_gr_no != '') {
            cond +=
              "and find_in_set('" +
              info[0].complaints_consumer_gr_no +
              "',users_group)"
          }
          if (
            info[0].complaints_consumer_gr_no != '' &&
            info[0].complaints_consumer_loc_no != ''
          ) {
            cond +=
              "and find_in_set('" +
              info[0].complaints_main_category +
              "',users_category)"
          }

          var [je_det] = await conn.query(
            'select users_first_name,users_last_name,users_mobile from users where users_status = 1 and users_type=7 and users_distributed_center_id= ? ' +
              cond +
              '',
            [info[0].complaints_dc]
          )
          if (je_det.length == 0) {
            var cond1 = ''
            if (info[0].complaints_consumer_loc_no != '')
              cond1 +=
                ' and find_in_set(' +
                info[0].complaints_consumer_loc_no +
                ',users_loc)'
            if (info[0].complaints_consumer_gr_no != '')
              cond1 +=
                "and find_in_set('" +
                info[0].complaints_consumer_gr_no +
                "',users_group)"
            if (
              info[0].complaints_consumer_gr_no != '' &&
              info[0].complaints_consumer_loc_no != ''
            )
              cond1 +=
                "and find_in_set('" +
                info[0].complaints_main_category +
                "',users_category)"
            cond1 +=
              "and find_in_set('" +
              info[0].complaints_dc +
              "',users_common_dc_id)"
            var [je_det] = await conn.query(
              'select users_first_name,users_last_name,users_mobile from users where users_status = 1 and users_type=7 and users_common_dc=1 ' +
                cond1 +
                ''
            )
          }
        }
      }
    }
    if (info[0].complaints_sub_division != 0) {
      var cond = ''
      var [ae_count] = await conn.query(
        'select users_id,users_common_dc from users where users_type=6 and users_status=1 and users_sub_division_id=? OR users_common_dc_id =?',
        [info[0].complaints_sub_division, info[0].complaints_sub_division]
      )
      if (ae_count.length == 0) {
        var [ae_count] = await conn.query(
          'select users_id,users_common_dc from users where users_type=6 and users_status=1 and find_in_set (?,users_common_dc_id)',
          [info[0].complaints_sub_division]
        )
      }
      var mcat = info[0].complaints_main_category
      var [category_officer_ae] = await conn.query(
        'select users_id from users where users_type=6 and users_sub_division_id = ? and find_in_set(' +
          mcat +
          ',users_category)',
        [info[0].complaints_sub_division]
      )
      if (info[0].complaints_consumer_loc_no != '') {
        var [ae_loc_id] = await conn.query(
          'select users_id from users where users_type=6 and users_sub_division_id=? and find_in_set(' +
            info[0].complaints_consumer_loc_no +
            ',users_loc)',
          [info[0].complaints_sub_division]
        )
      } else {
        var ae_loc_id = []
      }

      var [ae_grp_id] = await conn.query(
        'select users_id from users where users_type=6 and users_sub_division_id = ? and find_in_set("' +
          info[0].complaints_consumer_gr_no +
          '",users_group)',
        [info[0].complaints_sub_division]
      )
      if (
        category_officer_ae.length > 0 &&
        ae_loc_id.length > 0 &&
        ae_grp_id.length > 0
      ) {
        cond +=
          'and find_in_set(' +
          mat +
          ',users_category) and find_in_set(' +
          info[0].complaints_consumer_loc_no +
          ",users_loc) and find_in_set('" +
          info[0].complaints_consumer_gr_no +
          "',users_group)"
      } else if (category_officer_ae.length > 0 && ae_grp_id.length > 0) {
        cond +=
          'and  find_in_set(' +
          mat +
          ",users_category) and find_in_set('" +
          info[0].complaints_consumer_gr_no +
          "',users_group) "
      } else if (category_officer_ae.length > 0 && ae_loc_id.length > 0) {
        cond +=
          'and find_in_set(' +
          mat +
          ',users_category) and find_in_set(' +
          info[0].complaints_consumer_loc_no +
          ',users_loc)'
      } else if (ae_loc_id.length > 0 && ae_grp_id.length > 0) {
        cond +=
          'and find_in_set(' +
          info[0].complaints_consumer_loc_no +
          ",users_loc) and find_in_set('" +
          info[0].complaints_consumer_gr_no +
          "',users_group)"
      } else if (category_officer_ae.length > 0) {
        cond += 'and find_in_set(' + mat + ',users_category)'
      } else if (ae_loc_id.length > 0) {
        cond +=
          'and find_in_set(' +
          info[0].complaints_consumer_loc_no +
          ',users_loc)'
      } else if (ae_grp_id.length > 0) {
        cond +=
          "and find_in_set('" +
          info[0].complaints_consumer_gr_no +
          "',users_group)"
      }
      var [ae_det] = await conn.query(
        'select users_first_name,users_last_name,users_mobile from users where users_status=1 and users_sub_division_id =? and users_type=6 ' +
          cond +
          '',
        [info[0].complaints_sub_division]
      )
      if (ae_det.length == 0) {
        var [ae_det] = await conn.query(
          'select users_first_name,users_last_name,users_mobile from users where users_status=1 and find_in_set (' +
            [info[0].complaints_sub_division] +
            ',users_common_dc_id) and users_type=6 ' +
            cond +
            ''
        )
      }
    }
    if (info[0].complaints_assign_foc_center_id != 0) {
      var [foc_det] = await conn.query(
        'select users_first_name,users_foc_mobile from users where users_foc_center_id = ? and users_type=9 and users_status=1',
        [info[0].complaints_assign_foc_center_id]
      )
    } else {
      var [foc_det] = []
    }
    var [res2] = await conn.query(
      'SELECT complaints_history_id,complaints_history_created_date,complaints_history_status,complaints_history_followup_by,complaints_history_remark FROM `complaints_history` WHERE complaints_history_complaint_id= ? ORDER BY complaints_history_id DESC',
      [data.complaints_id]
    )
    if (foc_det == undefined) foc_det = []
    if (je_det == undefined) je_det = []
    if (ae_det == undefined) ae_det = []
    return {
      info,
      ae_det,
      je_det,
      questions,
      lunit,
      fid_mert,
      escalation,
      foc_det,
      res2,
    }
  } finally {
    if (conn) conn.release()
  }
}
export const get_count_of_complaints_m = async () => {
  let conn
  try {
    conn = await pool.getConnection()

    const [complaints] = await conn.query(
      'SELECT COUNT(complaints_id) AS today_total_complaints, COUNT(CASE WHEN complaints_current_status = 1 THEN complaints_id END) AS today_open_complaints, COUNT(CASE WHEN complaints_current_status = 4 THEN complaints_id END) AS today_close_complints, COUNT(CASE WHEN complaints_current_status = 3 THEN complaints_id END) AS today_attended_complaints FROM `complaints` WHERE DATE(complaints.complaints_created_date) = CURDATE()'
    )

    const [dtr_complaints] = await conn.query(
      'SELECT COUNT(dtr_complain_id) AS today_dtr_complain, COUNT(CASE WHEN dtr_complain_status = 2 THEN dtr_complain_id END) AS today_dtr_inspection, COUNT(CASE WHEN dtr_complain_status IN (3, 4, 5) THEN dtr_complain_id END) AS today_dtr_completed FROM `dtr_complaints` WHERE DATE(dtr_complain_date) = CURDATE()'
    )

    return { complaints, dtr_complaints }
  } catch (err) {
    throw new ErrorHandler(500, err.message) // Use ErrorHandler class
  } finally {
    if (conn) conn.release() // End connection to pool
  }
}

export const get_data_via_searchID_m = async (data) => {
  var check_ivrs_no = ''
  let conn
  try {
    conn = await pool.getConnection()

    const details = {}
    const showChildID = data.showChildID

    if ([341, 342, 347, 348, 349, 350].includes(showChildID)) {
      const res = await getComplaintDetails(conn, data.searchId)

      if (res) {
        details['bill_not_pay'] =
          res.payee_status === 'payee'
            ? ''
            : 'You can not proceed further because you have not paid your electricity bill. Kindly pay your bill and then register your claim.'

        const { diffDays, hourDiff } = calculateDateDifferences(
          res.complaints_created_date
        )
        const sundays =
          Math.floor(diffDays / 7) +
          (new Date(res.complaints_created_date).getDay() + (diffDays % 7) >= 7)

        if (isEligible(res, showChildID, diffDays, hourDiff, sundays)) {
          details['response'] = true
          details['sub'] = data.showChildID
          details['child'] = data.formData.child
          details['subchild'] = data.formData.subchild
          details['message'] = 'You are Eligible'
          details['code'] = 200
          details['diffdays'] = diffDays
          details['complaints_main_category'] = res.complaints_main_category
          details['created_date'] = res.complaints_created_date
          details['dc_id'] = res.complaints_dc
          details['division_id'] = res.complaints_division
          details['circle_id'] = res.complaints_circle
          details['region_id'] = res.complaints_region
          details['sub_division_id'] = res.complaints_sub_division
          details['urban_rural'] = res.complaints_urban_rular
          details['foc_center_id'] = res.complaints_assign_foc_center_id
          details['fgl_gang_id'] = res.complaints_assign_gang_id
          details['IVRSNumber'] = res.complaints_ivrs
          details['locationCode'] = res.complaints_consumer_loc_no
          details['groupNo'] = res.complaints_consumer_gr_no
          details['conn_mob'] = res.complaints_consumer_mobile
          details['org_cust_name'] = res.complaints_consumer_name
          details['complaints_district'] = res.complaints_district
          details['complaints_city'] = res.complaints_city
          details['complaints_area'] = res.complaints_area
          details['complaints_colony'] = res.complaints_colony
          details['complaints_block'] = res.complaints_block
          details['complaints_village'] = res.complaints_village

          const je = await getUsersByTypeAndId(
            conn,
            'distributed_center',
            res.complaints_dc
          )
          const ae = await getUsersByTypeAndId(
            conn,
            'division',
            res.complaints_division
          )

          if (je) details['je'] = je
          if (ae) details['ae'] = ae
        } else {
          details['message'] =
            'You are not eligible. Claim registration is allowed within 30 days from breach of service.'
          details['response'] = false
        }
      } else {
        details['message'] = 'You have Entered Wrong Complaint-ID'
        details['response'] = false
      }
      return details
    } else {
      const details = { response: true }
      const no = data.searchId || ''
      const showChildID = data.showChildID
      if (!no) {
        return setResponse(details, false, 'In-Valid Request')
      }

      if (!no.toLowerCase().startsWith('ez')) {
        return setResponse(
          details,
          false,
          'The number does not start with "EZ", Please enter a number starting with EZ'
        )
      }

      const ezRecord = await fetchEzRecord(no)

      if (!ezRecord) {
        return setResponse(details, false, 'EZ number is not Found')
      }

      const { payment_date, service_date, days } = calculateDates(ezRecord)

      if (!payment_date) {
        return setResponse(
          details,
          false,
          'You cannot proceed further because you have not paid any payment.'
        )
      }

      if (days > 30) {
        return setResponse(
          details,
          false,
          'You are not eligible. Claim registration is allowed within 30 days from breach of service.'
        )
      }

      const payee_status = 'payee'
      if (payee_status !== 'payee') {
        details.bill_not_pay =
          'You cannot proceed further because you have not paid your electricity bill. Kindly pay your bill and then register your claim'
      } else {
        details.bill_not_pay = ''
      }

      const childvalue = getChildValue(data.formData.child)
      if (!checkEligibility(showChildID, childvalue, days)) {
        return setResponse(details, false, 'You are not Eligible')
      }

      await populateDetails(conn, details, ezRecord, data)

      details.response = true
      details.message = 'You are elegible'
      console.log('details', details)
      return details
    }
  } finally {
    if (conn) conn.release() //end to pool
  }
}

async function getComplaintDetails(conn, complaintsId) {
  const [res] = await conn.query(
    'SELECT * FROM complaints WHERE complaints_id = ?',
    [complaintsId]
  )
  return res.length > 0 ? res[0] : null
}

async function getUsersByTypeAndId(conn, type, id) {
  const [users] = await conn.query(
    `SELECT users_id FROM users WHERE users_${type}_id = ? AND users_type = ? AND users_status = 1`,
    [id, type === 'distributed_center' ? 7 : 6]
  )
  return users.length > 0 ? users[0].users_id : null
}

function calculateDateDifferences(complaintsCreatedDate) {
  const now = new Date().getTime()
  const complaintDate = new Date(complaintsCreatedDate).getTime()
  const datediff = now - complaintDate
  const diffDays = Math.round(datediff / (1000 * 60 * 60 * 24))
  const hourDiff = Math.round(
    (new Date() - new Date(complaintsCreatedDate)) / (1000 * 60 * 60),
    1
  )

  return { diffDays, hourDiff }
}

function isEligible(res, showChildID, diffDays, hourDiff, sundays) {
  if (diffDays > 30) return false

  const urbanRural = res.complaints_urban_rular
  switch (showChildID) {
    case 341:
      if (
        (res.complaints_main_category == 16 &&
          (res.complaints_sub_category == 17 ||
            res.complaints_sub_category == 18)) ||
        res.complaints_main_category == 29
      ) {
        return !(
          (urbanRural == 1 && diffDays < 8) ||
          (urbanRural == 2 && diffDays < 10)
        )
      }
      break
    case 342:
      if (
        res.complaints_main_category == 12 &&
        res.complaints_current_status != 4 &&
        res.complaints_current_status != 6
      ) {
        return !(
          (urbanRural == 1 && diffDays < 5) ||
          (urbanRural == 2 && diffDays < 10)
        )
      }
      break
    case 347:
      if (
        res.complaints_main_category == 17 &&
        res.complaints_current_status != 4 &&
        res.complaints_current_status != 6
      ) {
        return !(
          (urbanRural == 1 && hourDiff <= 4 && sundays == 0) ||
          (urbanRural == 1 && hourDiff <= 5 && sundays > 0) ||
          (urbanRural == 2 && hourDiff < 24)
        )
      }
      break
    case 348:
      if (
        res.complaints_main_category == 17 &&
        hourDiff <= 72 &&
        urbanRural == 2
      ) {
        return false
      }
      break
    case 350:
      if (res.complaints_main_category == 17 && hourDiff <= 12) {
        return false
      }
      break
    default:
      return false
  }
  return true
}
// export const get_data_via_searchID_new_m = async (data) => {
//   var check_ivrs_no = ''
//   let conn
//   try {
//     conn = await pool.getConnection()
//     console.log('data', data)
//     let details = {}
//     const showChildID = data.showChildID
//     if (
//       showChildID == 341 ||
//       showChildID == 342 ||
//       showChildID == 347 ||
//       showChildID == 348 ||
//       showChildID == 349 ||
//       showChildID == 350
//     ) {
//       let [res] = await conn.query(
//         'SELECT * FROM complaints WHERE complaints_id = ?',
//         [data.searchId]
//       )

//       if (res.length > 0) {
//         let payee_status = 'payee'
//         if (payee_status === 'payee') {
//           details['bill_not_pay'] = ''
//         } else {
//           details['bill_not_pay'] =
//             'You can not proceed further because you have not paid your electricity bill . Kindly pay your bill and then register your claim'
//         }

//         const now = new Date().getTime()
//         const yourDate = new Date(res[0].complaints_created_date).getTime()
//         const datediff = now - yourDate
//         const diffDays = Math.round(datediff / (1000 * 60 * 60 * 24))
//         const time1 = new Date(res[0].complaints_created_date)
//         const time2 = new Date()
//         const hourDiff = Math.round((time2 - time1) / (1000 * 60 * 60), 1)

//         if (diffDays <= 30) {
//           if (
//             ((res[0].complaints_main_category == 16 &&
//               (res[0].complaints_sub_category == 17 ||
//                 res[0].complaints_sub_category == 18)) ||
//               res[0].complaints_main_category == 29) &&
//             showChildID == 341
//           ) {
//             if (
//               res[0].complaints_urban_rular == 1 &&
//               datediff < 8 &&
//               showChildID == 341
//             ) {
//               details['response'] = false
//               details['message'] =
//                 'You are not eligible to fill the compensation complaint.'
//             } else if (
//               res[0].complaints_urban_rular == 2 &&
//               datediff < 10 &&
//               showChildID == 341
//             ) {
//               details['response'] = false
//               details['message'] =
//                 'You are not eligible to fill the compensation complaint.'
//             } else {
//               details['response'] = true
//               details['sub'] = data.showChildID
//               details['child'] = data.formData.child
//               details['subchild'] = data.formData.subchild
//               details['message'] = 'You are Eligible'
//               details['code'] = 200
//               details['diffdays'] = diffDays
//               details['complaints_main_category'] =
//                 res[0].complaints_main_category
//               details['created_date'] = res[0].complaints_created_date
//               details['dc_id'] = res[0].complaints_dc
//               details['division_id'] = res[0].complaints_division
//               details['circle_id'] = res[0].complaints_circle
//               details['region_id'] = res[0].complaints_region
//               details['sub_division_id'] = res[0].complaints_sub_division
//               details['urban_rural'] = res[0].complaints_urban_rular
//               details['foc_center_id'] = res[0].complaints_assign_foc_center_id
//               details['fgl_gang_id'] = res[0].complaints_assign_gang_id
//               details['IVRSNumber'] = res[0].complaints_ivrs
//               details['locationCode'] = res[0].complaints_consumer_loc_no
//               details['groupNo'] = res[0].complaints_consumer_gr_no
//               details['conn_mob'] = res[0].complaints_consumer_mobile
//               details['org_cust_name'] = res[0].complaints_consumer_name
//               details['complaints_district'] = res[0].complaints_district
//               details['complaints_city'] = res[0].complaints_city
//               details['complaints_area'] = res[0].complaints_area
//               details['complaints_colony'] = res[0].complaints_colony
//               details['complaints_block'] = res[0].complaints_block
//               details['complaints_village'] = res[0].complaints_village
//               console.log('details', details)
//               let [je] = await conn.query(
//                 'select users_id from users where users_distributed_center_id = ? and users_type = 7 and users_status = 1',
//                 [res[0].complaints_dc]
//               )
//               console.log('je', je)
//               if (je.length > 0) {
//                 details['je'] = je[0].users_id
//               }
//               let [ae] = await conn.query(
//                 'select users_id from users where users_division_id = ? and users_type = 6 and users_status = 1',
//                 [res[0].complaints_division]
//               )
//               console.log('ae', ae)
//               if (ae.length > 0) {
//                 details['ae'] = ae[0].users_id
//               }
//             }
//           } else if (
//             res[0].complaints_main_category == 12 &&
//             showChildID == 342
//           ) {
//             if (
//               res[0].complaints_current_status != 4 &&
//               res[0].complaints_current_status != 6
//             ) {
//               if (
//                 res[0].complaints_urban_rular == 1 &&
//                 diffDays < 5 &&
//                 showChildID == 342
//               ) {
//                 details['response'] = false
//                 details['message'] =
//                   'You are not eligible to fill the compensation complaint.'
//               } else if (
//                 res[0].complaints_urban_rular == 2 &&
//                 diffDays < 10 &&
//                 showChildID == 342
//               ) {
//                 details['response'] = false
//                 details['message'] =
//                   'You are not eligible to fill the compensation complaint.'
//               } else {
//                 details['response'] = true
//                 details['sub'] = data.showChildID
//                 details['child'] = data.formData.child
//                 details['subchild'] = data.formData.subchild
//                 details['message'] = 'You are Eligible'
//                 details['code'] = 200
//                 details['diffdays'] = diffDays
//                 details['complaints_main_category'] =
//                   res[0].complaints_main_category
//                 details['created_date'] = res[0].complaints_created_date
//                 details['dc_id'] = res[0].complaints_dc
//                 details['division_id'] = res[0].complaints_division
//                 details['circle_id'] = res[0].complaints_circle
//                 details['region_id'] = res[0].complaints_region
//                 details['sub_division_id'] = res[0].complaints_sub_division
//                 details['urban_rural'] = res[0].complaints_urban_rular
//                 details['foc_center_id'] =
//                   res[0].complaints_assign_foc_center_id
//                 details['fgl_gang_id'] = res[0].complaints_assign_gang_id
//                 details['IVRSNumber'] = res[0].complaints_ivrs
//                 details['locationCode'] = res[0].complaints_consumer_loc_no
//                 details['groupNo'] = res[0].complaints_consumer_gr_no
//                 details['conn_mob'] = res[0].complaints_consumer_mobile
//                 details['org_cust_name'] = res[0].complaints_consumer_name
//                 details['complaints_district'] = res[0].complaints_district
//                 details['complaints_city'] = res[0].complaints_city
//                 details['complaints_area'] = res[0].complaints_area
//                 details['complaints_colony'] = res[0].complaints_colony
//                 details['complaints_block'] = res[0].complaints_block
//                 details['complaints_village'] = res[0].complaints_village
//                 let [je] = await conn.query(
//                   'select users_id from users where users_distributed_center_id = ? and users_type = 7 and users_status = 1',
//                   [res[0].complaints_dc]
//                 )
//                 if (je.length > 0) {
//                   details['je'] = je[0].users_id
//                 }
//                 let [ae] = await conn.query(
//                   'select users_id from users where users_division_id = ? and users_type = 6 and users_status = 1',
//                   [res[0].complaints_division]
//                 )
//                 if (ae.length > 0) {
//                   details['ae'] = ae[0].users_id
//                 }
//               }
//             } else {
//               details['message'] = 'This complaints is closed.'
//               details['response'] = false
//             }
//           } else if (
//             res[0].complaints_main_category == 17 &&
//             (showChildID == 347 || showChildID == 348 || showChildID == 350)
//           ) {
//             if (
//               res[0].complaints_current_status != 4 &&
//               res[0].complaints_current_status != 6
//             ) {
//               const start = new Date(res[0].complaints_created_date)
//               const end = new Date() // Current date and time
//               // Calculate the difference in days
//               const daysDiff = Math.floor((end - start) / (1000 * 60 * 60 * 24))
//               // Calculate the number of Sundays
//               const sundays =
//                 Math.floor(daysDiff / 7) +
//                 (start.getDay() + (daysDiff % 7) >= 7)
//               // Calculate the difference in hours
//               const hourDiff = Math.round((end - start) / (1000 * 60 * 60), 1)
//               // Format the time
//               const time1 = start.toLocaleString('en-US', { hour12: false })
//               const time2 = end.toLocaleString('en-US', { hour12: false })
//               // Create DateTime object
//               const dateTime = new Date(res[0].complaints_created_date)
//               // Format time
//               const time = dateTime.toLocaleTimeString('en-US', {
//                 hour12: false,
//               })
//               // Create upcomingDate and set time to 06:00:00
//               let upcomingDate = new Date(start)
//               upcomingDate.setHours(6, 0, 0)
//               // Check if upcomingDate is in the past, if so, increment the date by one day
//               if (upcomingDate < start) {
//                 upcomingDate.setDate(upcomingDate.getDate() + 1)
//               }
//               // Format the first_date and second_date
//               const first_date = upcomingDate.toLocaleString('en-US', {
//                 hour12: false,
//               })
//               upcomingDate.setHours(upcomingDate.getHours() + 12)
//               const second_date = upcomingDate.toLocaleString('en-US', {
//                 hour12: false,
//               })
//               // Current date and time
//               const current_date = new Date().toLocaleString('en-US', {
//                 hour12: false,
//               })
//               if (
//                 res[0].complaints_urban_rular == 1 &&
//                 hourDiff <= 4 &&
//                 sundays == 0 &&
//                 showChildID == 347
//               ) {
//                 details['response'] = false
//                 details['message'] =
//                   'You are not eligible to fill the compensation complaint.'
//               } else if (
//                 res[0].complaints_urban_rular == 1 &&
//                 hourDiff <= 5 &&
//                 sundays > 0 &&
//                 showChildID == 347
//               ) {
//                 details['response'] = false
//                 details['message'] =
//                   'You are not eligible to fill the compensation complaint.'
//               } else if (
//                 res[0].complaints_urban_rular == 2 &&
//                 hourDiff < 24 &&
//                 showChildID == 347
//               ) {
//                 details['response'] = false
//                 details['message'] =
//                   'You are not eligible to fill the compensation complaint.'
//               } else if (hourDiff <= 12 && showChildID == 350) {
//                 details['response'] = false
//                 details['message'] =
//                   'You are not eligible to fill the compensation complaint.'
//               } else if (
//                 hourDiff <= 72 &&
//                 res[0].complaints_urban_rular == 2 &&
//                 showChildID == 348
//               ) {
//                 details['response'] = false
//                 details['message'] =
//                   'You are not eligible to fill the compensation complaint.'
//               } else if (
//                 current_date < second_date &&
//                 res[0].complaints_urban_rular == 1 &&
//                 showChildID == 350
//               ) {
//                 details['response'] = false
//                 details['message'] =
//                   'You are not eligible to fill the compensation complaint.'
//               } else {
//                 details['response'] = true
//                 details['sub'] = data.showChildID
//                 details['child'] = data.formData.child
//                 details['subchild'] = data.formData.subchild
//                 details['message'] = 'You are Eligible'
//                 details['code'] = 200
//                 details['diffdays'] = diffDays
//                 details['complaints_main_category'] =
//                   res[0].complaints_main_category
//                 details['created_date'] = res[0].complaints_created_date
//                 details['dc_id'] = res[0].complaints_dc
//                 details['division_id'] = res[0].complaints_division
//                 details['circle_id'] = res[0].complaints_circle
//                 details['region_id'] = res[0].complaints_region
//                 details['sub_division_id'] = res[0].complaints_sub_division
//                 details['urban_rural'] = res[0].complaints_urban_rular
//                 details['foc_center_id'] =
//                   res[0].complaints_assign_foc_center_id
//                 details['fgl_gang_id'] = res[0].complaints_assign_gang_id
//                 details['IVRSNumber'] = res[0].complaints_ivrs
//                 details['locationCode'] = res[0].complaints_consumer_loc_no
//                 details['groupNo'] = res[0].complaints_consumer_gr_no
//                 details['conn_mob'] = res[0].complaints_consumer_mobile
//                 details['org_cust_name'] = res[0].complaints_consumer_name
//                 details['complaints_district'] = res[0].complaints_district
//                 details['complaints_city'] = res[0].complaints_city
//                 details['complaints_area'] = res[0].complaints_area
//                 details['complaints_colony'] = res[0].complaints_colony
//                 details['complaints_block'] = res[0].complaints_block
//                 details['complaints_village'] = res[0].complaints_village
//                 let [je] = await conn.query(
//                   'select users_id from users where users_distributed_center_id = ? and users_type = 7 and users_status = 1',
//                   [res[0].complaints_dc]
//                 )
//                 if (je.length > 0) {
//                   details['je'] = je[0].users_id
//                 }
//                 let [ae] = await conn.query(
//                   'select users_id from users where users_division_id = ? and users_type = 6 and users_status = 1',
//                   [res[0].complaints_division]
//                 )
//                 if (ae.length > 0) {
//                   details['ae'] = ae[0].users_id
//                 }
//               }
//             } else {
//               details['message'] = 'This complaints is closed.'
//               details['response'] = false
//             }
//           } else {
//             details['message'] =
//               'You complaint does not come in this catagory .'
//             details['response'] = false
//           }
//         } else {
//           details['message'] =
//             'You are not eligible. Claim registration is allowed within 30 days from breach of service..'
//           details['response'] = false
//         }
//       } else {
//         details['message'] = 'You have Entered Worng Complaint-ID'
//         details['response'] = false
//       }
//       return details
//     } else {
//       const details = { response: true }
//       const no = data.searchId || ''
//       const showChildID = data.showChildID
//       if (!no) {
//         return setResponse(details, false, 'In-Valid Request')
//       }

//       if (!no.toLowerCase().startsWith('ez')) {
//         return setResponse(
//           details,
//           false,
//           'The number does not start with "EZ", Please enter a number starting with EZ'
//         )
//       }

//       const ezRecord = await fetchEzRecord(no)

//       if (!ezRecord) {
//         return setResponse(details, false, 'EZ number is not Found')
//       }

//       const { payment_date, service_date, days } = calculateDates(ezRecord)

//       if (!payment_date) {
//         return setResponse(
//           details,
//           false,
//           'You cannot proceed further because you have not paid any payment.'
//         )
//       }

//       if (days > 30) {
//         return setResponse(
//           details,
//           false,
//           'You are not eligible. Claim registration is allowed within 30 days from breach of service.'
//         )
//       }

//       const payee_status = 'payee'
//       if (payee_status !== 'payee') {
//         details.bill_not_pay =
//           'You cannot proceed further because you have not paid your electricity bill. Kindly pay your bill and then register your claim'
//       } else {
//         details.bill_not_pay = ''
//       }

//       const childvalue = getChildValue(data.formData.child)
//       if (!checkEligibility(showChildID, childvalue, days)) {
//         return setResponse(details, false, 'You are not Eligible')
//       }

//       await populateDetails(conn, details, ezRecord, data)

//       details.response = true
//       details.message = 'You are elegible'
//       return details
//     }
//   } finally {
//     if (conn) conn.release() //end to pool
//   }
// }

function setResponse(details, response, message) {
  details.response = response
  details.message = message
  return details
}

function calculateDates(ezRecord) {
  const current_date = new Date().toISOString().split('T')[0]
  const payment_date = ezRecord.payment_date || null
  let service_date = ezRecord.service_date || current_date
  const days = Math.ceil(
    Math.abs(new Date(service_date) - new Date(payment_date)) /
      (1000 * 60 * 60 * 24)
  )
  return { payment_date, service_date, days }
}

function getChildValue(childData) {
  let childvalue = ''
  for (const key in childData) {
    if (childData.hasOwnProperty(key)) {
      if ([332, 339, 372].includes(Number(key))) {
        childvalue = childData[key]
      }
    }
  }
  return childvalue
}

function checkEligibility(showChildID, childvalue, days) {
  if (
    (showChildID == 335 &&
      (childvalue == 332 || childvalue == 333) &&
      days <= 15) ||
    (showChildID == 335 && childvalue == 334 && days <= 10) ||
    ((showChildID == 343 || showChildID == 344 || showChildID == 345) &&
      days < 15)
  ) {
    return false
  }
  return true
}

async function fetchEzRecord(no) {
  const decode =
    '{"Head":{"Report Name":"LoadChange-Compensation","Total":1},"Body":{"Records":[{"ap_id":"EZ11202303004353","Registration_date":"2023-03-25","ap_type":"11","ap_status":"7","org_cust_name":"RAGHVENDRA PANDEY","conn_mob":"9878945656","circle":"1302000","division":"1534500","dc":"1534801","dc_name":"Badraon","division_name":"Rewa East","reasonforChange":"Inhasment ","IVRSNumber":"1488021650","newContractDemand":"20","OldContractDemand":"10","connectLoad_unit":"HP","connphase":"THREE","applied_phase":"THREE","billing_loc_code":"1534801","amount":"24351","payment_date":"2023-06-07T11:18:36","service_date":"2023-06-10 15:54:14","no_of_days":"3"}]}}'
  const decodedObject = JSON.parse(decode)
  const recordsArray = decodedObject.Body.Records

  return recordsArray.length > 0 ? recordsArray[0] : null
}

async function populateDetails(conn, details, ezRecord, data) {
  details.registration_date = ezRecord.Registration_date
  details.payment_date = ezRecord.payment_date
  details.service_date = ezRecord.service_date
  details.IVRSNumber = ezRecord.IVRSNumber
  details.amount = ezRecord.amountz
  details.ez_number = ezRecord.ap_id
  details.sub = data.showChildID
  details.child = data.formData.child
  details.org_cust_name = ezRecord.org_cust_name
  details.conn_mob = ezRecord.conn_mob

  const res = await queryDistributedCenter(conn, ezRecord.dc, ezRecord.division)
  if (res.length > 0) {
    await setLocationDetails(conn, details, res[0])
  } else {
    throw new Error('Distributed Center not found')
  }
}

async function queryDistributedCenter(conn, dc, division) {
  let [res] = await conn.query(
    'SELECT t1.*,t2.division_urban_rural,t3.foc_id,t4.fgl_gang_id from distributed_center t1 left join division t2 on (t1.distributed_center_division_id = t2.division_id) left join foc_masters t3 on (t1.distributed_center_id = t3.foc_dc_id) left join foc_gang_location_master t4 on (t4.fgl_foc_id = t3.foc_id) where t1.BILLING_LOC_CODE = ? group by t1.BILLING_LOC_CODE',
    [dc]
  )

  if (res.length === 0) {
    ;[res] = await conn.query(
      'SELECT t1.*,t2.division_urban_rural,t3.foc_id,t4.fgl_gang_id from distributed_center t1 left join division t2 on (t1.distributed_center_division_id = t2.division_id) left join foc_masters t3 on (t1.distributed_center_id = t3.foc_dc_id) left join foc_gang_location_master t4 on (t4.fgl_foc_id = t3.foc_id) where t2.mpez_division_cd = ? group by ',
      [division]
    )
  }
  return res
}

async function setLocationDetails(conn, details, res) {
  details.dc_id = res.distributed_center_id
  details.division_id = res.distributed_center_division_id
  details.circle_id = res.distributed_center_circle_id
  details.region_id = res.distributed_center_region_id
  details.sub_division_id = res.distributed_center_sub_division_id
  details.urban_rural = res.division_urban_rural == 0 ? 2 : 1

  const [res1] = await conn.query(
    'select loc_district_id,loc_city_id,loc_area_id,loc_colony_id,loc_block_id,loc_village_id from locations_master where loc_dc_id = ? group by loc_district_id',
    [res.distributed_center_id]
  )

  if (res1.length > 0) {
    setLocationSubDetails(conn, details, res1[0])
  }

  const [foc_id] = await conn.query(
    'select foc_id from foc_masters where foc_dc_id = ?',
    [res.distributed_center_id]
  )
  if (foc_id.length > 0) {
    details.foc_center_id = foc_id[0].foc_id
  }
}

async function setLocationSubDetails(conn, details, loc) {
  details.complaints_district = loc.loc_district_id || ''
  details.complaints_city = loc.loc_city_id || ''
  details.complaints_area = loc.loc_area_id || ''
  details.complaints_colony = loc.loc_colony_id || ''
  details.complaints_block = loc.loc_block_id || ''
  details.complaints_village = loc.loc_village_id || ''

  if (loc.loc_block_id && loc.loc_district_id) {
    const [gram] = await conn.query(
      'SELECT gram_panchayat_id FROM `gram_panchayat` WHERE gram_panchayat_block_id = ? and gram_panchayat_district_id = ?',
      [loc.loc_block_id, loc.loc_district_id]
    )
    if (gram.length > 0) {
      details.complaints_panchayat = gram[0].gram_panchayat_id
    }
  }
}
export const get_data_via_searchID_m1 = async (data) => {
  var check_ivrs_no = ''
  let conn
  try {
    conn = await pool.getConnection()
    console.log('data', data)
    let details = {}
    const showChildID = data.showChildID
    if (
      showChildID == 341 ||
      showChildID == 342 ||
      showChildID == 347 ||
      showChildID == 348 ||
      showChildID == 349 ||
      showChildID == 350
    ) {
      if (showChildID == 349) {
        var cond = ''
        if (check_ivrs_no != '') {
          cond += 'and t1.dtr_complain_ivrs = ' + check_ivrs_no
        }
        let res = await conn.query(
          'SELECT * from dtr_complaints t1 where t1.dtr_complain_id = ? ' +
            cond +
            '',
          [data.searchId]
        )
        if (res.length > 0) {
          // const axiosOptions = {
          //   method: 'post',
          //   url: 'http://115.124.119.195/cmhelpline/secure/mpez/consumerDetailsForCMHelpLineAPI.php',
          //   data: {
          //     username: 'usrmpez',
          //     pwd: 'dXNybXBlekAxMjM0NQ==',
          //     ivrs: res[0].complaints_ivrs,
          //   },
          // }

          // const response = await axios(axiosOptions)
          // const array = response.data
          // console.log('Result : ' + array)
          // let payee_status = array[0].payee_status
          let payee_status = 'payee'
          if (payee_status === 'payee') {
            if (
              res[0].dtr_complain_status == 10 ||
              res[0].dtr_complain_status == 11 ||
              res[0].dtr_complain_status == 6
            ) {
              details['response'] = false
              details['message'] = 'You Complaint is closed.'
            } else {
              var now = Date.now()
              var start = new Date(res[0].dtr_complain_date)
              var datediff = now - start.getTime()
              var diffdays = Math.round(datediff / (1000 * 60 * 60 * 24))

              var end = new Date()
              var daysDiff = Math.round((end - start) / (1000 * 60 * 60 * 24))

              var sundays =
                Math.floor(daysDiff / 7) +
                (start.getDay() + (daysDiff % 7) >= 7 ? 1 : 0)

              var time1 = new Date(res[0].dtr_complain_date).getTime()
              var time2 = new Date().getTime()
              var hourDiff = Math.round((time2 - time1) / (1000 * 60 * 60), 1)
              if (diffdays <= 30) {
                divi = '35,48,58,65,80,90,109,94,95,96,97,98'
                if (
                  (res[0].dtr_complain_division_id == 94 ||
                    res[0].dtr_complain_division_id == 95 ||
                    res[0].dtr_complain_division_id == 96 ||
                    res[0].dtr_complain_division_id == 97 ||
                    res[0].dtr_complain_division_id == 98) &&
                  hourDiff <= 12
                ) {
                  details['response'] = false
                  details['message'] =
                    'You are not eligible to fill the compensation complaint.'
                } else if (
                  (res[0].dtr_complain_division_id == 35 ||
                    res[0].dtr_complain_division_id == 48 ||
                    res[0].dtr_complain_division_id == 58 ||
                    res[0].dtr_complain_division_id == 65 ||
                    res[0].dtr_complain_division_id == 80 ||
                    res[0].dtr_complain_division_id == 90 ||
                    res[0].dtr_complain_division_id == 109) &&
                  hourDiff <= 24
                ) {
                  details['response'] = false
                  details['message'] =
                    'You are not eligible to fill the compensation complaint.'
                } else if (
                  divi.indexOf(res[0].dtr_complain_division_id) === -1 &&
                  hourDiff <= 72
                ) {
                  details['response'] = false
                  details['message'] =
                    'You are not eligible to fill the compensation complaint.'
                } else {
                  details['dtr_complain_consumer_id'] =
                    res[0].dtr_complain_consumer_id.toString()
                  details['org_cust_name'] = res[0].dtr_complain_consumer_name
                  details['conn_mob'] = res[0].dtr_complain_mobile
                  details['dtr_complain_alt_mobile'] =
                    res[0].dtr_complain_alt_mobile
                  details['dtr_complain_remarks'] = res[0].dtr_complain_remarks
                  details['dtr_complain_main_category'] =
                    res[0].dtr_complain_main_category
                  details['dtr_complain_category_sub'] =
                    res[0].dtr_complain_category_sub
                  details['urban_rural'] = res[0].dtr_complain_location_type
                  details['dtr_complain_region_id'] =
                    res[0].dtr_complain_region_id.toString()
                  details['dtr_complain_circle_id'] =
                    res[0].dtr_complain_circle_id.toString()
                  details['dtr_complain_division_id'] =
                    res[0].dtr_complain_division_id.toString()
                  details['dtr_complain_sub_division_id'] =
                    res[0].dtr_complain_sub_division_id.toString()
                  details['dtr_complain_dc_id'] =
                    res[0].dtr_complain_dc_id.toString()
                  details['IVRSNumber'] = res[0].dtr_complain_ivrs
                  details['dtr_complain_district'] =
                    res[0].dtr_complain_district.toString()
                  details['dtr_complain_city'] =
                    res[0].dtr_complain_city.toString()
                  details['dtr_complain_area'] =
                    res[0].dtr_complain_area.toString()
                  details['dtr_complaints_reminders'] =
                    res[0].dtr_complaints_reminders
                  details['dtr_complain_colony'] =
                    res[0].dtr_complain_colony.toString()
                  details['dtr_complain_block'] =
                    res[0].dtr_complain_block.toString()
                  details['dtr_complain_gram_panchyat'] =
                    res[0].dtr_complain_gram_panchyat.toString()
                  details['dtr_complain_village'] =
                    res[0].dtr_complain_village.toString()
                  details['dtr_complain_address'] = res[0].dtr_complain_address
                  details['dtr_complain_dtr_name'] =
                    res[0].dtr_complain_dtr_name
                  details['dtr_complain_dtr_location'] =
                    res[0].dtr_complain_dtr_location
                  details['dtr_complain_consumer_gr_no'] =
                    res[0].dtr_complain_consumer_gr_no
                  details['dtr_complain_consumer_loc_no'] =
                    res[0].dtr_complain_consumer_loc_no
                  details['dtr_complain_landmark'] =
                    res[0].dtr_complain_landmark
                  details['dtr_complain_addres'] = res[0].dtr_complain_addres
                  details['complaints_severity_level'] =
                    res[0].complaints_severity_level
                  details['complaints_came_from'] = res[0].complaints_came_from
                  details['created_date'] = res[0].dtr_complain_date
                  details['response'] = true
                  details['message'] = 'You are eligible'
                  details['sub'] = data.showChildID
                  details['child'] = data.formData.child
                }
              } else {
                details['message'] =
                  'You are not eligible. Claim registration is allowed within 30 days from breach of service..'
                details['response'] = false
                details['code'] = 200
              }
            }
          } else {
            details['message'] =
              'You can not proceed further because you have not paid your electricity bill . Kindly pay your bill and then register your claim.'
            details['response'] = false
            details['code'] = 200
          }
        } else {
          details['message'] =
            'You have enter worng Complaint-ID. Please enter correct Id.'
          details['response'] = false
          details['code'] = 200
        }
        return details
      } else {
        let res = await conn.query(
          'SELECT * FROM complaints WHERE complaints_id = ?',
          [data.searchId]
        )
        if (res.length > 0) {
          // const axiosOptions = {
          //   method: 'post',
          //   url: 'http://115.124.119.195/cmhelpline/secure/mpez/consumerDetailsForCMHelpLineAPI.php',
          //   data: {
          //     username: 'usrmpez',
          //     pwd: 'dXNybXBlekAxMjM0NQ==',
          //     ivrs: res[0].complaints_ivrs,
          //   },
          // }

          // const response = await axios(axiosOptions)
          // const array = response.data
          // console.log('Result : ' + array)
          // let payee_status = array[0].payee_status
          let payee_status = 'payee'
          if (payee_status === 'payee') {
            let res1 = await conn.query(
              'SELECT question_option_id , question_id from complaints_question t1 where t1.complaint_id =  ?',
              [data.searchId]
            )
            const now = new Date().getTime()
            const yourDate = new Date(res[0].complaints_created_date).getTime()
            const datediff = now - yourDate
            const diffDays = Math.round(datediff / (1000 * 60 * 60 * 24))
            const time1 = new Date(res[0].complaints_created_date)
            const time2 = new Date()
            const hourDiff = Math.round((time2 - time1) / (1000 * 60 * 60), 1)

            if (diffDays <= 30) {
              if (
                res[0].complaints_main_category == 16 &&
                (res[0].complaints_sub_category == 17 ||
                  res[0].complaints_sub_category == 18) &&
                showChildID == 341
              ) {
                if (
                  res[0].complaints_current_status != 4 &&
                  res[0].complaints_current_status != 6
                ) {
                  if (
                    res[0].complaints_urban_rular == 1 &&
                    datediff < 8 &&
                    showChildID == 341
                  ) {
                    details['response'] = false
                    details['message'] =
                      'You are not eligible to fill the compensation complaint.'
                    details['code'] = 200
                  } else if (
                    res[0].complaints_urban_rular == 2 &&
                    datediff < 10 &&
                    showChildID == 341
                  ) {
                    details['response'] = false
                    details['message'] =
                      'You are not eligible to fill the compensation complaint.'
                    details['code'] = 200
                  } else {
                    details['response'] = true
                    details['sub'] = data.showChildID
                    details['child'] = data.formData.child
                    details['subchild'] = data.formData.subchild
                    details['message'] = 'You are Eligible'
                    details['code'] = 200
                    details['diffdays'] = diffDays
                    details['complaints_main_category'] =
                      res[0].complaints_main_category
                    details['created_date'] = res[0].complaints_created_date
                    details['dc_id'] = res[0].complaints_dc
                    details['division_id'] = res[0].complaints_division
                    details['circle_id'] = res[0].complaints_circle
                    details['region_id'] = res[0].complaints_region
                    details['sub_division_id'] = res[0].complaints_sub_division
                    details['urban_rural'] = res[0].complaints_urban_rular
                    details['foc_center_id'] =
                      res[0].complaints_assign_foc_center_id
                    details['fgl_gang_id'] = res[0].complaints_assign_gang_id
                    details['IVRSNumber'] = res[0].complaints_ivrs
                    details['locationCode'] = res[0].complaints_consumer_loc_no
                    details['groupNo'] = res[0].complaints_consumer_gr_no
                    details['conn_mob'] = res[0].complaints_consumer_mobile
                    details['org_cust_name'] = res[0].complaints_consumer_name
                    details['complaints_district'] = res[0].complaints_district
                    details['complaints_city'] = res[0].complaints_city
                    details['complaints_area'] = res[0].complaints_area
                    details['complaints_colony'] = res[0].complaints_colony
                    details['complaints_block'] = res[0].complaints_block
                    details['complaints_village'] = res[0].complaints_village

                    let je = await conn.query(
                      'select users_id from users where users_distributed_center_id = ? and users_type = 7 and users_status = 1',
                      [res[0].complaints_dc]
                    )
                    if (je.length > 0) {
                      details['je'] = je[0].users_id.toString()
                    }
                    let ae = await conn.query(
                      'select users_id from users where users_division_id = ? and users_type = 6 and users_status = 1',
                      [res[0].complaints_division]
                    )
                    if (ae.length > 0) {
                      details['ae'] = ae[0].users_id.toString()
                    }
                  }
                } else {
                  details['message'] = 'This complaints is closed.'
                  details['response'] = false
                  details['code'] = 200
                }
              } else if (
                res[0].complaints_main_category == 12 &&
                showChildID == 342
              ) {
                if (
                  res[0].complaints_current_status != 4 &&
                  res[0].complaints_current_status != 6
                ) {
                  if (
                    res[0].complaints_urban_rular == 1 &&
                    diffDays < 5 &&
                    showChildID == 342
                  ) {
                    details['response'] = false
                    details['message'] =
                      'You are not eligible to fill the compensation complaint.'
                    details['code'] = 200
                  } else if (
                    res[0].complaints_urban_rular == 2 &&
                    diffDays < 10 &&
                    showChildID == 342
                  ) {
                    details['response'] = false
                    details['message'] =
                      'You are not eligible to fill the compensation complaint.'
                    details['code'] = 200
                  } else {
                    details['response'] = true
                    details['sub'] = data.showChildID
                    details['child'] = data.formData.child
                    details['subchild'] = data.formData.subchild
                    details['message'] = 'You are Eligible'
                    details['code'] = 200
                    details['diffdays'] = diffDays
                    details['complaints_main_category'] =
                      res[0].complaints_main_category
                    details['created_date'] = res[0].complaints_created_date
                    details['dc_id'] = res[0].complaints_dc
                    details['division_id'] = res[0].complaints_division
                    details['circle_id'] = res[0].complaints_circle
                    details['region_id'] = res[0].complaints_region
                    details['sub_division_id'] = res[0].complaints_sub_division
                    details['urban_rural'] = res[0].complaints_urban_rular
                    details['foc_center_id'] =
                      res[0].complaints_assign_foc_center_id
                    details['fgl_gang_id'] = res[0].complaints_assign_gang_id
                    details['IVRSNumber'] = res[0].complaints_ivrs
                    details['locationCode'] = res[0].complaints_consumer_loc_no
                    details['groupNo'] = res[0].complaints_consumer_gr_no
                    details['conn_mob'] = res[0].complaints_consumer_mobile
                    details['org_cust_name'] = res[0].complaints_consumer_name
                    details['complaints_district'] = res[0].complaints_district
                    details['complaints_city'] = res[0].complaints_city
                    details['complaints_area'] = res[0].complaints_area
                    details['complaints_colony'] = res[0].complaints_colony
                    details['complaints_block'] = res[0].complaints_block
                    details['complaints_village'] = res[0].complaints_village
                    let je = await conn.query(
                      'select users_id from users where users_distributed_center_id = ? and users_type = 7 and users_status = 1',
                      [res[0].complaints_dc]
                    )
                    if (je.length > 0) {
                      details['je'] = je[0].users_id.toString()
                    }
                    let ae = await conn.query(
                      'select users_id from users where users_division_id = ? and users_type = 6 and users_status = 1',
                      [res[0].complaints_division]
                    )
                    if (ae.length > 0) {
                      details['ae'] = ae[0].users_id.toString()
                    }
                  }
                } else {
                  details['message'] = 'This complaints is closed.'
                  details['response'] = false
                  details['code'] = 200
                }
              } else if (
                res[0].complaints_main_category == 17 &&
                (showChildID == 347 || showChildID == 348 || showChildID == 350)
              ) {
                if (
                  res[0].complaints_current_status != 4 &&
                  res[0].complaints_current_status != 6
                ) {
                  const start = new Date(res[0].complaints_created_date)
                  const end = new Date() // Current date and time
                  // Calculate the difference in days
                  const daysDiff = Math.floor(
                    (end - start) / (1000 * 60 * 60 * 24)
                  )
                  // Calculate the number of Sundays
                  const sundays =
                    Math.floor(daysDiff / 7) +
                    (start.getDay() + (daysDiff % 7) >= 7)
                  // Calculate the difference in hours
                  const hourDiff = Math.round(
                    (end - start) / (1000 * 60 * 60),
                    1
                  )
                  // Format the time
                  const time1 = start.toLocaleString('en-US', { hour12: false })
                  const time2 = end.toLocaleString('en-US', { hour12: false })
                  // Create DateTime object
                  const dateTime = new Date(res[0].complaints_created_date)
                  // Format time
                  const time = dateTime.toLocaleTimeString('en-US', {
                    hour12: false,
                  })
                  // Create upcomingDate and set time to 06:00:00
                  let upcomingDate = new Date(start)
                  upcomingDate.setHours(6, 0, 0)
                  // Check if upcomingDate is in the past, if so, increment the date by one day
                  if (upcomingDate < start) {
                    upcomingDate.setDate(upcomingDate.getDate() + 1)
                  }
                  // Format the first_date and second_date
                  const first_date = upcomingDate.toLocaleString('en-US', {
                    hour12: false,
                  })
                  upcomingDate.setHours(upcomingDate.getHours() + 12)
                  const second_date = upcomingDate.toLocaleString('en-US', {
                    hour12: false,
                  })
                  // Current date and time
                  const current_date = new Date().toLocaleString('en-US', {
                    hour12: false,
                  })
                  if (
                    res[0].complaints_urban_rular == 1 &&
                    hourDiff <= 4 &&
                    sundays == 0 &&
                    showChildID == 347
                  ) {
                    details['response'] = false
                    details['message'] =
                      'You are not eligible to fill the compensation complaint.'
                    details['code'] = 200
                  } else if (
                    res[0].complaints_urban_rular == 1 &&
                    hourDiff <= 5 &&
                    sundays > 0 &&
                    showChildID == 347
                  ) {
                    details['response'] = false
                    details['message'] =
                      'You are not eligible to fill the compensation complaint.'
                    details['code'] = 200
                  } else if (
                    res[0].complaints_urban_rular == 2 &&
                    hourDiff < 24 &&
                    showChildID == 347
                  ) {
                    details['response'] = false
                    details['message'] =
                      'You are not eligible to fill the compensation complaint.'
                    details['code'] = 200
                  } else if (hourDiff <= 12 && showChildID == 350) {
                    details['response'] = false
                    details['message'] =
                      'You are not eligible to fill the compensation complaint.'
                    details['code'] = 200
                  } else if (
                    hourDiff <= 72 &&
                    res[0].complaints_urban_rular == 2 &&
                    showChildID == 348
                  ) {
                    details['response'] = false
                    details['message'] =
                      'You are not eligible to fill the compensation complaint.'
                    details['code'] = 200
                  } else if (
                    current_date < second_date &&
                    res[0].complaints_urban_rular == 1 &&
                    showChildID == 350
                  ) {
                    details['response'] = false
                    details['message'] =
                      'You are not eligible to fill the compensation complaint.'
                    details['code'] = 200
                  } else {
                    details['response'] = true
                    details['sub'] = data.showChildID
                    details['child'] = data.formData.child
                    details['subchild'] = data.formData.subchild
                    details['message'] = 'You are Eligible'
                    details['code'] = 200
                    details['diffdays'] = diffDays
                    details['complaints_main_category'] =
                      res[0].complaints_main_category
                    details['created_date'] = res[0].complaints_created_date
                    details['dc_id'] = res[0].complaints_dc
                    details['division_id'] = res[0].complaints_division
                    details['circle_id'] = res[0].complaints_circle
                    details['region_id'] = res[0].complaints_region
                    details['sub_division_id'] = res[0].complaints_sub_division
                    details['urban_rural'] = res[0].complaints_urban_rular
                    details['foc_center_id'] =
                      res[0].complaints_assign_foc_center_id
                    details['fgl_gang_id'] = res[0].complaints_assign_gang_id
                    details['IVRSNumber'] = res[0].complaints_ivrs
                    details['locationCode'] = res[0].complaints_consumer_loc_no
                    details['groupNo'] = res[0].complaints_consumer_gr_no
                    details['conn_mob'] = res[0].complaints_consumer_mobile
                    details['org_cust_name'] = res[0].complaints_consumer_name
                    details['complaints_district'] = res[0].complaints_district
                    details['complaints_city'] = res[0].complaints_city
                    details['complaints_area'] = res[0].complaints_area
                    details['complaints_colony'] = res[0].complaints_colony
                    details['complaints_block'] = res[0].complaints_block
                    details['complaints_village'] = res[0].complaints_village
                    let je = await conn.query(
                      'select users_id from users where users_distributed_center_id = ? and users_type = 7 and users_status = 1',
                      [res[0].complaints_dc]
                    )
                    if (je.length > 0) {
                      details['je'] = je[0].users_id.toString()
                    }
                    let ae = await conn.query(
                      'select users_id from users where users_division_id = ? and users_type = 6 and users_status = 1',
                      [res[0].complaints_division]
                    )
                    if (ae.length > 0) {
                      details['ae'] = ae[0].users_id.toString()
                    }
                  }
                } else {
                  details['message'] = 'This complaints is closed.'
                  details['response'] = false
                  details['code'] = 200
                }
              } else {
                details['message'] =
                  'You complaint does not come in this catagory .'
                details['response'] = false
                details['code'] = 200
              }
            } else {
              details['message'] =
                'You are not eligible. Claim registration is allowed within 30 days from breach of service..'
              details['response'] = false
              details['code'] = 200
            }
          } else {
            details['message'] =
              'You can not proceed further because you have not paid your electricity bill . Kindly pay your bill and then register your claim'
            details['response'] = false
            details['code'] = 200
          }
        } else {
          details['message'] = 'You have Entered Worng Complaint-ID'
          details['response'] = false
          details['code'] = 200
        }
        return details
      }
    } else {
      var no = data.searchId
      const showChildID = data.showChildID
      details['response'] = true
      if (no == '') {
        details['message'] = 'In-Valid Request'
        details['response'] = false
        details['code'] = 200
      } else {
        const prefixToCheck = 'ez'
        const lowercasedNumber = no.toLowerCase()
        const lowercasedPrefix = prefixToCheck.toLowerCase()
        // Check if the lowercasedNumber starts with lowercasedPrefix
        const startsWithEZ = lowercasedNumber.startsWith(lowercasedPrefix)
        if (startsWithEZ) {
          // var url = "http://www.smartbijlee.mpez.co.in/services/mpez_services/getCompensationApiFormat.php?ap_id="+no+"&SC=11";
          // curl_setopt($ch,CURLOPT_URL, $url);
          // curl_setopt($ch, CURLOPT_RETURNTRANSFER,true);
          // $result = curl_exec($ch);
          // $decode = json_decode($result , true);
          var decode =
            '{"Head":{"Report Name":"LoadChange-Compensation","Total":1},"Body":{"Records":[{"ap_id":"EZ11202303004353","Registration_date":"2023-03-25","ap_type":"11","ap_status":"7","org_cust_name":"RAGHVENDRA PANDEY","conn_mob":"9878945656","circle":"1302000","division":"1534500","dc":"1534801","dc_name":"Badraon","division_name":"Rewa East","reasonforChange":"Inhasment ","IVRSNumber":"1488021650","newContractDemand":"20","OldContractDemand":"10","connectLoad_unit":"HP","connphase":"THREE","applied_phase":"THREE","billing_loc_code":"1534801","amount":"24351","payment_date":"2023-06-07T11:18:36","service_date":"2023-06-10 15:54:14","no_of_days":"3"}]}}'
          var decodedObject = JSON.parse(decode)
          // Access the "Records" array
          var recordsArray = decodedObject.Body.Records
          var ezRecord = recordsArray[0]
          if (recordsArray.length > 0) {
            let ivrs = ezRecord.IVRSNumber
            // curl_setopt_array($curl, array(
            // CURLOPT_URL => 'http://115.124.119.195/cmhelpline/secure/mpez/consumerDetailsForCMHelpLineAPI.php',
            // CURLOPT_RETURNTRANSFER => true,
            // CURLOPT_ENCODING => '',
            // CURLOPT_MAXREDIRS => 10,
            // CURLOPT_TIMEOUT => 0,
            // CURLOPT_FOLLOWLOCATION => true,
            // CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            // CURLOPT_CUSTOMREQUEST => 'POST',
            // CURLOPT_POSTFIELDS => array('username'=>'usrmpez','pwd'=>'dXNybXBlekAxMjM0NQ==','ivrs'=>$ivrs),
            // ));
            // $response = curl_exec($curl);
            // curl_close($curl);
            // $array = json_decode($response);
            // $payee_status = (array)$array->payee_status;
            let payee_status = 'payee'
            if (payee_status == 'payee') {
              var current_date = new Date().toISOString().split('T')[0] // Get current date in "YYYY-MM-DD" format
              var start = new Date(ezRecord.payment_date)
              var end = new Date(current_date)
              var registration = new Date(ezRecord.Registration_date)
              var tenday = Math.ceil(
                Math.abs(end - registration) / (1000 * 60 * 60 * 24)
              )
              var thirtydays = Math.ceil(
                Math.abs(end - start) / (1000 * 60 * 60 * 24)
              )
              if (
                ezRecord.service_date == null ||
                ezRecord.service_date == ''
              ) {
                var current_date = new Date().toISOString().split('T')[0] // Get current date in "YYYY-MM-DD" format
                var start = new Date(ezRecord.payment_date)
                var end = new Date(current_date)
                var days = Math.ceil(
                  Math.abs(end - start) / (1000 * 60 * 60 * 24)
                )
              } else {
                var current_date = new Date().toISOString().split('T')[0] // Get current date in "YYYY-MM-DD" format
                var start = new Date(ezRecord.payment_date)
                var end = new Date(ezRecord.service_date)
                var days = Math.ceil(
                  Math.abs(end - start) / (1000 * 60 * 60 * 24)
                )
              }

              var current_date = new Date().toISOString() // Get current date and time in ISO format
              var time1 = new Date(start)
              var time2 = new Date(current_date)
              var hourdiff =
                Math.round(((time2 - time1) / (1000 * 60 * 60)) * 10) / 10
              var child = Object.keys(data.formData.child).length
              if (child > 0) {
                for (const key in data.formData.child) {
                  if (
                    Object.prototype.hasOwnProperty.call(
                      data.formData.child,
                      key
                    )
                  ) {
                    var childvalue = ''
                    if (key == 332 || key == 334) {
                      var childvalue = data.formData.child[key]
                    }
                  }
                }
              }
              if (data.showChildID == 335 && childvalue == 332 && days <= 15) {
                details['message'] = 'Your are not Eligible'
                details['response'] = false
                details['code'] = 200
              } else if (
                data.showChildID == 335 &&
                childvalue == 333 &&
                days <= 15
              ) {
                details['message'] = 'Your are not Eligible'
                details['response'] = false
                details['code'] = 200
              } else if (
                data.showChildID == 335 &&
                childvalue == 334 &&
                tenday <= 10
              ) {
                details['message'] = 'Your are not Eligible'
                details['response'] = false
                details['code'] = 200
              }

              if (
                (childvalue == '339' || childvalue == 339) &&
                (details['urban_rural'] == 2 ||
                  details['urban_rural'] == '2') &&
                hourdiff < 6
              ) {
                details['response'] = false
                details['message'] = 'Your are not Eligible'
                details['code'] = 200
              }
              if (
                (childvalue != '334' ||
                  childvalue != '338' ||
                  childvalue != '339') &&
                days < 15
              ) {
                details['response'] = false
                details['message'] = 'You are not eligible.'
                details['code'] = 200
              }
              if (data.showChildID != '' && (days > 30 || days > '30')) {
                details['response'] = false
                details['message'] =
                  'You are not eligible. Claim registration is allowed within 30 days from breach of service.'
                details['code'] = 200
              }
              if (days > 30 || days > '30') {
                details['response'] = false
                details['message'] =
                  'You are not eligible. Claim registration is allowed within 30 days from breach of service.'
                details['code'] = 200
              }
              if (
                (childvalue == '338' || childvalue == 338) &&
                (details['urban_rural'] == 1 ||
                  details['urban_rural'] == '1') &&
                hourdiff < 4
              ) {
                details['response'] = false
                details['message'] = 'Your are not Eligible'
                details['code'] = 200
              }
              //details['response'] = true
              if (details['response'] == true) {
                details['registration_date'] = ezRecord.Registration_date
                details['payment_date'] = ezRecord.payment_date
                details['service_date'] = ezRecord.service_date
                details['IVRSNumber'] = ivrs
                details['amount'] = ezRecord.amount
                details['ez_number'] = ezRecord.ap_id
                details['sub'] = data.showChildID
                details['child'] = data.formData.child
                details['response'] = true
                details['org_cust_name'] = ezRecord.org_cust_name

                details['conn_mob'] = ezRecord.conn_mob

                var res = await conn.query(
                  'SELECT t1.*,t2.division_urban_rural,t3.foc_id,t4.fgl_gang_id from distributed_center t1 left join division t2 on (t1.distributed_center_division_id = t2.division_id) left join foc_masters t3 on (t1.distributed_center_id = t3.foc_dc_id) left join foc_gang_location_master t4 on (t4.fgl_foc_id = t3.foc_id) where t1.BILLING_LOC_CODE = ?',
                  [ezRecord.dc]
                )
                if (res.length == 0) {
                  res = await conn.query(
                    'SELECT t1.*,t2.division_urban_rural,t3.foc_id,t4.fgl_gang_id from distributed_center t1 left join division t2 on (t1.distributed_center_division_id = t2.division_id) left join foc_masters t3 on (t1.distributed_center_id = t3.foc_dc_id) left join foc_gang_location_master t4 on (t4.fgl_foc_id = t3.foc_id) where t2.mpez_division_cd = ?',
                    [ezRecord.division]
                  )
                }

                if (res.length > 0) {
                  details['dc_id'] = res[0].distributed_center_id.toString()
                  details['division_id'] =
                    res[0].distributed_center_division_id.toString()
                  details['circle_id'] =
                    res[0].distributed_center_circle_id.toString()
                  details['region_id'] =
                    res[0].distributed_center_region_id.toString()
                  details['sub_division_id'] =
                    res[0].distributed_center_sub_division_id.toString()
                  if (res[0].division_urban_rural == 0) {
                    details['urban_rural'] = 2
                  } else {
                    details['urban_rural'] = 1
                  }

                  var je = await conn.query(
                    'select users_id from users where users_distributed_center_id = ? and users_type = 7 and users_status = 1',
                    [res[0].distributed_center_id]
                  )

                  details['locationCode'] = ''
                  details['groupNo'] = ''
                  var ae = await conn.query(
                    'select users_id from users where users_division_id = ? and users_type = 6 and users_status = 1',
                    [res[0].distributed_center_division_id]
                  )
                  var res1 = await conn.query(
                    'select loc_district_id,loc_city_id,loc_area_id,loc_colony_id,loc_block_id,loc_village_id from locations_master where loc_dc_id = ? group by loc_district_id',
                    [res[0].distributed_center_id]
                  )
                  // console.log(res1)
                  if (res1.length > 0) {
                    if (res1[0].loc_district_id != null) {
                      details['complaints_district'] = res1[0].loc_district_id
                    }
                    if (res1[0].loc_city_id != null) {
                      details['complaints_city'] = res1[0].loc_city_id
                    }
                    if (res1[0].loc_area_id != null) {
                      details['complaints_area'] = res1[0].loc_area_id
                    }
                    if (res1[0].loc_colony_id != null) {
                      details['complaints_colony'] = res1[0].loc_colony_id
                    }
                    if (res1[0].loc_block_id != null) {
                      details['complaints_block'] = res1[0].loc_block_id
                    }

                    if (
                      (res1[0].loc_block_id != 0 ||
                        res1[0].loc_block_id != '') &&
                      (res1[0].loc_district_id != 0 ||
                        res1[0].loc_district_id != '')
                    ) {
                      var gram = await conn.query(
                        'SELECT gram_panchayat_id FROM `gram_panchayat` WHERE gram_panchayat_block_id = ? and gram_panchayat_district_id = ?',
                        [res1[0].loc_block_id, res1[0].loc_district_id]
                      )
                      if (gram.length > 0) {
                        details['complaints_panchayat'] =
                          gram[0].gram_panchayat_id.toString()
                      }
                    }
                    details['complaints_village'] =
                      res1[0].loc_village_id.toString()
                  }
                }
                details['diffdays'] = days
                details['complaints_main_category'] = 23
                var foc_id = await conn.query(
                  'select foc_id from foc_masters where foc_dc_id = ?',
                  [res[0].distributed_center_id]
                )
                if (foc_id.length > 0) {
                  details['foc_center_id'] = foc_id[0].foc_id
                }
              }
            } else {
              details['response'] = false
              details['message'] =
                'You can not proceed further because you have not paid your electricity bill . Kindly pay your bill and then register your claim'
              details['code'] = 200
            }
          } else {
            details['response'] = false
            details['message'] = 'EZ number is not Found'
            details['code'] = 200
          }
        } else {
          details['response'] = false
          details['message'] =
            'The number does not start with "EZ" , Please enter number starting with EZ'
          details['code'] = 200
        }
      }
    }
    return details
  } finally {
    if (conn) conn.end() //end to pool
  }
}
export const get_dc_details_m = async (id) => {
  let conn

  try {
    conn = await pool.getConnection()

    const query = `
      SELECT distributed_center_name, distributed_center_id 
      FROM distributed_center 
      WHERE distributed_center_sub_division_id = ?
    `

    const [res1] = await conn.query(query, [id])

    return { res1 }
  } catch (err) {
    console.error('Error executing query in get_dc_details_m:', err.message)
    throw new ErrorHandler('Database query failed', 500) // Use ErrorHandler for consistent error formatting
  } finally {
    if (conn) conn.release() // Release connection back to the pool
  }
}
export const get_division_details_m = async (id) => {
  let conn

  try {
    conn = await pool.getConnection()

    const query = `
      SELECT division_name, division_id 
      FROM division 
      WHERE division_circle_id = ?
    `

    const [res1] = await conn.query(query, [id])

    return { res1 }
  } catch (err) {
    console.error(
      'Error executing query in get_division_details_m:',
      err.message
    )
    throw new ErrorHandler('Database query failed', 500) // Use ErrorHandler for consistent error formatting
  } finally {
    if (conn) conn.release() // Release connection back to the pool
  }
}
export const get_fetchAreaNameData_m = async (id) => {
  let conn

  try {
    conn = await pool.getConnection()
    const res1 = await conn.query(
      'SELECT area_name, area_id FROM area WHERE area_city_id = ?',
      [id]
    )

    return { res1 }
  } catch (error) {
    throw new ErrorHandler(error.message, 500)
  } finally {
    if (conn) conn.end()
  }
}
export const get_fetchColonyNameData_m = async (id) => {
  let conn

  try {
    conn = await pool.getConnection()
    const res1 = await conn.query(
      'SELECT colony_name, colony_id FROM colony WHERE colony_area_id = ?',
      [id]
    )

    // Commented code removed for simplicity
    // var foc_list = await conn.query(...);
    // var gang_list = await conn.query(...);

    return { res1 }
  } catch (err) {
    throw new ErrorHandler(500, err.message) // Use ErrorHandler class
  } finally {
    if (conn) conn.end() // End connection to pool
  }
}
export const get_fetchfeederNameData_m = async (id) => {
  let conn

  try {
    conn = await pool.getConnection()
    const res = await conn.query(
      'SELECT feeder_11_id, feeder_11_name FROM feeder_11 WHERE feeder_11_sub_station_id = ?',
      [id]
    )
    return { res }
  } catch (error) {
    console.error('Error in get_fetchfeederNameData_m:', error.message)
    throw new ErrorHandler('Database query failed', 500) // Use ErrorHandler to throw a formatted error
  } finally {
    if (conn) conn.end() // Ensure the connection is always closed
  }
}
export const get_fetchvillageNameData_m = async (data) => {
  let conn

  try {
    conn = await pool.getConnection()
    const res = await conn.query(
      'SELECT village_name, village_id FROM village WHERE village_gram_panchayat_id = ?',
      [data.id]
    )

    // Uncomment and modify the following code if additional queries are needed
    /*
    if (res && res.length > 0) {
      const gang_location_list = await conn.query(
        'SELECT locations_master.loc_dc_id, foc_gang_location_master.fgl_gang_id, locations_master.loc_sub_division_id, foc_masters.foc_id, locations_master.loc_region_id, locations_master.loc_circle_id, locations_master.loc_division_id FROM locations_master LEFT JOIN foc_gang_location_master ON foc_gang_location_master.fgl_location_id = loc_id LEFT JOIN foc_masters ON foc_masters.foc_id = foc_gang_location_master.fgl_foc_id WHERE loc_gp_id = ? AND loc_block_id = ? LIMIT 1',
        [data.id, data.block_id]
      );

      let gang_list = null;
      if (gang_location_list && gang_location_list.length > 0) {
        gang_list = await conn.query(
          'SELECT gang_id FROM gang LEFT JOIN gang_lineman ON gang.gang_id = lineman_gang_id WHERE gang.gang_id = ?',
          [gang_location_list[0].fgl_gang_id]
        );
      }

      return { res, gang_location_list, gang_list };
    }
    */

    return { res }
  } catch (error) {
    throw new ErrorHandler(error.message, 500)
  } finally {
    if (conn) conn.end() // Ensure the connection is always closed
  }
}
export const get_foc_details_m = async (id) => {
  let conn

  try {
    conn = await pool.getConnection()

    const query = `
      SELECT * 
      FROM foc_masters 
      WHERE foc_dc_id = ?
    `

    const [res1] = await conn.query(query, [id])

    return { res1 }
  } catch (err) {
    console.error('Error executing query in get_foc_details_m:', err.message)
    throw new ErrorHandler('Database query failed', 500) // Use ErrorHandler for consistent error formatting
  } finally {
    if (conn) conn.release() // Release connection back to the pool
  }
}
export const get_GramPanchayatData_m = async (id) => {
  let conn

  try {
    conn = await pool.getConnection()
    const res = await conn.query(
      'SELECT gram_panchayat_name, gram_panchayat_id FROM gram_panchayat WHERE gram_panchayat_block_id = ?',
      [id]
    )

    return { res }
  } catch (error) {
    throw new ErrorHandler(error.message, 500)
  } finally {
    if (conn) conn.end() // Ensure the connection is always closed
  }
}
export const get_location_by_complaints_id_m = async (id) => {
  let conn

  try {
    conn = await pool.getConnection()

    // Query to get complaint details
    let [res] = await conn.query(
      'SELECT complaints_consumer_gr_no, complaints_consumer_loc_no, complaints_region, complaints_circle, complaints_division, complaints_sub_division, complaints_dc, complaints_main_category, complaints_sub_category, complaints_urban_rular FROM complaints WHERE complaints_id = ?',
      [id]
    )

    if (res && res.length > 0) {
      // Query to get region names if complaints exist
      var [res1] = await conn.query('SELECT region_name, region_id FROM region')
    }

    return { res, res1 }
  } catch (err) {
    console.error(
      'Error fetching data in get_location_by_complaints_id_m:',
      err.message
    )
    throw new ErrorHandler('Database query failed', 500) // Use ErrorHandler for consistent error formatting
  } finally {
    if (conn) conn.release() // Release connection back to the pool
  }
}
export const get_location_by_dtr_complaints_id_m = async (id) => {
  let conn
  let res
  let res1

  try {
    conn = await pool.getConnection()

    // Query to get complaint details
    res = await conn.query(
      'SELECT dtr_complain_region_id, dtr_complain_circle_id, dtr_complain_division_id, dtr_complain_sub_division_id, dtr_complain_dc_id, dtr_complain_category_sub, dtr_complain_main_category, dtr_complain_location_type FROM dtr_complaints WHERE dtr_complain_id = ?',
      [id]
    )

    if (res && res.length > 0) {
      // Query to get region names if complaints exist
      res1 = await conn.query('SELECT region_name, region_id FROM region')
    }

    return { res, res1 }
  } catch (err) {
    console.error(
      'Error fetching data in get_location_by_dtr_complaints_id_m:',
      err.message
    )
    throw new ErrorHandler('Database query failed', 500) // Use ErrorHandler for consistent error formatting
  } finally {
    if (conn) conn.release() // Release connection back to the pool
  }
}
export const get_region_m = async () => {
  let conn

  try {
    conn = await pool.getConnection()
    const [res] = await conn.query('SELECT region_id, region_name FROM region')
    return res
  } catch (error) {
    throw new ErrorHandler(error.message, 500)
  } finally {
    if (conn) conn.end() // Ensure the connection is always closed
  }
}

export const get_sub_division_details_m = async (id) => {
  let conn

  try {
    conn = await pool.getConnection()

    const query = `
      SELECT sub_division_name, sub_division_id 
      FROM sub_division 
      WHERE sub_division_division_id = ?
    `

    const [res1] = await conn.query(query, [id])

    return { res1 }
  } catch (err) {
    console.error(
      'Error executing query in get_sub_division_details_m:',
      err.message
    )
    throw new ErrorHandler('Database query failed', 500) // Use ErrorHandler for consistent error formatting
  } finally {
    if (conn) conn.release() // Release connection back to the pool
  }
}
export const get_SubstationNameData_m = async (id) => {
  let conn

  try {
    conn = await pool.getConnection()
    const res = await conn.query(
      'SELECT sub_station_id, sub_station_name FROM sub_station WHERE sub_station_division_id = ?',
      [id]
    )
    return res
  } catch (error) {
    throw new ErrorHandler(error.message, 500)
  } finally {
    if (conn) conn.end() // Ensure the connection is always closed
  }
}
export const getAgentAttendedComplaint_m = async () => {
  let conn

  try {
    conn = await pool.getConnection()

    const query = `
      SELECT 
        t2.ameyo_id AS id,
        t2.ameyo_session_id,
        t2.ameyo_campain_id,
        t2.ameyo_session_date,
        t2.ameyo_ameyo_id,
        CONCAT(t3.users_first_name, ' ', t3.users_last_name) AS full_name
      FROM ameyo_closer t2
      INNER JOIN users t3 ON t2.ameyo_ameyo_id = t3.users_name
    `

    const [res] = await conn.query(query)
    return { res }
  } catch (err) {
    console.error(
      'Error executing query in getAgentAttendedComplaint_m:',
      err.message
    )
    throw new ErrorHandler('Database query failed', 500) // Use ErrorHandler for consistent error formatting
  } finally {
    if (conn) conn.release() // Release connection back to the pool
  }
}
export const getAgents_m = async () => {
  let conn

  try {
    conn = await pool.getConnection()

    // Use a parameterized query if parameters are added in the future
    const query = `
      SELECT 
        users_id AS id, 
        users_name, 
        CONCAT(users_first_name, ' ', users_last_name) AS full_name,
        users_created_time,
        CASE 
          WHEN users_status = 1 THEN 'Active'
          WHEN users_status = 2 THEN 'Blocked'
          ELSE 'Unknown'
        END AS users_status1,
        users_status
      FROM users
      WHERE users_type = 1
      ORDER BY users_id DESC
    `

    const [res] = await conn.query(query)
    return { res }
  } catch (err) {
    console.error('Error executing query in getAgents_m:', err.message)
    throw new ErrorHandler('Database query failed', 500) // Use ErrorHandler for consistent error formatting
  } finally {
    if (conn) conn.release() // Release connection back to the pool
  }
}
export const getCategory_m = async () => {
  let conn
  try {
    conn = await pool.getConnection()

    // Query to get users_foc_center_id
    const res1 = await conn.query(
      'SELECT users_foc_center_id FROM `users` WHERE users_id = ?',
      [37892] // Use parameterized query to prevent SQL injection
    )

    if (res1 && res1.length > 0) {
      const users_foc_center_id = res1[0].users_foc_center_id

      // Query to get gang information based on foc_center_id
      const result = await conn.query(
        'SELECT gang.gang_name, gang.gang_id FROM `foc_masters` INNER JOIN gang ON gang.gang_foc_id = foc_masters.foc_id WHERE foc_masters.foc_id IN (?)',
        [users_foc_center_id] // Use parameterized query
      )

      return result
    }

    return [] // Return empty array if no data found
  } catch (err) {
    console.error('Error fetching category data:', err.message)
    throw new ErrorHandler('Database query failed', 500) // Use ErrorHandler for consistent error formatting
  } finally {
    if (conn) conn.release() // Release connection back to the pool
  }
}
export const getCopComplaints_m = async () => {
  let conn
  try {
    conn = await pool.getConnection()

    const res = await conn.query(
      `
        SELECT complaints.complaints_id as id, complaints.complaints_consumer_id, complaints_consumer_name, complaints_consumer_mobile, complaints_called_mobile, complaints_ivrs,
          CASE
            WHEN complaints.wrong_dc = 1 AND complaints.complaints_current_status = 1 THEN 'Wrong Dc Open'
            WHEN complaints.wrong_dc = 1 AND complaints.complaints_current_status = 3 THEN 'Wrong Dc Attended'
            WHEN complaints.wrong_dc = 1 AND complaints.complaints_current_status = 4 THEN 'Wrong Dc Close' 
            WHEN complaints.wrong_dc = 0 AND complaints.complaints_current_status = 1 THEN 'Open'
            WHEN complaints.wrong_dc = 0 AND complaints.complaints_current_status = 3 THEN 'Attended'
            WHEN complaints.wrong_dc = 2 AND complaints.complaints_current_status = 1 THEN 'Open'
            WHEN complaints.complaints_current_status = 4 THEN 'Close'
            ELSE 'Forced Close'
          END AS complaints_status,
          CASE 
            WHEN complaints.complaints_urban_rular = 1 THEN 'Urban'
            WHEN complaints.complaints_urban_rular = 2 THEN 'Rural'
            ELSE ''
          END AS location_type,
          category_main.category_main_name, 
          category_sub.category_sub_name, 
          region.region_name, 
          circle.circle_name, 
          division.division_name, 
          sub_division.sub_division_name, 
          distributed_center.distributed_center_name,
          complaints.complaints_current_status
        FROM complaints
        LEFT JOIN category_main ON category_main.category_main_id = complaints.complaints_main_category
        LEFT JOIN category_sub ON category_sub.category_sub_id = complaints.complaints_sub_category
        LEFT JOIN region ON region.region_id = complaints.complaints_region
        LEFT JOIN circle ON circle.circle_id = complaints.complaints_circle
        LEFT JOIN division ON division.division_id = complaints.complaints_division
        LEFT JOIN sub_division ON sub_division.sub_division_id = complaints.complaints_sub_division
        LEFT JOIN distributed_center ON distributed_center.distributed_center_id = complaints.complaints_dc
        WHERE complaints.complaints_main_category IN (12, 23) AND complaints.complaints_sub_category IN (1, 2, 5, 54, 55, 89, 50)
        ORDER BY complaints.complaints_id DESC
      `
    )

    return res
  } catch (err) {
    throw new ErrorHandler(500, err.message) // Use ErrorHandler class
  } finally {
    if (conn) conn.release() // End connection to pool
  }
}
export const getCountsofComplaints_m = async () => {
  let conn
  try {
    conn = await pool.getConnection()

    // Execute query and fetch results
    const [rows] = await conn.query(
      'SELECT users_foc_center_id FROM `users` WHERE users_id = ?',
      [37892]
    )
    return rows
  } catch (err) {
    console.error('Database operation failed:', err)
    throw new Error('Database operation failed') // Rethrow to be caught in the controller
  } finally {
    if (conn) conn.release() // Release connection back to pool
  }
}
export const getdailybriefing_m = async () => {
  let conn

  try {
    conn = await pool.getConnection()
    const [res] = await conn.query(
      'SELECT t1.*, t2.users_first_name FROM quality_feedback t1 INNER JOIN users t2 ON (t1.created_by = t2.users_id) WHERE t1.status != 2 ORDER BY t1.created_date DESC'
    )
    return { res }
  } catch (error) {
    throw new ErrorHandler(error.message, 500)
  } finally {
    if (conn) conn.end() // Ensure the connection is always closed
  }
}
export const getDataChildtosubChild_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    console.log('data', data)
    const [questions] = await conn.query(
      'SELECT q_id, q_title_hindi, q_type FROM questions_master WHERE q_parent_ques = ? AND q_applied_option = ? AND q_status = 0 ORDER BY q_order',
      [data.q_parent_ques, data.q_applied_option]
    )

    if (questions.length === 0) {
      return { questions: null, options: null }
    }

    const [questionIdsData] = await conn.query(
      'SELECT GROUP_CONCAT(q_id) AS question_ids FROM questions_master WHERE q_parent_ques = ? AND q_applied_option = ? AND q_status = 0 ORDER BY q_order',
      [data.q_parent_ques, data.q_applied_option]
    )

    if (!questionIdsData || !questionIdsData[0].question_ids) {
      return { questions, options: null }
    }

    const [options] = await conn.query(
      `SELECT * FROM options_master WHERE opt_question IN (${questionIdsData[0].question_ids})`
    )

    if (options.length === 0) {
      return { questions, options: null }
    }

    return { questions, options }
  } catch (err) {
    console.error('Error in getDataChildtosubChild_m:', err)
    throw new ErrorHandler('Database query failed', 500)
  } finally {
    if (conn) conn.release() // End the connection back to the pool
  }
}

export const getdtrcomplaintsbyID_m = async (id) => {
  let conn
  try {
    conn = await pool.getConnection()
    const users_id = 37892

    const [res1] = await conn.query(
      'SELECT users_region_id,users_circle_id,users_division_id,users_sub_division_id FROM `users` WHERE users_id= ?',
      [users_id]
    )

    let res2, res3, res4

    if (res1 && res1.length > 0) {
      ;[res2] = await conn.query(
        `SELECT region.region_name,circle.circle_name,division.division_name,sub_division.sub_division_name,
        distributed_center.distributed_center_name,dtr_complain_location_type,district.district_name,city_name,
        area.area_name,colony.colony_name,block.block_name,gram_panchayat.gram_panchayat_name,village.village_name,
        category_main.category_main_name,category_sub.category_sub_name,
        CASE WHEN dtr_complaints.dtr_complain_status = 1 THEN "Open" 
             WHEN dtr_complaints.dtr_complain_status = 3 THEN "Attended" 
             WHEN dtr_complaints.dtr_complain_status = 4 THEN "Close" 
             ELSE "Forced Close" END AS complain_status,
        dtr_complaints.dtr_complain_dtr_location,
        CASE WHEN dtr_complaints.dtr_complain_location_type = 1 THEN "Urban" ELSE "Rural" END AS location_type,
        dtr_complaints.dtr_complain_consumer_name,dtr_complaints.dtr_complain_mobile,dtr_complaints.dtr_complain_date,
        dtr_complaints.dtr_complain_remarks,dtr_complaints.dtr_complain_status,dtr_complaints.dtr_complain_id,
        dtr_complaints.dtr_complain_ivrs
        FROM dtr_complaints
        INNER JOIN region ON region.region_id=dtr_complaints.dtr_complain_region_id
        INNER JOIN circle ON circle.circle_id=dtr_complaints.dtr_complain_circle_id
        INNER JOIN division ON division.division_id=dtr_complaints.dtr_complain_division_id
        INNER JOIN sub_division ON sub_division.sub_division_id=dtr_complaints.dtr_complain_sub_division_id
        INNER JOIN distributed_center ON distributed_center.distributed_center_id=dtr_complaints.dtr_complain_dc_id
        LEFT JOIN category_main ON category_main.category_main_id=dtr_complaints.dtr_complain_main_category
        LEFT JOIN category_sub ON category_sub.category_sub_id=dtr_complaints.dtr_complain_category_sub
        INNER JOIN district ON district.district_id=dtr_complaints.dtr_complain_district
        LEFT JOIN city ON city.city_id=dtr_complaints.dtr_complain_city
        LEFT JOIN area ON area.area_id=dtr_complaints.dtr_complain_area
        LEFT JOIN colony ON colony.colony_id=dtr_complaints.dtr_complain_colony
        LEFT JOIN block ON block.block_id=dtr_complaints.dtr_complain_block
        LEFT JOIN gram_panchayat ON gram_panchayat.gram_panchayat_id=dtr_complaints.dtr_complain_gram_panchyat
        LEFT JOIN village ON village.village_id=dtr_complaints.dtr_complain_village
        WHERE dtr_complaints.dtr_complain_id = ?`,
        [id]
      )
      ;[res3] = await conn.query(
        `SELECT questions_master.q_title_hindi, questions_master.q_type, dtr_complaints_question.question_option_id,
        options_master.opt_title,
        CASE WHEN questions_master.q_type = "Dropdown" THEN options_master.opt_title
             WHEN questions_master.q_type = "Numeric" THEN options_master.opt_title
             WHEN questions_master.q_type = "Datetime" THEN dtr_complaints_question.question_option_id
             ELSE dtr_complaints_question.question_option_id END AS question_status
        FROM dtr_complaints_question
        INNER JOIN questions_master ON questions_master.q_id = dtr_complaints_question.question_id
        LEFT JOIN options_master ON options_master.opt_id = dtr_complaints_question.question_option_id
        WHERE complaint_id = ?
        ORDER BY questions_master.q_order ASC`,
        [id]
      )
      ;[res4] = await conn.query(
        `SELECT dtr_complaints_history.*, dtr_complaints_history.complaints_history_id as id,
        users.users_type, users.users_first_name, users.users_last_name, users.users_name
        FROM dtr_complaints_history
        LEFT JOIN users ON users.users_id = complaints_history_users_id
        WHERE complaints_history_complaint_id = ?
        ORDER BY complaints_history_id DESC`,
        [id]
      )
    }

    return { res1, res2, res3, res4 }
  } catch (error) {
    throw new ErrorHandler('Database query failed', 500)
  } finally {
    if (conn) conn.release()
  }
}
export const getFeederList_m = async () => {
  let conn

  try {
    conn = await pool.getConnection()

    const query = `
      SELECT 
      complaints_id as id,
        COUNT(c.complaints_id) AS total,
        r.region_name,
        cr.circle_name,
        d.division_name,
        sd.sub_division_name,
        dc.distributed_center_name,
        con.consumer_fidder_id
      FROM complaints AS c
      JOIN consumer AS con ON con.consumer_id = c.complaints_consumer_id
      JOIN distributed_center AS dc ON dc.distributed_center_id = c.complaints_dc
      JOIN sub_division AS sd ON sd.sub_division_id = c.complaints_sub_division
      JOIN division AS d ON d.division_id = c.complaints_division
      JOIN circle AS cr ON cr.circle_id = c.complaints_circle
      JOIN region AS r ON r.region_id = c.complaints_region
      WHERE c.complaints_main_category = 17
        AND c.complaints_sub_category = 21
        AND c.complaints_current_status = 1
        AND c.complaints_created_date >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
        AND c.complaints_consumer_id != 0
      GROUP BY con.consumer_fidder_id
      HAVING total > 1
      ORDER BY total DESC
    `

    const [res] = await conn.query(query)
    return { res }
  } catch (err) {
    console.error('Error executing query in getFeederList_m:', err.message)
    throw new ErrorHandler('Database query failed', 500) // Use ErrorHandler for consistent error formatting
  } finally {
    if (conn) conn.release() // Release connection back to the pool
  }
}
export const getSettingsDetails_m = async () => {
  let conn
  try {
    conn = await pool.getConnection()

    const [res] = await conn.query(
      "SELECT * FROM settings WHERE id LIKE '1' OR mpez_up_down LIKE '1' OR status LIKE '1' ORDER BY `id`"
    )

    const [survey_cnt] = await conn.query(
      "SELECT lt_feedback_id, COUNT(CASE WHEN lt_feedback_complaints_id != 0 THEN lt_feedback_id END) AS q_count FROM lt_consumer_feedback WHERE lt_feedback_id != '' AND DATE(lt_feedback_created_date) = CURRENT_DATE() GROUP BY DATE(lt_feedback_created_date)"
    )

    // Uncomment and adjust queries as needed
    // const survey_cnt_consumer = await conn.query(
    //   "SELECT lt_feedback_id, COUNT(CASE WHEN lt_feedback_consumer_id != 0 THEN lt_feedback_id END) AS q_count FROM lt_consumer_feedback WHERE lt_feedback_id != '' AND DATE(lt_feedback_created_date) = CURRENT_DATE() AND lt_feedback_consumer_id != 0 GROUP BY DATE(lt_feedback_created_date)"
    // );

    // const survey_cnt_non_ivrs = await conn.query(
    //   "SELECT lt_feedback_id, COUNT(CASE WHEN lt_feedback_non_ivrs_calling = 1 THEN lt_feedback_id END) AS q_count FROM lt_consumer_feedback WHERE lt_feedback_id != '' AND DATE(lt_feedback_created_date) = CURRENT_DATE() AND lt_feedback_non_ivrs_calling != '' GROUP BY DATE(lt_feedback_created_date)"
    // );

    // const ivrs_count = await conn.query(
    //   "SELECT COUNT(id) AS id FROM non_ivrs_calling WHERE id != '' AND DATE(updated_date) = CURRENT_DATE() AND ivrs != 0 GROUP BY DATE(updated_date)"
    // );

    const [bill_information_count] = await conn.query(
      "SELECT survey_id, COUNT(survey_id) AS bill_count FROM bill_information_survey WHERE survey_id != '' AND DATE(created_date) = CURRENT_DATE() GROUP BY DATE(created_date)"
    )

    return {
      res,
      survey_cnt,
      // survey_cnt_consumer,
      // survey_cnt_non_ivrs,
      // ivrs_count,
      bill_information_count,
    }
  } catch (err) {
    throw new ErrorHandler(500, err.message) // Use ErrorHandler class
  } finally {
    if (conn) conn.release() // End connection to pool
  }
}
export const getShutDownDetails_m = async () => {
  let conn
  try {
    conn = await pool.getConnection()

    const [res] = await conn.query(
      `SELECT 
        pre_shut_down.pre_shut_down_id AS id, 
        circle.circle_name, 
        division.division_name,
        pre_shut_down.pre_shut_down_start_time,
        pre_shut_down.pre_shut_down_end_time,
        CONCAT(users.users_first_name, ' ', users.users_last_name) AS officer,
        sub_station.sub_station_name,
        feeder_11.feeder_11_name 
      FROM pre_shut_down 
      LEFT JOIN circle ON circle.circle_id = pre_shut_down.pre_shut_down_circle 
      LEFT JOIN division ON division.division_id = pre_shut_down.pre_shut_down_division 
      LEFT JOIN sub_station ON sub_station.sub_station_id = pre_shut_down.pre_shut_down_substation 
      LEFT JOIN feeder_11 ON feeder_11.feeder_11_id = pre_shut_down.pre_shut_down_feeder 
      LEFT JOIN users ON users.users_id = pre_shut_down.pre_shut_down_created_by`
    )

    return res
  } catch (err) {
    console.error('Error executing getShutDownDetails_m:', err.message)
    throw new ErrorHandler(
      'Failed to retrieve ShutDown details from database',
      500
    )
  } finally {
    if (conn) conn.release() // Release connection back to the pool
  }
}
export const getSocialAnalytics_m = async (p_type) => {
  let conn

  try {
    conn = await pool.getConnection()
    const public_report = await conn.query(
      "SELECT p_id as id, DATE(p_date) as pdate, count(CASE when p_services=1 then p_id end) as complaint_status, count(CASE when p_services=2 then p_id end) as complaint_register, count(CASE when p_services=3 and p_option=0 then p_id end) as bill_view, count(CASE when p_services=3 and p_option=1 then p_id end) as bill_download FROM `public_report` WHERE p_id!='' and p_type= ? GROUP BY DATE(p_date) ORDER BY DATE(p_date) DESC",
      [p_type]
    )
    const whatsapp = await conn.query(
      "SELECT p_id as id, DATE(p_date) as pdate, count(CASE when p_services=1 then p_id end) as complaint_status, count(CASE when p_services=2 then p_id end) as complaint_register, count(CASE when p_services=3 and p_option=0 then p_id end) as bill_view, count(CASE when p_services=3 and p_option=1 then p_id end) as bill_download FROM `public_report` WHERE p_id!='' and p_type=1 GROUP BY DATE(p_date) ORDER BY DATE(p_date) DESC"
    )
    const website = await conn.query(
      "SELECT p_id as id, DATE(p_date) as pdate, count(CASE when p_services=1 then p_id end) as complaint_status, count(CASE when p_services=2 then p_id end) as complaint_register, count(CASE when p_services=3 and p_option=0 then p_id end) as bill_view, count(CASE when p_services=3 and p_option=1 then p_id end) as bill_download FROM `public_report` WHERE p_id!='' and p_type=2 GROUP BY DATE(p_date) ORDER BY DATE(p_date) DESC"
    )
    const facebook = await conn.query(
      "SELECT p_id as id, DATE(p_date) as pdate, count(CASE when p_services=1 then p_id end) as complaint_status, count(CASE when p_services=2 then p_id end) as complaint_register, count(CASE when p_services=3 and p_option=0 then p_id end) as bill_view, count(CASE when p_services=3 and p_option=1 then p_id end) as bill_download FROM `public_report` WHERE p_id!='' and p_type=3 GROUP BY DATE(p_date) ORDER BY DATE(p_date) DESC"
    )
    const twitter = await conn.query(
      "SELECT p_id as id, DATE(p_date) as pdate, count(CASE when p_services=1 then p_id end) as complaint_status, count(CASE when p_services=2 then p_id end) as complaint_register, count(CASE when p_services=3 and p_option=0 then p_id end) as bill_view, count(CASE when p_services=3 and p_option=1 then p_id end) as bill_download FROM `public_report` WHERE p_id!='' and p_type=4 GROUP BY DATE(p_date) ORDER BY DATE(p_date) DESC"
    )
    const total = await conn.query(
      "SELECT p_id as id, count(p_id) as total_cnt, count(CASE when p_type=1 then p_id end) as whatsapp_cnt, count(CASE when p_type=2 then p_id end) as website_cnt, count(CASE when p_type=3 then p_id end) as facebook, count(CASE when p_type=4 then p_id end) as twitter FROM `public_report` WHERE p_id!='' and p_type!=5"
    )

    return { whatsapp, website, facebook, twitter, total }
  } catch (error) {
    throw new ErrorHandler(error.message, 500)
  } finally {
    if (conn) conn.release() // Ensure the connection is always closed
  }
}

export const getSup_dtr_Complaints_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    let cond = ''
    if (data.startdate !== 'Invalid date' && data.enddate !== 'Invalid date') {
      cond = `AND date(dtr_complaints.dtr_complain_date) >= '${data.startdate}' AND date(dtr_complaints.dtr_complain_date) <= '${data.enddate}' `
    }

    const [res] = await conn.query(
      `
        SELECT dtr_complaints.dtr_complain_id AS id, 
               dtr_complaints.dtr_complain_consumer_name,
               dtr_complaints.dtr_complain_date,
               dtr_complaints.dtr_complain_mobile,
               dtr_complaints.dtr_complain_ivrs,
               CASE 
                 WHEN dtr_complaints.dtr_complain_location_type = 1 THEN 'Urban'
                 WHEN dtr_complaints.dtr_complain_location_type = 2 THEN 'Rural'
                 ELSE ''
               END AS location_type,
               CASE
                 WHEN dtr_complaints.wrong_dc = 1 AND dtr_complaints.dtr_complain_status = 1 THEN 'Wrong Dc Open'
                 WHEN dtr_complaints.wrong_dc = 1 AND dtr_complaints.dtr_complain_status = 2 THEN 'Wrong Dc Attended'
                 WHEN dtr_complaints.wrong_dc = 1 AND dtr_complaints.dtr_complain_status = 5 THEN 'Wrong Dc Wrong Complain' 
                 WHEN dtr_complaints.wrong_dc = 1 AND dtr_complaints.dtr_complain_status = 10 THEN 'Wrong Dc Close' 
                 WHEN dtr_complaints.wrong_dc = 0 AND dtr_complaints.dtr_complain_status = 1 THEN 'Open'
                 WHEN dtr_complaints.wrong_dc = 0 AND dtr_complaints.dtr_complain_status = 2 THEN 'Attended'
                 WHEN dtr_complaints.wrong_dc = 0 AND dtr_complaints.dtr_complain_status = 5 THEN 'Open'
                 WHEN dtr_complaints.wrong_dc = 0 AND dtr_complaints.dtr_complain_status = 10 THEN 'Close'
                 WHEN dtr_complaints.dtr_complain_status = 4 THEN 'Close'
                 ELSE 'NA'
               END AS dtr_complaints_status,
               category_main.category_main_name, 
               category_sub.category_sub_name, 
               region.region_name, 
               circle.circle_name, 
               division.division_name, 
               sub_division.sub_division_name, 
               distributed_center.distributed_center_name,
               CONCAT(users.users_first_name, ' ', users.users_last_name, '[', users.users_mobile, ']') AS user_details
        FROM dtr_complaints
        LEFT JOIN category_main ON category_main.category_main_id = dtr_complaints.dtr_complain_main_category
        LEFT JOIN category_sub ON category_sub.category_sub_id = dtr_complaints.dtr_complain_category_sub
        LEFT JOIN region ON region.region_id = dtr_complaints.dtr_complain_region_id
        LEFT JOIN circle ON circle.circle_id = dtr_complaints.dtr_complain_circle_id
        LEFT JOIN division ON division.division_id = dtr_complaints.dtr_complain_division_id
        LEFT JOIN sub_division ON sub_division.sub_division_id = dtr_complaints.dtr_complain_sub_division_id
        LEFT JOIN distributed_center ON distributed_center.distributed_center_id = dtr_complaints.dtr_complain_dc_id 
        LEFT JOIN users ON users.users_id = dtr_complaints.dtr_complain_assign_officer_id
        WHERE dtr_complaints.dtr_complain_status NOT IN (3,4,6,11) ${cond}
        ORDER BY dtr_complaints.dtr_complain_id
      `
    )

    return res
  } catch (err) {
    throw new ErrorHandler(500, err.message) // Use ErrorHandler class
  } finally {
    if (conn) conn.release() // End connection to pool
  }
}
// export const getSupComplaints_m = async (data) => {
//   let conn
//   try {
//     conn = await pool.getConnection()

//     let cond = ''
//     if (data.startdate !== 'Invalid date' && data.enddate !== 'Invalid date') {
//       cond = `WHERE date(complaints.complaints_created_date) >= '${data.startdate}' AND date(complaints.complaints_created_date) <= '${data.enddate}' `
//     }

//     const [rows] = await conn.query(
//       `
//       SELECT complaints.complaints_id as id, complaints.complaints_consumer_id, complaints.complaints_created_date, complaints_consumer_name, complaints_consumer_mobile, complaints_called_mobile, complaints_ivrs,
//         CASE
//           WHEN complaints.wrong_dc = 1 AND complaints.complaints_current_status = 1 THEN 'Wrong Dc Open'
//           WHEN complaints.wrong_dc = 1 AND complaints.complaints_current_status = 3 THEN 'Wrong Dc Attended'
//           WHEN complaints.wrong_dc = 1 AND complaints.complaints_current_status = 4 THEN 'Wrong Dc Close'
//           WHEN complaints.wrong_dc = 0 AND complaints.complaints_current_status = 1 THEN 'Open'
//           WHEN complaints.wrong_dc = 0 AND complaints.complaints_current_status = 3 THEN 'Attended'
//           WHEN complaints.wrong_dc = 2 AND complaints.complaints_current_status = 1 THEN 'Open'
//           WHEN complaints.complaints_current_status = 4 THEN 'Close'
//           ELSE 'Forced Close'
//         END AS complaints_status,
//         CASE
//           WHEN complaints.complaints_urban_rular = 1 THEN 'Urban'
//           WHEN complaints.complaints_urban_rular = 2 THEN 'Rural'
//           ELSE ''
//         END AS location_type,
//         category_main.category_main_name,
//         category_sub.category_sub_name,
//         region.region_name,
//         circle.circle_name,
//         division.division_name,
//         sub_division.sub_division_name,
//         distributed_center.distributed_center_name
//       FROM complaints
//       LEFT JOIN category_main ON category_main.category_main_id = complaints.complaints_main_category
//       LEFT JOIN category_sub ON category_sub.category_sub_id = complaints.complaints_sub_category
//       LEFT JOIN region ON region.region_id = complaints.complaints_region
//       LEFT JOIN circle ON circle.circle_id = complaints.complaints_circle
//       LEFT JOIN division ON division.division_id = complaints.complaints_division
//       LEFT JOIN sub_division ON sub_division.sub_division_id = complaints.complaints_sub_division
//       LEFT JOIN distributed_center ON distributed_center.distributed_center_id = complaints.complaints_dc ${cond}
//       ORDER BY complaints.complaints_id DESC limit 100000
//       `
//     )

//     // Ensure result is an array
//     if (!Array.isArray(rows)) {
//       throw new Error('Unexpected result format from the database query')
//     }

//     return rows
//   } catch (err) {
//     throw new ErrorHandler(err.message, 500) // Use ErrorHandler class
//   } finally {
//     if (conn) conn.release() // Release connection back to the pool
//   }
// }

export const getSupComplaints_m = async () => {
  let conn
  try {
    conn = await pool.getConnection()

    const [list] = await conn.query(
      `SELECT complaints_lt_ht_type,complaints_region,complaints_circle,complaints_created_by,complaints_number,
      complaints_called_mobile,complaints_consumer_mobile,complaints_ivrs,complaints_consumer_name,
      complaints_main_category,complaints_current_status,wrong_dc,complaints_number,complaints_came_from,
      complaints_division,complaints_sub_division,complaints_dc,complaint_type,complaints_last_updated_date,
      complaints_sub_category,complaints_assign_gang_id,complaints_assign_officer_id,complaints_created_date,
      complaints_assign_officer_id_level1,complaints_id
       FROM complaints WHERE complaints.complaints_id != '' ORDER BY complaints.complaints_id DESC LIMIT 100`
    )

    const data = []
    let no = 0

    for (const v_list of list) {
      no++

      let cons_type = ''
      if (v_list.complaints_lt_ht_type == 2) {
        cons_type = 'LT HV'
      }

      let region_name = v_list.complaints_region
        ? await getValue(conn, 'region_name', 'region', {
            region_id: v_list.complaints_region,
          })
        : 'N/A'

      let circle_name = v_list.complaints_circle
        ? await getValue(conn, 'circle_name', 'circle', {
            circle_id: v_list.complaints_circle,
          })
        : 'N/A'

      let division_name = v_list.complaints_division
        ? await getValue(conn, 'division_name', 'division', {
            division_id: v_list.complaints_division,
          })
        : 'N/A'

      let sub_division_name = v_list.complaints_sub_division
        ? await getValue(conn, 'sub_division_name', 'sub_division', {
            sub_division_id: v_list.complaints_sub_division,
          })
        : 'N/A'

      let distributed_center_name = v_list.complaints_dc
        ? await getValue(
            conn,
            'distributed_center_name',
            'distributed_center',
            {
              distributed_center_id: v_list.complaints_dc,
            }
          )
        : 'N/A'

      let agent = ''
      if (v_list.complaints_created_by === 0) {
        agent = 'Self'
      } else {
        const agent_info = await getAgentName(
          conn,
          v_list.complaints_created_by
        )
        if (agent_info) {
          agent = `${agent_info.users_first_name} ${agent_info.users_last_name} [${agent_info.users_name}]`
        } else {
          agent = 'N/A'
        }
      }

      const cate_name = await getValue(
        conn,
        'category_main_name',
        'category_main',
        {
          category_main_id: v_list.complaints_main_category,
        }
      )
      const cate_sub_name = await getValue(
        conn,
        'category_sub_name',
        'category_sub',
        { category_sub_id: v_list.complaints_sub_category }
      )
      let gang = ''
      if (v_list.complaints_assign_gang_id === 0) {
        gang = 'N/A'
      } else {
        const gang_name = await getGangName(
          conn,
          v_list.complaints_assign_gang_id
        )
        if (gang_name) {
          gang = `${gang_name.gang_name} [${gang_name.gang_number}]`
        } else {
          gang = ''
        }
      }

      let officer = ''
      if (v_list.complaints_assign_officer_id === 0) {
        officer = 'N/A'
      } else {
        const officer_name = await getOfficerName(
          conn,
          v_list.complaints_assign_officer_id
        )
        if (officer_name) {
          const designation = getDesignation(conn, officer_name.users_type)
          officer = `(${designation}) ${officer_name.users_first_name} ${officer_name.users_last_name}${officer_name.users_mobile}]`
        } else {
          officer = 'Not Assigned'
        }
      }
      let officer1 = ''
      if (v_list.complaints_assign_officer_id_level1 === 0) {
        officer1 = ''
      } else {
        const officer_name = await getOfficerName(
          conn,
          v_list.complaints_assign_officer_id_level1
        )
        if (officer_name) {
          const designation = getDesignation(conn, officer_name.users_type)
          officer1 = `(${designation}) ${officer_name.users_first_name} ${officer_name.users_last_name}[${officer_name.users_mobile}]`
        } else {
          officer1 = 'Not Assigned'
        }
      }

      let wdc = ''
      if (v_list.wrong_dc == 1) {
        wdc = 'Wrong Dc /'
      }

      switch (v_list.complaints_current_status) {
        case 1:
          wdc = `${wdc}Open`

          break
        case 2:
          wdc = `${wdc}Attended`

          break
        case 3:
          wdc = `${wdc}Attended`

          break
        case 4:
          wdc = `${wdc}Closed`

          break
        case 5:
          wdc = `${wdc}Reopen`
          break
        case 6:
          wdc = `${wdc}Force Closed`
          break
        default:
          wdc = ''
      }
      const reminder_count = await getReminderCount(conn, v_list.complaints_id)

      const total_call_not_pick_officer = await getNum(
        conn,
        'complaints_history',
        {
          complaints_history_complaint_id: v_list.complaints_id,
          complaints_history_status: 9,
        }
      )
      const total_call_not_connect_officer = await getNum(
        conn,
        'complaints_history',
        {
          complaints_history_complaint_id: v_list.complaints_id,
          complaints_history_status: 12,
        }
      )
      const total_call_not_pick_consumer = await getNum(
        conn,
        'complaints_history',
        {
          complaints_history_complaint_id: v_list.complaints_id,
          complaints_history_status: 10,
        }
      )
      const total_call_not_connect_consumer = await getNum(
        conn,
        'complaints_history',
        {
          complaints_history_complaint_id: v_list.complaints_id,
          complaints_history_status: 11,
        }
      )
      const total_call_for_status = await getNum(conn, 'complaints_history', {
        complaints_history_complaint_id: v_list.complaints_id,
        complaints_history_status: 17,
      })
      let rm_count, complaints_history_created_date
      if (reminder_count.reminder_count !== 0) {
        const last_reminder_time = await getLastReminder(
          conn,
          v_list.complaints_id
        )
        rm_count = reminder_count.reminder_count
        complaints_history_created_date =
          last_reminder_time.complaints_history_created_date
      } else {
        rm_count = 0
        complaints_history_created_date = 'N/A'
      }
      let complaint_type = ''
      switch (v_list.complaint_type) {
        case 1:
          complaint_type = 'General'
          break
        case 2:
          complaint_type = 'FTR'
          break
        default:
          complaint_type = 'Hold'
      }

      const row = {
        id: v_list.complaints_id,
        complaints_number: v_list.complaints_number,
        division_name: division_name,
        region_name: region_name,
        circle_name: circle_name,
        sub_division_name: sub_division_name,
        distributed_center_name: distributed_center_name,
        complaints_consumer_name: v_list.complaints_consumer_name,
        complaints_ivrs: v_list.complaints_ivrs,
        complaints_consumer_mobile: v_list.complaints_consumer_mobile,
        complaints_called_mobile: v_list.complaints_called_mobile,
        officer: officer,
        cate_name: cate_name,
        cate_sub_name: cate_sub_name,
        agent: agent,
        gang: gang,
        officer1: officer1,
        complaints_created_date: v_list.complaints_created_date,
        complaints_last_updated_date: v_list.complaints_last_updated_date,
        wdc: wdc,
        rm_count: rm_count,
        // total_call_not_pick_officer: total_call_not_pick_officer,
        // total_call_not_connect_officer: total_call_not_connect_officer,
        // total_call_not_connect_consumer: total_call_not_connect_consumer,
        // total_call_for_status: 0,
        // total_call_not_pick_consumer: 0,
        // total_call_for_status: total_call_for_status,
        //total_call_not_pick_consumer: total_call_not_pick_consumer,
        complaints_history_created_date: complaints_history_created_date,
        complaint_type: complaint_type,
        complaints_came_from: v_list.complaints_came_from,
        complaints_current_status: v_list.complaints_current_status,
      }

      data.push(row)
    }

    return data
  } catch (error) {
    throw new ErrorHandler(error.message, 500)
  } finally {
    if (conn) conn.release()
  }
}

export const getSupComplaints_m1 = async (fetchData) => {
  let conn
  try {
    conn = await pool.getConnection()
    let cond = ''
    if (
      fetchData.startdate !== 'Invalid date' &&
      fetchData.enddate !== 'Invalid date'
    ) {
      cond = `And date(complaints.complaints_created_date) >= '${fetchData.startdate}' AND date(complaints.complaints_created_date) <= '${fetchData.enddate}' `
    }
    const query = `
      SELECT complaints_lt_ht_type, complaints_region, complaints_circle, complaints_created_by, 
      complaints_number, complaints_called_mobile, complaints_consumer_mobile, complaints_ivrs,
      complaints_consumer_name, complaints_main_category, complaints_current_status, wrong_dc, 
      complaints_number, complaints_came_from, complaints_division, complaints_sub_division, 
      complaints_dc, complaint_type, complaints_last_updated_date, complaints_sub_category, 
      complaints_assign_gang_id, complaints_assign_officer_id, complaints_created_date, 
      complaints_assign_officer_id_level1, complaints_id
      FROM complaints 
      WHERE complaints.complaints_id != '' ${cond} 
      ORDER BY complaints.complaints_id DESC 
      LIMIT ${fetchData.limit} OFFSET ${fetchData.offset}`
    const [list] = await conn.query(query)
    const [totalCountResult] = await conn.query(`
        SELECT COUNT(*) as totalComplaints
        FROM complaints 
        WHERE complaints.complaints_id != '' ${cond}`)

    const totalComplaints = totalCountResult[0].totalComplaints

    const data = []
    let no = 0

    for (const v_list of list) {
      no++

      let cons_type = ''
      if (v_list.complaints_lt_ht_type == 2) {
        cons_type = 'LT HV'
      }

      let region_name = v_list.complaints_region
        ? await getValue(conn, 'region_name', 'region', {
            region_id: v_list.complaints_region,
          })
        : 'N/A'

      let circle_name = v_list.complaints_circle
        ? await getValue(conn, 'circle_name', 'circle', {
            circle_id: v_list.complaints_circle,
          })
        : 'N/A'

      let division_name = v_list.complaints_division
        ? await getValue(conn, 'division_name', 'division', {
            division_id: v_list.complaints_division,
          })
        : 'N/A'

      let sub_division_name = v_list.complaints_sub_division
        ? await getValue(conn, 'sub_division_name', 'sub_division', {
            sub_division_id: v_list.complaints_sub_division,
          })
        : 'N/A'

      let distributed_center_name = v_list.complaints_dc
        ? await getValue(
            conn,
            'distributed_center_name',
            'distributed_center',
            {
              distributed_center_id: v_list.complaints_dc,
            }
          )
        : 'N/A'

      let agent = ''
      if (v_list.complaints_created_by === 0) {
        agent = 'Self'
      } else {
        const agent_info = await getAgentName(
          conn,
          v_list.complaints_created_by
        )
        if (agent_info) {
          agent = `${agent_info.users_first_name} ${agent_info.users_last_name} [${agent_info.users_name}]`
        } else {
          agent = 'N/A'
        }
      }

      const cate_name = await getValue(
        conn,
        'category_main_name',
        'category_main',
        {
          category_main_id: v_list.complaints_main_category,
        }
      )
      const cate_sub_name = await getValue(
        conn,
        'category_sub_name',
        'category_sub',
        { category_sub_id: v_list.complaints_sub_category }
      )
      let gang = ''
      if (v_list.complaints_assign_gang_id === 0) {
        gang = 'N/A'
      } else {
        const gang_name = await getGangName(
          conn,
          v_list.complaints_assign_gang_id
        )
        if (gang_name) {
          gang = `${gang_name.gang_name} [${gang_name.gang_number}]`
        } else {
          gang = ''
        }
      }

      let officer = ''
      if (v_list.complaints_assign_officer_id === 0) {
        officer = 'N/A'
      } else {
        const officer_name = await getOfficerName(
          conn,
          v_list.complaints_assign_officer_id
        )
        if (officer_name) {
          const designation = getDesignation(conn, officer_name.users_type)
          officer = `(${designation}) ${officer_name.users_first_name} ${officer_name.users_last_name}${officer_name.users_mobile}]`
        } else {
          officer = 'Not Assigned'
        }
      }
      let officer1 = ''
      if (v_list.complaints_assign_officer_id_level1 === 0) {
        officer1 = ''
      } else {
        const officer_name = await getOfficerName(
          conn,
          v_list.complaints_assign_officer_id_level1
        )
        if (officer_name) {
          const designation = getDesignation(conn, officer_name.users_type)
          officer1 = `(${designation}) ${officer_name.users_first_name} ${officer_name.users_last_name}[${officer_name.users_mobile}]`
        } else {
          officer1 = 'Not Assigned'
        }
      }

      let wdc = ''
      if (v_list.wrong_dc == 1) {
        wdc = 'Wrong Dc /'
      }

      switch (v_list.complaints_current_status) {
        case 1:
          wdc = `${wdc}Open`

          break
        case 2:
          wdc = `${wdc}Attended`

          break
        case 3:
          wdc = `${wdc}Attended`

          break
        case 4:
          wdc = `${wdc}Closed`

          break
        case 5:
          wdc = `${wdc}Reopen`
          break
        case 6:
          wdc = `${wdc}Force Closed`
          break
        default:
          wdc = ''
      }
      const reminder_count = await getReminderCount(conn, v_list.complaints_id)

      const total_call_not_pick_officer = await getNum(
        conn,
        'complaints_history',
        {
          complaints_history_complaint_id: v_list.complaints_id,
          complaints_history_status: 9,
        }
      )
      const total_call_not_connect_officer = await getNum(
        conn,
        'complaints_history',
        {
          complaints_history_complaint_id: v_list.complaints_id,
          complaints_history_status: 12,
        }
      )
      const total_call_not_pick_consumer = await getNum(
        conn,
        'complaints_history',
        {
          complaints_history_complaint_id: v_list.complaints_id,
          complaints_history_status: 10,
        }
      )
      const total_call_not_connect_consumer = await getNum(
        conn,
        'complaints_history',
        {
          complaints_history_complaint_id: v_list.complaints_id,
          complaints_history_status: 11,
        }
      )
      const total_call_for_status = await getNum(conn, 'complaints_history', {
        complaints_history_complaint_id: v_list.complaints_id,
        complaints_history_status: 17,
      })
      let rm_count, complaints_history_created_date
      if (reminder_count.reminder_count !== 0) {
        const last_reminder_time = await getLastReminder(
          conn,
          v_list.complaints_id
        )
        rm_count = reminder_count.reminder_count
        complaints_history_created_date =
          last_reminder_time.complaints_history_created_date
      } else {
        rm_count = 0
        complaints_history_created_date = 'N/A'
      }
      let complaint_type = ''
      switch (v_list.complaint_type) {
        case 1:
          complaint_type = 'General'
          break
        case 2:
          complaint_type = 'FTR'
          break
        default:
          complaint_type = 'Hold'
      }

      const row = {
        id: v_list.complaints_id,
        complaints_number: v_list.complaints_number,
        division_name: division_name,
        region_name: region_name,
        circle_name: circle_name,
        sub_division_name: sub_division_name,
        distributed_center_name: distributed_center_name,
        complaints_consumer_name: v_list.complaints_consumer_name,
        complaints_ivrs: v_list.complaints_ivrs,
        complaints_consumer_mobile: v_list.complaints_consumer_mobile,
        complaints_called_mobile: v_list.complaints_called_mobile,
        officer: officer,
        cate_name: cate_name,
        cate_sub_name: cate_sub_name,
        agent: agent,
        gang: gang,
        officer1: officer1,
        complaints_created_date: v_list.complaints_created_date,
        complaints_last_updated_date: v_list.complaints_last_updated_date,
        wdc: wdc,
        rm_count: rm_count,
        // total_call_not_pick_officer: total_call_not_pick_officer,
        // total_call_not_connect_officer: total_call_not_connect_officer,
        // total_call_not_connect_consumer: total_call_not_connect_consumer,
        // total_call_for_status: 0,
        // total_call_not_pick_consumer: 0,
        // total_call_for_status: total_call_for_status,
        //total_call_not_pick_consumer: total_call_not_pick_consumer,
        complaints_history_created_date: complaints_history_created_date,
        complaint_type: complaint_type,
        complaints_came_from: v_list.complaints_came_from,
        complaints_current_status: v_list.complaints_current_status,
      }

      data.push(row)
    }
    return { data, totalComplaints }
  } catch (error) {
    throw new ErrorHandler(error.message, 500)
  } finally {
    if (conn) conn.release()
  }
}

export const getSUPcomplaintsbyID_m = async (id) => {
  let conn

  try {
    conn = await pool.getConnection()

    const res1 = await conn.query(
      `SELECT complaints.*, 
              CASE 
                WHEN complaints.complaints_current_status = 1 THEN "Open" 
                WHEN complaints.complaints_current_status = 3 THEN "Attended" 
                WHEN complaints.complaints_current_status = 4 THEN "Close" 
                ELSE "Forced Close" 
              END AS complaints_status, 
              CASE 
                WHEN complaints.complaints_urban_rular = 1 THEN "Urban" 
                WHEN complaints.complaints_urban_rular = 2 THEN "Rural" 
                ELSE "" 
              END AS location_type, 
              category_main.category_main_name, 
              category_sub.category_sub_name, 
              region.region_name, 
              circle.circle_name, 
              division.division_name, 
              sub_division.sub_division_name, 
              distributed_center.distributed_center_name, 
              district.district_name, 
              city.city_name, 
              block.block_name, 
              gram_panchayat.gram_panchayat_name, 
              village.village_name, 
              area.area_name, 
              colony.colony_name, 
              foc_masters.foc_name 
       FROM complaints 
       LEFT JOIN category_main ON category_main.category_main_id = complaints.complaints_main_category 
       LEFT JOIN category_sub ON category_sub.category_sub_id = complaints.complaints_sub_category 
       LEFT JOIN region ON region.region_id = complaints.complaints_region 
       LEFT JOIN circle ON circle.circle_id = complaints.complaints_circle 
       LEFT JOIN division ON division.division_id = complaints.complaints_division 
       LEFT JOIN sub_division ON sub_division.sub_division_id = complaints.complaints_sub_division 
       LEFT JOIN distributed_center ON distributed_center.distributed_center_id = complaints.complaints_dc 
       LEFT JOIN district ON district.district_id = complaints.complaints_district 
       LEFT JOIN city ON city.city_id = complaints.complaints_city 
       LEFT JOIN block ON block.block_id = complaints.complaints_block 
       LEFT JOIN gram_panchayat ON gram_panchayat.gram_panchayat_id = complaints.complaints_panchayat 
       LEFT JOIN village ON village.village_id = complaints.complaints_village 
       LEFT JOIN area ON area.area_id = complaints.complaints_area 
       LEFT JOIN colony ON colony.colony_id = complaints.complaints_colony 
       LEFT JOIN foc_masters ON foc_masters.foc_id = complaints.complaints_assign_foc_center_id 
       WHERE complaints.complaints_id = ?`,
      [id]
    )

    const res2 = await conn.query(
      'SELECT complaints_history_id, complaints_history_created_date, complaints_history_status, complaints_history_followup_by, complaints_history_remark FROM complaints_history WHERE complaints_history_complaint_id = ? ORDER BY complaints_history_id DESC',
      [id]
    )

    const res3 = await conn.query(
      `SELECT * 
       FROM complaints_question 
       LEFT JOIN questions_master ON complaints_question.question_id = questions_master.q_id 
       LEFT JOIN options_master ON options_master.opt_id = complaints_question.question_option_id 
       WHERE complaints_question.complaint_id = ?`,
      [id]
    )

    let foc_det = null
    if (res1[0].complaints_assign_foc_center_id != 0) {
      foc_det = await conn.query(
        'SELECT users_first_name FROM users WHERE users_foc_center_id = ? AND users_type = 9 AND users_status = 1',
        [res1[0].complaints_assign_foc_center_id]
      )
    }

    const [je_det, ae_det] = await Promise.all([
      // Get JE details
      getDetailsForJE(conn, res1[0]),

      // Get AE details
      getDetailsForAE(conn, res1[0]),
    ])

    return { res1, res2, res3, foc_det, je_det, ae_det }
  } catch (err) {
    console.error('Error fetching data in getSUPcomplaintsbyID_m:', err.message)
    throw new ErrorHandler('Database query failed', 500) // Use ErrorHandler for consistent error formatting
  } finally {
    if (conn) conn.release() // Release connection back to the pool
  }
}

const getDetailsForJE = async (conn, res1) => {
  let cond = ''
  let je_det = []

  if (res1.complaints_dc !== 0) {
    const [je_count, category_officer, je_loc_id, je_grp_id] =
      await Promise.all([
        conn.query(
          'SELECT users_id FROM users WHERE users_type = 7 AND users_status = 1 AND users_distributed_center_id = ?',
          [res1.complaints_dc]
        ),
        conn.query(
          'SELECT users_id FROM users WHERE users_type = 7 AND users_status = 1 AND users_distributed_center_id = ? AND FIND_IN_SET(?, users_category)',
          [res1.complaints_dc, res1.complaints_main_category]
        ),
        conn.query(
          'SELECT users_id FROM users WHERE users_type = 7 AND users_status = 1 AND users_distributed_center_id = ? AND FIND_IN_SET(?, users_loc)',
          [res1.complaints_dc, res1.complaints_consumer_loc_no]
        ),
        conn.query(
          'SELECT users_id FROM users WHERE users_type = 7 AND users_status = 1 AND users_distributed_center_id = ? AND FIND_IN_SET(?, users_group)',
          [res1.complaints_dc, res1.complaints_consumer_gr_no]
        ),
      ])

    if (je_count.length > 0) {
      if (
        category_officer.length > 0 &&
        je_loc_id.length > 0 &&
        je_grp_id.length > 0
      ) {
        cond = `AND FIND_IN_SET(${res1.complaints_main_category}, users_category) AND FIND_IN_SET("${res1.complaints_consumer_loc_no}", users_loc) AND FIND_IN_SET("${res1.complaints_consumer_gr_no}", users_group)`
      } else if (category_officer.length > 0 && je_grp_id.length > 0) {
        cond = `AND FIND_IN_SET(${res1.complaints_main_category}, users_category) AND FIND_IN_SET("${res1.complaints_consumer_gr_no}", users_group)`
      } else if (category_officer.length > 0 && je_loc_id.length > 0) {
        cond = `AND FIND_IN_SET(${res1.complaints_main_category}, users_category) AND FIND_IN_SET("${res1.complaints_consumer_loc_no}", users_loc)`
      } else if (je_loc_id.length > 0 && je_grp_id.length > 0) {
        cond = `AND FIND_IN_SET("${res1.complaints_consumer_loc_no}", users_loc) AND FIND_IN_SET("${res1.complaints_consumer_gr_no}", users_group)`
      } else if (category_officer.length > 0) {
        cond = `AND FIND_IN_SET(${res1.complaints_main_category}, users_category)`
      } else if (je_loc_id.length > 0) {
        cond = `AND FIND_IN_SET("${res1.complaints_consumer_loc_no}", users_loc)`
      } else if (je_grp_id.length > 0) {
        cond = `AND FIND_IN_SET("${res1.complaints_consumer_gr_no}", users_group)`
      }

      if (cond) {
        je_det = await conn.query(
          `SELECT users_first_name, users_mobile FROM users WHERE users_type = 7 AND users_status = 1 AND users_distributed_center_id = ? ${cond}`,
          [res1.complaints_dc]
        )
      }
    }
  }

  return je_det
}

const getDetailsForAE = async (conn, res1) => {
  let ae_det = []

  if (res1.complaints_division !== 0) {
    ae_det = await conn.query(
      'SELECT users_first_name, users_mobile FROM users WHERE users_type = 6 AND users_status = 1 AND users_division_id = ?',
      [res1.complaints_division]
    )
  }

  return ae_det
}
// export const getWorngDCComplaints_m = async (data) => {
//   let conn
//   try {
//     conn = await pool.getConnection()
//     let cond = ''
//     if (data.startdate !== 'Invalid date' && data.enddate !== 'Invalid date') {
//       cond = `AND date(complaints.complaints_created_date) >= '${data.startdate}' AND date(complaints.complaints_created_date) <= '${data.enddate}' `
//     }

//     const [res] = await conn.query(
//       `
//         SELECT complaints.complaints_id as id, complaints.complaints_consumer_id, complaints_consumer_name, complaints.complaints_created_date, complaints_consumer_mobile, complaints_called_mobile, complaints_ivrs,
//           CASE
//             WHEN complaints.wrong_dc = 1 AND complaints.complaints_current_status = 1 THEN 'Wrong Dc Open'
//             WHEN complaints.wrong_dc = 1 AND complaints.complaints_current_status = 3 THEN 'Wrong Dc Attended'
//             WHEN complaints.wrong_dc = 1 AND complaints.complaints_current_status = 4 THEN 'Wrong Dc Close'
//             WHEN complaints.wrong_dc = 0 AND complaints.complaints_current_status = 1 THEN 'Open'
//             WHEN complaints.wrong_dc = 0 AND complaints.complaints_current_status = 3 THEN 'Attended'
//             WHEN complaints.wrong_dc = 2 AND complaints.complaints_current_status = 1 THEN 'Open'
//             WHEN complaints.complaints_current_status = 4 THEN 'Close'
//             ELSE 'Forced Close'
//           END AS complaints_status,
//           CASE
//             WHEN complaints.complaints_urban_rular = 1 THEN 'Urban'
//             WHEN complaints.complaints_urban_rular = 2 THEN 'Rural'
//             ELSE ''
//           END AS location_type,
//           category_main.category_main_name,
//           category_sub.category_sub_name,
//           region.region_name,
//           circle.circle_name,
//           division.division_name,
//           sub_division.sub_division_name,
//           distributed_center.distributed_center_name
//         FROM complaints
//         LEFT JOIN category_main ON category_main.category_main_id = complaints.complaints_main_category
//         LEFT JOIN category_sub ON category_sub.category_sub_id = complaints.complaints_sub_category
//         LEFT JOIN region ON region.region_id = complaints.complaints_region
//         LEFT JOIN circle ON circle.circle_id = complaints.complaints_circle
//         LEFT JOIN division ON division.division_id = complaints.complaints_division
//         LEFT JOIN sub_division ON sub_division.sub_division_id = complaints.complaints_sub_division
//         LEFT JOIN distributed_center ON distributed_center.distributed_center_id = complaints.complaints_dc
//         WHERE complaints.complaints_id != '' AND complaints.wrong_dc = 1 ${cond}
//         ORDER BY complaints.complaints_id DESC
//       `
//     )

//     return res
//   } catch (err) {
//     throw new ErrorHandler(500, err.message) // Use ErrorHandler class
//   } finally {
//     if (conn) conn.end() // End connection to pool
//   }
// }
// export const getWorngDCComplaints_m1 = async (id) => {
//   let conn
//   try {
//     conn = await pool.getConnection()

//     const [list] = await conn.query(
//       `SELECT * FROM complaints WHERE complaints.complaints_id != '' AND complaints.wrong_dc = 1 ORDER BY complaints.complaints_id DESC`
//     )
//     console.log('list', list)
//     const data = []
//     let no = 0

//     for (const v_list of list) {
//       no++
//       const row = []

//       const complaints_lt_ht_type = v_list.complaints_lt_ht_type
//       let cons_type = ''
//       if (complaints_lt_ht_type == 2) {
//         cons_type =
//           "<span class='badge' style='background-color:red'>LT HV</span>"
//       }

//       row.push(
//         `<a href="#" onclick="complaints_details(${v_list.complaints_id})" title="Complaints Details" class="btn btn-icon btn-sm btn-primary btn-secondary text-black" style="background-color:#000;color:#fff">
//             <i class="fa fa-eye"></i></a>
//          <a href="#" onclick="complaints_FollowUp(${v_list.complaints_id})" title="Complaints FollowUp" class="btn btn-sm btn-icon btn-primary btn-secondary" style="color:#fff;background-color:#2babab;margin-bottom:5px;display:none">
//             <i class="fa fa-wrench"></i></a>
//          <a href="javascript:void(0)" onclick="complaints_came_from(${v_list.complaints_id})" title="Complaints Details" class="btn btn-icon btn-sm btn-primary btn-secondary text-black" style="background-color:#000;display:none;color:#fff;margin-bottom:5px">
//             <i class="fa fa-edit"></i></a>`
//       )

//       row.push(`<b>${v_list.complaints_id}</b>`)

//       row.push(
//         v_list.complaints_region
//           ? await getValue(conn, 'region_name', 'region', {
//               region_id: v_list.complaints_region,
//             })
//           : 'N/A'
//       )
//       row.push(
//         v_list.complaints_circle
//           ? await getValue(conn, 'circle_name', 'circle', {
//               circle_id: v_list.complaints_circle,
//             })
//           : 'N/A'
//       )
//       row.push(
//         v_list.complaints_division
//           ? await getValue(conn, 'division_name', 'division', {
//               division_id: v_list.complaints_division,
//             })
//           : 'N/A'
//       )
//       row.push(
//         v_list.complaints_sub_division
//           ? await getValue(conn, 'sub_division_name', 'sub_division', {
//               sub_division_id: v_list.complaints_sub_division,
//             })
//           : 'N/A'
//       )
//       row.push(
//         v_list.complaints_dc
//           ? await getValue(
//               conn,
//               'distributed_center_name',
//               'distributed_center',
//               {
//                 distributed_center_id: v_list.complaints_dc,
//               }
//             )
//           : 'N/A'
//       )

//       row.push(
//         `${v_list.complaints_consumer_name} ${cons_type}<br><b>I:</b> ${v_list.complaints_ivrs}`
//       )
//       row.push(v_list.complaints_consumer_mobile)
//       row.push(v_list.complaints_called_mobile)

//       if (v_list.complaints_created_by === 0) {
//         row.push('Self')
//       } else {
//         const agent_info = await getAgentName(
//           conn,
//           v_list.complaints_created_by
//         )
//         console.log('agent_info', agent_info)
//         if (agent_info) {
//           row.push(
//             `${agent_info.users_first_name} ${agent_info.users_last_name} [${agent_info.users_name}]`
//           )
//         } else {
//           row.push('N/A')
//         }
//       }

//       const cate_name = await getValue(
//         conn,
//         'category_main_name',
//         'category_main',
//         {
//           category_main_id: v_list.complaints_main_category,
//         }
//       )
//       const cate_sub_name = await getValue(
//         conn,
//         'category_sub_name',
//         'category_sub',
//         { category_sub_id: v_list.complaints_sub_category }
//       )
//       console.log('cate_sub_name', cate_sub_name)
//       row.push(cate_name)
//       row.push(cate_sub_name)

//       if (v_list.complaints_assign_gang_id === 0) {
//         row.push('N/A')
//       } else {
//         const gang_name = await getGangName(
//           conn,
//           v_list.complaints_assign_gang_id
//         )
//         console.log('gang_name', gang_name)
//         if (gang_name) {
//           row.push(`${gang_name.gang_name} [<b>${gang_name.gang_number}</b>]`)
//         } else {
//           row.push('')
//         }
//       }
//       console.log('v', v_list.complaints_assign_officer_id)
//       console.log('v1', v_list.complaints_assign_officer_id_level1)
//       if (v_list.complaints_assign_officer_id === 0) {
//         row.push('N/A')
//       } else {
//         const officer_name = await getOfficerName(
//           conn,
//           v_list.complaints_assign_officer_id
//         )
//         console.log('officer_name1', officer_name)
//         if (officer_name) {
//           const designation = getDesignation(conn, officer_name.users_type)
//           console.log('designation', designation)
//           row.push(
//             `<b>(${designation})</b> ${officer_name.users_first_name} ${officer_name.users_last_name}<br> [<b>Mob:</b>${officer_name.users_mobile}]`
//           )
//         } else {
//           row.push('Not Assigned')
//         }
//       }

//       if (v_list.complaints_assign_officer_id_level1 === 0) {
//         row.push('N/A')
//       } else {
//         const officer_name = await getOfficerName(
//           conn,
//           v_list.complaints_assign_officer_id_level1
//         )
//         if (officer_name) {
//           const designation = getDesignation(conn, officer_name.users_type)
//           row.push(
//             `<b>(${designation})</b> ${officer_name.users_first_name} ${officer_name.users_last_name}<br> [<b>Mob:</b>${officer_name.users_mobile}]`
//           )
//         } else {
//           row.push('Not Assigned')
//         }
//       }

//       row.push(v_list.complaints_created_date)
//       row.push(v_list.complaints_last_updated_date)

//       let wdc = ''
//       if (v_list.wrong_dc == 1) {
//         wdc = "<span class='tag tag-gray-dark'>Wrong Dc</span><br>"
//       }

//       switch (v_list.complaints_current_status) {
//         case 1:
//           row.push(`${wdc}<span class='tag tag-red'>Open</span>`)
//           break
//         case 2:
//           row.push(`${wdc}<span class='tag tag-yellow'>Attended</span>`)
//           break
//         case 3:
//           row.push(`${wdc}<span class='tag tag-orange'>Attended</span>`)
//           break
//         case 4:
//           row.push(`${wdc}<span class='tag tag-green'>Closed</span>`)
//           break
//         case 5:
//           row.push(`${wdc}<span class='tag tag-gray-dark'>Re-open</span>`)
//           break
//         case 6:
//           row.push(`${wdc}<span class='tag tag-gray-dark'>Force Closed</span>`)
//           break
//         default:
//           row.push('')
//       }

//       const reminder_count = await getReminderCount(conn, v_list.complaints_id)

//       const total_call_not_pick_officer = await getNum(
//         conn,
//         'complaints_history',
//         {
//           complaints_history_complaint_id: v_list.complaints_id,
//           complaints_history_status: 9,
//         }
//       )
//       const total_call_not_connect_officer = await getNum(
//         conn,
//         'complaints_history',
//         {
//           complaints_history_complaint_id: v_list.complaints_id,
//           complaints_history_status: 12,
//         }
//       )
//       const total_call_not_pick_consumer = await getNum(
//         conn,
//         'complaints_history',
//         {
//           complaints_history_complaint_id: v_list.complaints_id,
//           complaints_history_status: 10,
//         }
//       )
//       const total_call_not_connect_consumer = await getNum(
//         conn,
//         'complaints_history',
//         {
//           complaints_history_complaint_id: v_list.complaints_id,
//           complaints_history_status: 11,
//         }
//       )
//       const total_call_for_status = await getNum(conn, 'complaints_history', {
//         complaints_history_complaint_id: v_list.complaints_id,
//         complaints_history_status: 17,
//       })

//       if (reminder_count.reminder_count !== 0) {
//         const last_reminder_time = await getLastReminder(
//           conn,
//           v_list.complaints_id
//         )
//         row.push(reminder_count.reminder_count)
//         row.push(total_call_not_pick_officer)
//         row.push(total_call_not_connect_officer)
//         row.push(total_call_not_connect_consumer)
//         row.push(total_call_not_pick_consumer)
//         row.push(total_call_for_status)
//         row.push(last_reminder_time.complaints_history_created_date)
//       } else {
//         row.push(0)
//         row.push(total_call_not_pick_officer)
//         row.push(total_call_not_connect_officer)
//         row.push(total_call_not_connect_consumer)
//         row.push(total_call_not_pick_consumer)
//         row.push(total_call_for_status)
//         row.push('N/A')
//       }

//       switch (v_list.complaint_type) {
//         case 1:
//           row.push('<span><b>General</b></span>')
//           break
//         case 2:
//           row.push('<span><b>FTR</b></span>')
//           break
//         default:
//           row.push('<span><b>Hold</b></span>')
//       }

//       row.push(v_list.complaints_came_from)
//       data.push(row)
//     }

//     return data
//   } catch (error) {
//     throw new ErrorHandler(error.message, 500)
//   } finally {
//     if (conn) conn.release()
//   }
// }

export const getWorngDCComplaints_m = async (id) => {
  let conn
  try {
    conn = await pool.getConnection()

    const [list] = await conn.query(
      `SELECT complaints_lt_ht_type,complaints_region,complaints_circle,complaints_created_by,complaints_number,
      complaints_called_mobile,complaints_consumer_mobile,complaints_ivrs,complaints_consumer_name,
      complaints_main_category,complaints_current_status,wrong_dc,complaints_number,complaints_came_from,
      complaints_division,complaints_sub_division,complaints_dc,complaint_type,complaints_last_updated_date,
      complaints_sub_category,complaints_assign_gang_id,complaints_assign_officer_id,complaints_created_date,
      complaints_assign_officer_id_level1,complaints_id FROM complaints WHERE complaints.complaints_id != '' AND complaints.wrong_dc = 1 ORDER BY complaints.complaints_id DESC`
    )
    // console.log('list', list);
    const data = []
    let no = 0

    for (const v_list of list) {
      no++

      let cons_type = ''
      if (v_list.complaints_lt_ht_type == 2) {
        cons_type = 'LT HV'
      }

      let region_name = v_list.complaints_region
        ? await getValue(conn, 'region_name', 'region', {
            region_id: v_list.complaints_region,
          })
        : 'N/A'

      let circle_name = v_list.complaints_circle
        ? await getValue(conn, 'circle_name', 'circle', {
            circle_id: v_list.complaints_circle,
          })
        : 'N/A'

      let division_name = v_list.complaints_division
        ? await getValue(conn, 'division_name', 'division', {
            division_id: v_list.complaints_division,
          })
        : 'N/A'

      let sub_division_name = v_list.complaints_sub_division
        ? await getValue(conn, 'sub_division_name', 'sub_division', {
            sub_division_id: v_list.complaints_sub_division,
          })
        : 'N/A'

      let distributed_center_name = v_list.complaints_dc
        ? await getValue(
            conn,
            'distributed_center_name',
            'distributed_center',
            {
              distributed_center_id: v_list.complaints_dc,
            }
          )
        : 'N/A'

      let agent = ''
      if (v_list.complaints_created_by === 0) {
        agent = 'Self'
      } else {
        const agent_info = await getAgentName(
          conn,
          v_list.complaints_created_by
        )
        if (agent_info) {
          agent = `${agent_info.users_first_name} ${agent_info.users_last_name} [${agent_info.users_name}]`
        } else {
          agent = 'N/A'
        }
      }

      const cate_name = await getValue(
        conn,
        'category_main_name',
        'category_main',
        {
          category_main_id: v_list.complaints_main_category,
        }
      )
      const cate_sub_name = await getValue(
        conn,
        'category_sub_name',
        'category_sub',
        { category_sub_id: v_list.complaints_sub_category }
      )
      let gang = ''
      if (v_list.complaints_assign_gang_id === 0) {
        gang = 'N/A'
      } else {
        const gang_name = await getGangName(
          conn,
          v_list.complaints_assign_gang_id
        )
        if (gang_name) {
          gang = `${gang_name.gang_name} [${gang_name.gang_number}]`
        } else {
          gang = ''
        }
      }

      let officer = ''
      if (v_list.complaints_assign_officer_id === 0) {
        officer = 'N/A'
      } else {
        const officer_name = await getOfficerName(
          conn,
          v_list.complaints_assign_officer_id
        )
        if (officer_name) {
          const designation = getDesignation(conn, officer_name.users_type)
          officer = `(${designation}) ${officer_name.users_first_name} ${officer_name.users_last_name}${officer_name.users_mobile}]`
        } else {
          officer = 'Not Assigned'
        }
      }
      let officer1 = ''
      if (v_list.complaints_assign_officer_id_level1 === 0) {
        officer1 = ''
      } else {
        const officer_name = await getOfficerName(
          conn,
          v_list.complaints_assign_officer_id_level1
        )
        if (officer_name) {
          const designation = getDesignation(conn, officer_name.users_type)
          officer1 = `(${designation}) ${officer_name.users_first_name} ${officer_name.users_last_name}[${officer_name.users_mobile}]`
        } else {
          officer1 = 'Not Assigned'
        }
      }

      let wdc = ''
      if (v_list.wrong_dc == 1) {
        wdc = 'Wrong Dc'
      }

      switch (v_list.complaints_current_status) {
        case 1:
          wdc = `${wdc}Open`

          break
        case 2:
          wdc = `${wdc}Attended`

          break
        case 3:
          wdc = `${wdc}Attended`

          break
        case 4:
          wdc = `${wdc}Closed`

          break
        case 5:
          wdc = `${wdc}Reopen`
          break
        case 6:
          wdc = `${wdc}Force Closed`
          break
        default:
          wdc = ''
      }
      const reminder_count = await getReminderCount(conn, v_list.complaints_id)

      const total_call_not_pick_officer = await getNum(
        conn,
        'complaints_history',
        {
          complaints_history_complaint_id: v_list.complaints_id,
          complaints_history_status: 9,
        }
      )
      const total_call_not_connect_officer = await getNum(
        conn,
        'complaints_history',
        {
          complaints_history_complaint_id: v_list.complaints_id,
          complaints_history_status: 12,
        }
      )
      const total_call_not_pick_consumer = await getNum(
        conn,
        'complaints_history',
        {
          complaints_history_complaint_id: v_list.complaints_id,
          complaints_history_status: 10,
        }
      )
      const total_call_not_connect_consumer = await getNum(
        conn,
        'complaints_history',
        {
          complaints_history_complaint_id: v_list.complaints_id,
          complaints_history_status: 11,
        }
      )
      const total_call_for_status = await getNum(conn, 'complaints_history', {
        complaints_history_complaint_id: v_list.complaints_id,
        complaints_history_status: 17,
      })
      let rm_count, complaints_history_created_date
      if (reminder_count.reminder_count !== 0) {
        const last_reminder_time = await getLastReminder(
          conn,
          v_list.complaints_id
        )
        rm_count = reminder_count.reminder_count
        complaints_history_created_date =
          last_reminder_time.complaints_history_created_date
      } else {
        rm_count = 0
        complaints_history_created_date = 'N/A'
      }
      let complaint_type = ''
      switch (v_list.complaint_type) {
        case 1:
          complaint_type = 'General'
          break
        case 2:
          complaint_type = 'FTR'
          break
        default:
          complaint_type = 'Hold'
      }

      const row = {
        id: v_list.complaints_id,
        complaints_number: v_list.complaints_number,
        division_name: division_name,
        region_name: region_name,
        circle_name: circle_name,
        sub_division_name: sub_division_name,
        distributed_center_name: distributed_center_name,
        complaints_consumer_name: v_list.complaints_consumer_name,
        complaints_ivrs: v_list.complaints_ivrs,
        complaints_consumer_mobile: v_list.complaints_consumer_mobile,
        complaints_called_mobile: v_list.complaints_called_mobile,
        officer: officer,
        cate_name: cate_name,
        cate_sub_name: cate_sub_name,
        agent: agent,
        gang: gang,
        officer1: officer1,
        complaints_created_date: v_list.complaints_created_date,
        complaints_last_updated_date: v_list.complaints_last_updated_date,
        wdc: wdc,
        rm_count: rm_count,
        // total_call_not_pick_officer: total_call_not_pick_officer,
        // total_call_not_connect_officer: total_call_not_connect_officer,
        // total_call_not_connect_consumer: total_call_not_connect_consumer,
        // total_call_for_status: 0,
        // total_call_not_pick_consumer: 0,
        // total_call_for_status: total_call_for_status,
        //total_call_not_pick_consumer: total_call_not_pick_consumer,
        complaints_history_created_date: complaints_history_created_date,
        complaint_type: complaint_type,
        complaints_came_from: v_list.complaints_came_from,
      }

      data.push(row)
    }

    return data
  } catch (error) {
    throw new ErrorHandler(error.message, 500)
  } finally {
    if (conn) conn.release()
  }
}

// Helper functions
const getValue = async (conn, column, table, condition) => {
  const keys = Object.keys(condition)
  const values = Object.values(condition)
  const conditionString = keys.map((key) => `${key} = ?`).join(' AND ')

  const [rows] = await conn.query(
    `SELECT ${column} FROM ${table} WHERE ${conditionString}`,
    values
  )

  if (rows.length > 0) {
    return rows[0][column]
  } else {
    return 'N/A'
  }
}

const getAgentName = async (conn, id) => {
  const [rows] = await conn.query(
    `SELECT users_first_name,users_last_name,users_name FROM users WHERE users_id = ${id}`
  )
  if (rows.length > 0) {
    return rows[0]
  } else {
    return 'N/A'
  }
}

const getGangName = async (conn, id) => {
  const [rows] = await conn.query(
    `SELECT gang_name,gang_number FROM gang WHERE gang_id = ${id}`
  )

  if (rows.length > 0) {
    return rows[0]
  } else {
    return 'N/A'
  }
}

const getOfficerName = async (conn, id) => {
  const [rows] = await conn.query(
    `SELECT users_first_name,users_last_name,users_type,users_mobile FROM users WHERE users_id = ${id}`
  )

  if (rows.length > 0) {
    return rows[0]
  } else {
    return 'N/A'
  }
}

const getDesignation = (conn, type) => {
  switch (type) {
    case 7:
      return 'JE'
    case 6:
      return 'AE'
    case 5:
      return 'EE'
    case 4:
      return 'SE'
    case 3:
      return 'CE'
    default:
      return ''
  }
}

const getReminderCount = async (conn, id) => {
  const [rows] = await conn.query(
    `SELECT COUNT(complaints_history_id) as reminder_count  FROM complaints_history WHERE complaints_history_complaint_id = ${id} AND complaints_history_status=8`
  )
  if (rows.length > 0) {
    return rows[0]
  } else {
    return 'N/A'
  }
}

const getLastReminder = async (conn, id) => {
  const [rows] = await conn.query(
    `SELECT complaints_history_created_date FROM complaints_history WHERE complaints_history_complaint_id = ${id} AND complaints_history_status=8 ORDER BY complaints_history.complaints_history_created_date DESC`
  )
  if (rows.length > 0) {
    return rows[0]
  } else {
    return 'N/A'
  }
}

const getNum = async (conn, table, condition) => {
  const keys = Object.keys(condition)
  const values = Object.values(condition)
  const conditionString = keys.map((key) => `${key} = ?`).join(' AND ')

  const [rows] = await conn.query(
    `SELECT complaints_history_id FROM ${table} WHERE ${conditionString}`,
    values
  )

  if (rows.length > 0) {
    return rows[0]
  } else {
    return 'N/A'
  }
}
export const handleAddBriefing_m = async (data) => {
  let conn

  try {
    conn = await pool.getConnection()

    const { title, description, filename } = data

    // Use parameterized query to prevent SQL injection
    const query =
      'INSERT INTO quality_feedback (title, description, feedback_link, status, created_by, brief_by) VALUES (?, ?, ?, ?, ?, ?)'
    const values = [title, description, filename, 0, 211204, 211204]

    await conn.query(query, values)
  } catch (err) {
    console.error('Error executing query in handleAddBriefing_m:', err.message)
    throw new ErrorHandler('Database insert failed', 500) // Use ErrorHandler for consistent error formatting
  } finally {
    if (conn) conn.release() // Release connection back to the pool
  }
}
export const handleDeleteButtonClick_m = async (data) => {
  let conn

  try {
    conn = await pool.getConnection()

    const query = `
      UPDATE quality_feedback
      SET status = 2, created_by = 211204, brief_by = 211204
      WHERE id = ?
    `

    const [result] = await conn.query(query, [data.id])

    if (result.affectedRows === 0) {
      throw new ErrorHandler('No record found to update', 404)
    }

    return result
  } catch (err) {
    console.error(
      'Error executing query in handleDeleteButtonClick_m:',
      err.message
    )
    throw new ErrorHandler('Database query failed', 500) // Use ErrorHandler for consistent error formatting
  } finally {
    if (conn) conn.release() // Release connection back to the pool
  }
}

export const handleEditBriefing_m = async (data) => {
  let conn

  try {
    conn = await pool.getConnection()

    const { title, description, filename, id } = data

    // Use parameterized query to prevent SQL injection
    const query = `
      UPDATE quality_feedback
      SET title = ?, description = ?, feedback_link = ?, status = 0, created_by = 211204, brief_by = 211204
      WHERE id = ?
    `
    const values = [title, description, filename, id]

    await conn.query(query, values)
  } catch (err) {
    console.error('Error executing query in handleEditBriefing_m:', err.message)
    throw new ErrorHandler('Database update failed', 500) // Use ErrorHandler for consistent error formatting
  } finally {
    if (conn) conn.release() // Release connection back to the pool
  }
}
export const SaveCircle_m = async (data) => {
  let conn
  let res
  try {
    conn = await pool.getConnection()
    res = await conn.query(
      'INSERT INTO circle (circle_region_id, circle_name) VALUES (?,?)',
      [data.circle_region_id, data.circle_name]
    )
  } finally {
    if (conn) conn.end() //end to pool
  }
}

export const SaveCompComplaint_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()

    const [existingComplaint] = await conn.query(
      'SELECT complaints_id FROM complaints WHERE complaints_current_status IN (1,5) AND complaints_main_category = ? AND complaints_consumer_mobile = ?',
      [data.formData.category, data.formData.conn_mob]
    )

    if (existingComplaint.length === 0) {
      // Step 2: Get subcategory details
      const [subcatDet] = await conn.query(
        'SELECT * FROM category_sub WHERE category_sub_id = ?',
        [data.formData.subcategory]
      )

      if (subcatDet.length > 0) {
        const subcategory = subcatDet[0]
        const urbanRural = data.formData.urban_rural

        // Step 3: Determine officer and gang assignments based on urban/rural setting
        const { officerId, officerType, gangId, tat } =
          await assignOfficerAndGang({
            conn,
            data,
            subcategory,
            urbanRural,
          })

        // Step 4: Generate complaint number
        const complaintsNumber = await generateCompComplaintNumber(
          conn,
          data.formData.category
        )

        // Step 5: Get consumer ID
        const consumerId = await getConsumerId(conn, data.formData.IVRSNumber)

        //Step 6: Insert new complaint into the database
        const response = await insertCompComplaint({
          conn,
          data,
          consumerId,
          complaintsNumber,
          officerId,
          officerType,
          gangId,
          tat,
        })

        return response
      } else {
        throw new ErrorHandler('Subcategory not found', 404)
      }
    } else {
      throw new ErrorHandler('Complaint already exists', 400)
    }
  } catch (error) {
    console.error('Error saving complaint:', error.message)
    throw new ErrorHandler('Unable to save complaint', 500)
  } finally {
    if (conn) conn.release()
  }
}

// Example of a helper function for assigning officer and gang
const assignOfficerAndGang = async ({
  conn,
  data,
  subcategory,
  urbanRural,
}) => {
  let officerId = 0,
    officerType = 0,
    gangId = 0,
    tat = 0

  const getGangId = async (focCenterId) => {
    const [gangList] = await conn.query(
      'SELECT gang_id FROM `gang` LEFT JOIN gang_lineman ON gang.gang_id=lineman_gang_id WHERE gang.gang_id=?',
      [focCenterId]
    )

    return gangList.length > 0 ? gangList[0].gang_id : 0
  }

  const getOfficerId = async (query, params) => {
    const [result] = await conn.query(query, params)
    return result.length > 0 ? result[0].users_id : 0
  }

  if (urbanRural == 1) {
    // Urban logic
    const {
      dc_id: complaintsDc,
      region_id: regionId,
      circle_id: circleId,
      division_id: divisionId,
      sub_division_id: subDivisionId,
      foc_center_id: focCenterId,
    } = data.formData

    gangId = await getGangId(focCenterId)

    if (subcategory.category_sub_level1_urban == 8) {
      officerType = 8
      tat = subcategory.category_sub_level1_urban_time
    } else if (subcategory.category_sub_level1_urban == 7) {
      officerType = 7
      tat = subcategory.category_sub_level1_urban_time

      const jeCount = await getOfficerId(
        'SELECT users_id FROM `users` where users_type= ? and users_distributed_center_id = ?',
        [7, complaintsDc]
      )

      if (jeCount) {
        const mcat = data.formData.category
        const [locGr] = await conn.query(
          'SELECT consumer_gr_no,consumer_loc_cd FROM `consumer` left join locations_master on loc_id=consumer_location_id where loc_colony_id=? and consumer_gr_no!="" limit 1',
          [data.formData.complaints_colony]
        )

        if (locGr.length > 0) {
          const { consumer_gr_no: grCode, consumer_loc_cd: locCode } = locGr[0]
          officerId = await getOfficerId(
            `SELECT users_id FROM users where users_loc LIKE '%${locCode}%' and users_group LIKE '%${grCode}%' and users_type = 7 and users_distributed_center_id = ${complaintsDc}`
          )
        } else {
          officerId = await getOfficerId(
            'SELECT users_id FROM `users` where users_type = ? and users_distributed_center_id = ? and users_category != 17',
            [7, complaintsDc]
          )
        }
      }
    } else if (subcategory.category_sub_level1_urban == 6) {
      officerType = 6
      tat = subcategory.category_sub_level1_urban_time

      officerId = await getOfficerId(
        'SELECT users_id FROM `users` where users_type = ? and users_sub_division_id = ?',
        [6, subDivisionId]
      )
    } else if (subcategory.category_sub_level1_urban == 5) {
      officerType = 5
      tat = subcategory.category_sub_level1_urban_time

      officerId = await getOfficerId(
        'SELECT users_id FROM `users` where users_type = ? and users_division_id = ?',
        [5, divisionId]
      )
    } else if (subcategory.category_sub_level1_urban == 4) {
      officerType = 4
      tat = subcategory.category_sub_level1_urban_time

      officerId = await getOfficerId(
        'SELECT users_id FROM `users` where users_type = ? and users_circle_id = ?',
        [4, circleId]
      )
    } else if (subcategory.category_sub_level1_urban == 3) {
      officerType = 3
      tat = subcategory.category_sub_level1_urban_time

      officerId = await getOfficerId(
        'SELECT users_id FROM `users` where users_type = ? and users_region_id = ?',
        [3, regionId]
      )
    }
  } else {
    // Rural logic
    const {
      complaints_panchayat: panchayat,
      complaints_block: block,
      dc_id: complaintsDc,
      region_id: regionId,
      circle_id: circleId,
      division_id: divisionId,
      sub_division_id: subDivisionId,
    } = data.formData

    const gangLocationList = await conn.query(
      'SELECT locations_master.loc_dc_id,foc_gang_location_master.fgl_gang_id,locations_master.loc_sub_division_id,foc_masters.foc_id,locations_master.loc_region_id,locations_master.loc_circle_id,locations_master.loc_division_id FROM `locations_master` LEFT JOIN  foc_gang_location_master ON  foc_gang_location_master.fgl_location_id=loc_id LEFT JOIN foc_masters ON foc_masters.foc_id=foc_gang_location_master.fgl_foc_id WHERE loc_gp_id=? and loc_block_id= ? limit 1',
      [panchayat, block]
    )

    if (gangLocationList && gangLocationList.length > 0) {
      gangId = await getGangId(gangLocationList[0].fgl_gang_id)
    }

    if (subcategory.category_sub_level1_rural == 8) {
      officerType = 8
      tat = subcategory.category_sub_level1_rural_time
    } else if (subcategory.category_sub_level1_rural == 7) {
      officerType = 7
      tat = subcategory.category_sub_level1_rural_time

      const jeCount = await getOfficerId(
        'SELECT users_id FROM `users` where users_type= ? and users_distributed_center_id = ?',
        [7, complaintsDc]
      )

      if (jeCount) {
        officerId = await getOfficerId(
          'SELECT users_id FROM `users` where users_type = ? and users_distributed_center_id = ? and users_category != 17',
          [7, complaintsDc]
        )
      }
    } else if (subcategory.category_sub_level1_rural == 6) {
      officerType = 6
      tat = subcategory.category_sub_level1_rural_time

      officerId = await getOfficerId(
        'SELECT users_id FROM `users` where users_type = ? and users_sub_division_id = ?',
        [6, subDivisionId]
      )
    } else if (subcategory.category_sub_level1_rural == 5) {
      officerType = 5
      tat = subcategory.category_sub_level1_rural_time

      officerId = await getOfficerId(
        'SELECT users_id FROM `users` where users_type = ? and users_division_id = ?',
        [5, divisionId]
      )
    } else if (subcategory.category_sub_level1_rural == 4) {
      officerType = 4
      tat = subcategory.category_sub_level1_rural_time

      officerId = await getOfficerId(
        'SELECT users_id FROM `users` where users_type = ? and users_circle_id = ?',
        [4, circleId]
      )
    } else if (subcategory.category_sub_level1_rural == 3) {
      officerType = 3
      tat = subcategory.category_sub_level1_rural_time

      officerId = await getOfficerId(
        'SELECT users_id FROM `users` where users_type = ? and users_region_id = ?',
        [3, regionId]
      )
    }
  }

  return { officerId, officerType, gangId, tat }
}

// Function to generate complaint number
const generateCompComplaintNumber = async (conn, category) => {
  const [lastComplaint] = await conn.query(
    'SELECT complaints_id FROM complaints ORDER BY complaints_id DESC LIMIT 1'
  )
  let complaintNumber = lastComplaint[0].complaints_id + 1
  return category == 23 ? `R-${complaintNumber}` : `C-${complaintNumber}`
}

// Function to insert complaint
const insertCompComplaint = async ({
  conn,
  data,
  consumerId,
  complaintsNumber,
  officerId,
  officerType,
  gangId,
  tat,
}) => {
  const formattedDate = new Date()
  const currentDate = format(formattedDate, 'yyyy-MM-dd HH:mm:ss')

  const complaintData = [
    consumerId,
    complaintsNumber,
    1,
    'Low',
    data.formData.complaintThroughUp,
    data.formData.org_cust_name,
    data.formData.conn_mob,
    data.formData.conn_mob,
    data.formData.IVRSNumber,
    data.formData.region_id,
    data.formData.circle_id,
    data.formData.division_id,
    data.formData.sub_division_id,
    data.formData.dc_id,
    data.formData.urban_rural,
    data.formData.complaints_city,
    data.formData.complaints_colony,
    data.formData.complaints_area,
    data.formData.complaints_district,
    data.formData.complaints_block,
    data.formData.complaints_panchayat,
    data.formData.complaints_village,
    data.formData.complaints_address,
    data.formData.complaints_landmark,
    officerId,
    officerType,
    gangId,
    data.formData.foc_center_id,
    data.formData.category,
    data.formData.subcategory,
    data.formData.remark,
    data.formData.locationCode,
    data.formData.groupNo,
    currentDate,
    currentDate,
    0,
  ]

  const result = await conn.query(
    'INSERT INTO complaints (`complaints_consumer_id`,`complaints_number`, `complaints_type`, `complaints_severity_level`, `complaints_came_from`, `complaints_consumer_name`, `complaints_consumer_mobile`, `complaints_called_mobile`, `complaints_ivrs`, `complaints_region`, `complaints_circle`, `complaints_division`, `complaints_sub_division`, `complaints_dc`, `complaints_urban_rular`, `complaints_city`, `complaints_colony`, `complaints_area`, `complaints_district`, `complaints_block`, `complaints_panchayat`, `complaints_village`, `complaints_address`, `complaints_landmark`, `complaints_assign_officer_id`, `complaints_assign_officer_id_level1`, `complaints_assign_gang_id`, `complaints_assign_foc_center_id`, `complaints_main_category`, `complaints_sub_category`, `complaints_remark`,`complaints_consumer_loc_no`, `complaints_consumer_gr_no`,`complaints_created_date`,`complaints_last_updated_date`, `complaints_created_by`) VALUES (?,?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)',
    complaintData
  )

  const newComplainId = result[0]

  await conn.query(
    'INSERT INTO complaints_history (complaints_history_complaint_id, complaints_history_type, complaints_history_followup_by, complaints_history_remark, complaints_history_users_id, complaints_history_status, complaints_history_attended_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      newComplainId.insertId.toString(),
      'New Complaint Register',
      'Agent',
      'New Complaint Register',
      212023,
      1,
      formattedDate,
    ]
  )
  const [subcategory_name] = await conn.query(
    'SELECT category_sub_name FROM category_sub WHERE category_sub_id = ?',
    [data.formData.subcategory]
  )

  const msg_body =
    'आप के लिए नई शिकायत आई है शिकायत क्रमांक-' +
    newComplainId.insertId +
    ' है, Subcategory: ' +
    subcategory_name[0].category_sub_name +
    ', उपभोक्ता का नाम- ' +
    data.formData.name +
    ' , मोबाइल-' +
    data.formData.mobile +
    ', पता-' +
    data.formData.address +
    ' धन्यवाद।'

  await conn.query(
    'INSERT INTO complaints_history (complaints_history_complaint_id, complaints_history_type, complaints_history_followup_by, complaints_history_remark, complaints_history_users_id, complaints_history_status, complaints_history_attended_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      newComplainId.insertId.toString(),
      'Complaint Assign to Officer',
      'System',
      msg_body,
      212023,
      1,
      formattedDate,
    ]
  )

  // Insert into complaints_escalation
  await conn.query(
    'INSERT INTO complaints_escalation (escalation_officer_id, escalation_gang_id, escalation_time, escalation_complaint_id, escalation_officer_type) VALUES (?, ?, ?, ?, ?)',
    [
      officerId.toString(),
      gangId,
      tat,
      newComplainId.insertId.toString(),
      officerType,
    ]
  )

  // Insert into complaints_question
  await conn.query(
    'INSERT INTO complaints_question (complaint_id, question_id, question_option_id, agent_id) VALUES (?, ?, ?, ?)',
    [newComplainId.insertId.toString(), 333, data.formData.sub, 212023]
  )

  // Handle child questions
  const child = Object.keys(data.formData.child).length
  if (child > 0) {
    for (const key in data.formData.child) {
      if (Object.prototype.hasOwnProperty.call(data.formData.child, key)) {
        const value = data.formData.child[key]
        await conn.query(
          'INSERT INTO complaints_question (complaint_id, question_id, question_option_id, agent_id) VALUES (?, ?, ?, ?)',
          [newComplainId.insertId.toString(), key, value, 212023]
        )
      }
    }
  }

  // Insert into public_report
  await conn.query(
    'INSERT INTO public_report (p_id_cnt, p_type, p_services, p_option) VALUES (?, ?, ?, ?)',
    [1, 2, 2, 0]
  )

  return {
    response: true,
    code: 200,
    complaint_id: newComplainId.insertId.toString(),
    message:
      'Complaint Register Successfully Complaint Id(#' +
      newComplainId.insertId.toString() +
      ')',
  }
}

// export const SaveCompComplaint_m = async (data) => {
//   let conn
//   try {
//     console.log('data', data)
//     conn = await pool.getConnection()
//     const [res] = await conn.query(
//       'select complaints_id from complaints where complaints_current_status IN (1,5) and complaints_main_category= ' +
//         data.formData.category +
//         ' and complaints_consumer_mobile=' +
//         data.formData.conn_mob +
//         ''
//     )
//     console.log('res', res.length)
//     if (res.length == 0) {
//       const [subcat_det] = await conn.query(
//         'Select * from category_sub where category_sub_id= ' +
//           data.formData.subcategory +
//           ''
//       )
//       console.log('subcat_det', subcat_det)
//       if (data.formData.urban_rural == 1) {
//         var complaints_dc = data.formData.dc_id
//         var region_id = data.formData.region_id
//         var circle_id = data.formData.circle_id
//         var division_id = data.formData.division_id
//         var sub_division_id = data.formData.sub_division_id
//         var foc_center_id = data.formData.foc_center_id
//         var gang_list = await conn.query(
//           'SELECT gang_id FROM `gang` LEFT JOIN gang_lineman ON gang.gang_id=lineman_gang_id WHERE gang.gang_id=?',
//           [data.formData.foc_center_id]
//         )
//         if (gang_list.length > 0) {
//           var complaints_assign_gang_id = gang_list[0].gang_id
//         } else {
//           var complaints_assign_gang_id = 0
//         }

//         //
//         if (subcat_det[0].category_sub_level1_urban == 8) {
//           var officer_id = 0
//           var officer_type = 8
//           var tat = subcat_det[0].category_sub_level1_urban_time
//           var gang_id = complaints_assign_gang_id
//         } else if (subcat_det[0].category_sub_level1_urban == 7) {
//           var jecount = await conn.query(
//             'SELECT users_id FROM `users` where users_type= ? and users_distributed_center_id = ?',
//             [subcat_det[0].category_sub_level1_urban, complaints_dc]
//           )
//           if (jecount.length > 0) {
//             var mcat = data.formData.category
//             var locgr = await conn.query(
//               'SELECT consumer_gr_no,consumer_loc_cd FROM `consumer`  left join locations_master on loc_id=consumer_location_id where loc_colony_id=?  and consumer_gr_no!="" limit 1',
//               [data.formData.complaints_colony]
//             )

//             var category_officer = await conn.query(
//               'SELECT users_id FROM `users` where users_type = ? and users_distributed_center_id = ? and users_category LIKE ?',
//               [subcat_det[0].category_sub_level1_urban, complaints_dc, mcat]
//             )
//             if (category_officer && category_officer.length > 0) {
//               var officer_id = category_officer[0].users_id
//             } else if (locgr && locgr.length > 0) {
//               if (
//                 locgr[0].consumer_gr_no != '' ||
//                 locgr[0].consumer_gr_no != 0
//               ) {
//                 var gr_code = locgr[0].consumer_gr_no
//                 var officer_id = await conn.query(
//                   'SELECT users_id FROM `users` where users_type = ? and users_distributed_center_id = ? and users_group LIKE ?',
//                   [
//                     subcat_det[0].category_sub_level1_urban,
//                     complaints_dc,
//                     locgr[0].consumer_gr_no,
//                   ]
//                 )
//               } else if (
//                 locgr[0].consumer_loc_cd != '' &&
//                 locgr[0].consumer_loc_cd != '0'
//               ) {
//                 var loc_code = locgr[0].consumer_loc_cd
//                 var officer_id = await conn.query(
//                   'SELECT users_id FROM `users` where users_type = ? and users_distributed_center_id = ? and users_loc LIKE ?',
//                   [
//                     subcat_det[0].category_sub_level1_urban,
//                     complaints_dc,
//                     locgr[0].consumer_loc_cd,
//                   ]
//                 )
//               }
//             } else {
//               var officer_id = await conn.query(
//                 'SELECT users_id FROM `users` where users_type = ? and users_distributed_center_id = ? and users_category != 17',
//                 [subcat_det[0].category_sub_level1_urban, complaints_dc]
//               )
//             }
//           } else {
//             var officer_id = await conn.query(
//               'SELECT users_id FROM `users` where users_type = ? and users_distributed_center_id = ?',
//               [subcat_det[0].category_sub_level1_urban, complaints_dc]
//             )
//           }

//           var gang_id = 0
//           var tat = subcat_det[0].category_sub_level1_urban_time
//           var officer_type = 7
//         } else if (subcat_det[0].category_sub_level1_urban == 6) {
//           var aecount = await conn.query(
//             'SELECT users_id FROM `users` where users_type= ? and users_sub_division_id = ?',
//             [subcat_det[0].category_sub_level1_urban, sub_division_id]
//           )
//           if (aecount.length > 1) {
//             var mcat = data.formData.category
//             var locgr = await conn.query(
//               'SELECT consumer_gr_no,consumer_loc_cd FROM `consumer`  left join locations_master on loc_id=consumer_location_id where loc_colony_id=?  and consumer_gr_no!="" limit 1',
//               [data.formData.complaints_colony]
//             )

//             var category_officer = await conn.query(
//               'SELECT users_id FROM `users` where users_type = ? and users_sub_division_id = ? and users_category LIKE ?',
//               [subcat_det[0].category_sub_level1_urban, sub_division_id, mcat]
//             )
//             if (category_officer && category_officer.length > 0) {
//               var officer_id = category_officer[0].users_id
//             } else if (
//               locgr[0].consumer_gr_no != '' &&
//               locgr[0].consumer_gr_no != '0'
//             ) {
//               var gr_code = locgr[0].consumer_gr_no
//               var officer_id = await conn.query(
//                 'SELECT users_id FROM `users` where users_type = ? and users_sub_division_id = ? and users_group LIKE ?',
//                 [
//                   subcat_det[0].category_sub_level1_urban,
//                   sub_division_id,
//                   locgr[0].consumer_gr_no,
//                 ]
//               )
//             } else if (
//               locgr[0].consumer_loc_cd != '' &&
//               locgr[0].consumer_loc_cd != '0'
//             ) {
//               var loc_code = locgr[0].consumer_loc_cd
//               var officer_id = await conn.query(
//                 'SELECT users_id FROM `users` where users_type = ? and users_sub_division_id = ? and users_loc LIKE ?',
//                 [
//                   subcat_det[0].category_sub_level1_urban,
//                   sub_division_id,
//                   locgr[0].consumer_loc_cd,
//                 ]
//               )
//             } else {
//               var officer_id = await conn.query(
//                 'SELECT users_id FROM `users` where users_type = ? and users_sub_division_id = ? and users_category != 17',
//                 [subcat_det[0].category_sub_level1_urban, sub_division_id]
//               )
//             }
//           } else {
//             var officer_id = await conn.query(
//               'SELECT users_id FROM `users` where users_type = ? and users_sub_division_id = ?',
//               [subcat_det[0].category_sub_level1_urban, sub_division_id]
//             )
//           }
//           var gang_id = 0
//           var officer_type = 6
//           var tat = subcat_det[0].category_sub_level1_urban_time
//         } else if (subcat_det[0].category_sub_level1_urban == 5) {
//           var officer_id = await conn.query(
//             'SELECT users_id FROM `users` where users_type = ? and users_division_id = ?',
//             [subcat_det[0].category_sub_level1_urban, division_id]
//           )
//           var gang_id = 0
//           var officer_type = 5
//           var tat = subcat_det[0].category_sub_level1_urban_time
//         } else if (subcat_det[0].category_sub_level1_urban == 4) {
//           var officer_id = await conn.query(
//             'SELECT users_id FROM `users` where users_type = ? and users_circle_id = ?',
//             [subcat_det[0].category_sub_level1_urban, circle_id]
//           )
//           var gang_id = 0
//           var officer_type = 4
//           var tat = subcat_det[0].category_sub_level1_urban_time
//         } else if (subcat_det[0].category_sub_level1_urban == 3) {
//           var officer_id = await conn.query(
//             'SELECT users_id FROM `users` where users_type = ? and users_region_id = ?',
//             [subcat_det[0].category_sub_level1_urban, region_id]
//           )
//           var gang_id = 0
//           var officer_type = 3
//           var tat = subcat_det[0].category_sub_level1_urban_time
//         }
//       } else {
//         var gang_location_list = await conn.query(
//           'SELECT locations_master.loc_dc_id,foc_gang_location_master.fgl_gang_id,locations_master.loc_sub_division_id,foc_masters.foc_id,locations_master.loc_region_id,locations_master.loc_circle_id,locations_master.loc_division_id FROM `locations_master` LEFT JOIN  foc_gang_location_master ON  foc_gang_location_master.fgl_location_id=loc_id LEFT JOIN foc_masters ON foc_masters.foc_id=foc_gang_location_master.fgl_foc_id WHERE loc_gp_id=? and loc_block_id= ? limit 1',
//           [data.formData.complaints_panchayat, data.formData.complaints_block]
//         )

//         if (gang_location_list && gang_location_list.length > 0) {
//           var gang_list = await conn.query(
//             'SELECT gang_id FROM `gang` LEFT JOIN gang_lineman ON gang.gang_id=lineman_gang_id WHERE gang.gang_id=?',
//             [gang_location_list[0].fgl_gang_id]
//           )
//         } else {
//           gang_location_list = null
//         }

//         var complaints_dc = data.formData.dc_id
//         var region_id = data.formData.region_id
//         var circle_id = data.formData.circle_id
//         var division_id = data.formData.division_id
//         var sub_division_id = data.formData.sub_division_id
//         var foc_center_id = data.formData.foc_center_id

//         if (subcat_det[0].category_sub_level1_rural == 8) {
//           var officer_id = 0
//           var officer_type = 8
//           var gang_id = complaints_assign_gang_id
//           var tat = subcat_det[0].category_sub_level1_rural_time
//         } else if (subcat_det[0].category_sub_level1_rural == 7) {
//           var jecount = await conn.query(
//             'SELECT users_id FROM `users` where users_type= ? and users_distributed_center_id = ?',
//             [subcat_det[0].category_sub_level1_rural, complaints_dc]
//           )
//           if (jecount.length > 1) {
//             var mcat = data.formData.category
//             if (mcat == 17 || mcat == 20) {
//               var officer_id = await conn.query(
//                 'SELECT users_id FROM `users` where users_type = ? and users_distributed_center_id = ? and users_category = 17',
//                 [subcat_det[0].category_sub_level1_rural, complaints_dc]
//               )
//               if (!officer_id && officer_id.length == 0) {
//                 var jecount = await conn.query(
//                   'SELECT users_id FROM `users` where users_type= ? and users_distributed_center_id = ?',
//                   [subcat_det[0].category_sub_level1_rural, complaints_dc]
//                 )
//               }
//             } else {
//               var officer_id = await conn.query(
//                 'SELECT users_id FROM `users` where users_type = ? and users_distributed_center_id = ? and users_category != 17',
//                 [subcat_det[0].category_sub_level1_rural, complaints_dc]
//               )
//             }
//           } else {
//             var officer_id = await conn.query(
//               'SELECT users_id FROM `users` where users_type = ? and users_distributed_center_id = ?',
//               [subcat_det[0].category_sub_level1_rural, complaints_dc]
//             )
//           }
//           var gang_id = 0
//           var tat = subcat_det[0].category_sub_level1_rural_time
//           var officer_type = 7
//         } else if (subcat_det[0].category_sub_level1_rural == 6) {
//           var aecount = await conn.query(
//             'SELECT users_id FROM `users` where users_type= ? and users_sub_division_id = ?',
//             [subcat_det[0].category_sub_level1_rural, sub_division_id]
//           )
//           if (aecount.length > 1) {
//             var mcat = data.formData.category
//             if (mcat == 17 || mcat == 20) {
//               var officer_id = await conn.query(
//                 'SELECT users_id FROM `users` where users_type = ? and users_sub_division_id = ? and users_category = 17',
//                 [subcat_det[0].category_sub_level1_rural, sub_division_id]
//               )
//               if (!officer_id && officer_id.length == 0) {
//                 var jecount = await conn.query(
//                   'SELECT users_id FROM `users` where users_type= ? and users_sub_division_id = ?',
//                   [subcat_det[0].category_sub_level1_rural, sub_division_id]
//                 )
//               }
//             } else {
//               var officer_id = await conn.query(
//                 'SELECT users_id FROM `users` where users_type = ? and users_sub_division_id = ? and users_category != 17',
//                 [subcat_det[0].category_sub_level1_rural, sub_division_id]
//               )
//             }
//           } else {
//             var officer_id = await conn.query(
//               'SELECT users_id FROM `users` where users_type = ? and users_sub_division_id = ?',
//               [subcat_det[0].category_sub_level1_rural, sub_division_id]
//             )
//           }
//           var gang_id = 0
//           var officer_type = 6
//           var tat = subcat_det[0].category_sub_level1_rural_time
//         } else if (subcat_det[0].category_sub_level1_rural == 5) {
//           var officer_id = await conn.query(
//             'SELECT users_id FROM `users` where users_type = ? and users_division_id = ?',
//             [subcat_det[0].category_sub_level1_rural, division_id]
//           )
//           var gang_id = 0
//           var officer_type = 5
//           var tat = subcat_det[0].category_sub_level1_rural_time
//         } else if (subcat_det[0].category_sub_level1_rural == 4) {
//           var officer_id = await conn.query(
//             'SELECT users_id FROM `users` where users_type = ? and users_circle_id = ?',
//             [subcat_det[0].category_sub_level1_rural, circle_id]
//           )
//           var gang_id = 0
//           var officer_type = 4
//           var tat = subcat_det[0].category_sub_level1_rural_time
//         } else if (subcat_det[0].category_sub_level1_rural == 3) {
//           var officer_id = await conn.query(
//             'SELECT users_id FROM `users` where users_type = ? and users_region_id = ?',
//             [subcat_det[0].category_sub_level1_rural, region_id]
//           )
//           var gang_id = 0
//           var officer_type = 3
//           var tat = subcat_det[0].category_sub_level1_rural_time
//         }
//       }
//       if (data.formData.urban_rural == 1) {
//         if (locgr.length > 0) {
//           if (locgr[0].consumer_gr_no != '' && locgr[0].consumer_gr_no != '0') {
//             var con_gr_no = locgr[0].consumer_gr_no
//           } else {
//             var con_gr_no = ''
//           }
//           if (
//             locgr[0].consumer_loc_cd != '' &&
//             locgr[0].consumer_loc_cd != '0'
//           ) {
//             var con_loc_no = locgr[0].consumer_loc_cd
//           } else {
//             var con_loc_no = ''
//           }
//         }
//       } else {
//         var con_loc_no = ''
//         var con_gr_no = ''
//       }
//       var complaints_number = ''
//       var old_compalints_id = await conn.query(
//         'SELECT complaints_id FROM `complaints` ORDER BY `complaints_id` DESC limit 1'
//       )
//       var complaints_number = old_compalints_id[0].complaints_id.toString() + 1
//       if (data.formData.category == 23) {
//         complaints_number = 'R-' + complaints_number
//       } else {
//         complaints_number = 'C-' + complaints_number
//       }

//       var complaints_urban_rular = data.formData.urban_rural

//       var complaints_consumer_id = await conn.query(
//         'SELECT consumer_id FROM `consumer` where consumer_ivrs = ? ',
//         [data.formData.IVRSNumber]
//       )
//       if (complaints_consumer_id && complaints_consumer_id.length > 0) {
//         consumer_id = complaints_consumer_id[0].consumer_id.toString()
//       } else {
//         consumer_id = 0
//       }
//       const newComplainId = await conn.query(
//         'INSERT INTO `complaints`(`complaints_consumer_id`,`complaints_number`, `complaints_type`, `complaints_severity_level`, `complaints_came_from`, `complaints_consumer_name`, `complaints_consumer_mobile`, `complaints_consumer_gr_no`, `complaints_consumer_loc_no`, `complaints_called_mobile`, `complaints_ivrs`, `complaints_region`, `complaints_circle`, `complaints_division`, `complaints_sub_division`, `complaints_dc`, `complaints_urban_rular`, `complaints_city`, `complaints_colony`, `complaints_area`, `complaints_district`, `complaints_block`, `complaints_panchayat`, `complaints_village`, `complaints_address`, `complaints_landmark`, `complaints_assign_officer_id`, `complaints_assign_officer_id_level1`, `complaints_assign_gang_id`, `complaints_assign_foc_center_id`, `complaints_main_category`, `complaints_sub_category`, `complaints_remark`, `complaints_created_by`) VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
//         [
//           consumer_id,
//           complaints_number,
//           1,
//           'Low',
//           data.formData.complaintThroughUp,
//           data.formData.org_cust_name,
//           data.formData.conn_mob,
//           con_gr_no,
//           con_loc_no,
//           data.formData.conn_mob,
//           data.formData.IVRSNumber,
//           region_id,
//           circle_id,
//           division_id,
//           sub_division_id,
//           complaints_dc,
//           complaints_urban_rular,
//           data.formData.complaints_city,
//           data.formData.complaints_colony,
//           data.formData.complaints_area,
//           data.formData.complaints_district,
//           data.formData.complaints_block,
//           data.formData.complaints_panchayat,
//           data.formData.complaints_village,
//           data.formData.complaints_address,
//           data.formData.complaints_landmark,
//           officer_id[0].users_id.toString(),
//           officer_id[0].users_id.toString(),
//           gang_id,
//           foc_center_id,
//           data.formData.category,
//           data.formData.subcategory,
//           data.formData.remark,
//           212023,
//         ]
//       )
//       var consumer_name = data.formData.name
//       var consumer_mobile = data.formData.mobile
//       var remark = data.formData.description
//       var consumer_address = data.formData.address
//       const currentDate = new Date()
//       const formattedDate = format(currentDate, 'yyyy-MM-dd HH:mm:ss')
//       const complaints_history = await conn.query(
//         'INSERT INTO complaints_history (complaints_history_complaint_id, complaints_history_type,complaints_history_followup_by,complaints_history_remark,complaints_history_users_id,complaints_history_status,complaints_history_attended_date) VALUES (?, ?, ?, ?, ?, ?,?)',
//         [
//           newComplainId.insertId.toString(),
//           'New Complaint Register',
//           'Agent',
//           'New Complaint Register',
//           212023,
//           1,
//           formattedDate,
//         ]
//       )
//       var category_id = data.formData.category
//       var subcategory_name = await conn.query(
//         'SELECT category_sub_name FROM `category_sub` where category_sub_id =?',
//         [data.formData.subcategory]
//       )
//       if (category_id == 17) {
//         var msg_body =
//           'आप के लिए नई शिकायत आई है शिकायत क्रमांक-' +
//           newComplainId.insertId +
//           ' है,Subcategory: ' +
//           subcategory_name[0].category_sub_name +
//           ', उपभोक्ता का नाम- ' +
//           data.formData.name +
//           ' , मोबाइल-' +
//           data.formData.mobile +
//           ', पता-' +
//           data.formData.address +
//           ' धन्यवाद।'
//       } else {
//         var msg_body =
//           'आप के लिए नई शिकायत आई है शिकायत क्रमांक-' +
//           newComplainId.insertId +
//           ' है,Subcategory: ' +
//           subcategory_name[0].category_sub_name +
//           ', उपभोक्ता का नाम- ' +
//           data.formData.name +
//           ' , मोबाइल-' +
//           data.formData.mobile +
//           ', पता-' +
//           data.formData.address +
//           ' धन्यवाद।'
//       }
//       const complaints_history1 = await conn.query(
//         'INSERT INTO complaints_history (complaints_history_complaint_id, complaints_history_type,complaints_history_followup_by,complaints_history_remark,complaints_history_users_id,complaints_history_status,complaints_history_attended_date) VALUES (?,?, ?, ?, ?, ?, ?)',
//         [
//           newComplainId.insertId.toString(),
//           'Complaint Assign to Officer',
//           'System',
//           msg_body,
//           212023,
//           1,
//           formattedDate,
//         ]
//       )
//       // $this->mylibrary->send_sms_to_caller($consumer_mobile, $complaints_number);

//       // $foc_mob = $this->Common_model->getvalue("foc_incharge_mobile","foc_masters",array("foc_id="=>$this->input->post('complaints_assign_foc_center_id')));
//       // $officer_mob = $this->Common_model->getvalue("users_mobile","users",array("users_id="=>$officer_id));
//       // $gang_mob = $this->Common_model->getvalue("gang_number","gang",array("gang_id="=>$gang_id));

//       // if($gang_id!=0 && !empty($foc_mob))
//       // $this->mylibrary->send_sms_to_foc($foc_mob, $complaints_number,urlencode($msg_body));

//       // if(!empty($officer_mob) && $officer_id!=0 )
//       // $this->mylibrary->send_sms_to_foc($officer_mob, $complaints_number,urlencode($msg_body));

//       // if($gang_id!=0 && !empty($gang_mob))
//       // $this->mylibrary->send_sms_to_foc($gang_mob, $complaints_number,urlencode($msg_body));

//       const escalation = await conn.query(
//         'INSERT INTO complaints_escalation (escalation_officer_id,escalation_gang_id, escalation_time,escalation_complaint_id,escalation_officer_type) VALUES (?, ?, ?, ?, ?)',
//         [
//           officer_id[0].users_id.toString(),
//           gang_id,
//           tat,
//           newComplainId.insertId.toString(),
//           officer_type,
//         ]
//       )
//       // var sub = Object.keys(data.formData.sub).length
//       var child = Object.keys(data.formData.child).length
//       // var subchild = Object.keys(data.formData.subchild).length
//       // if (sub > 0) {
//       //   for (const key in data.formData.sub) {
//       //     if (Object.prototype.hasOwnProperty.call(data.formData.sub, key)) {
//       //       const value = data.formData.sub[key]
//       //       //console.log(key + '--- ' + value)
//       //       const complaints_question = await conn.query(
//       //         'INSERT INTO complaints_question (complaint_id,question_id,question_option_id,agent_id) VALUES (?, ?, ?, ?)',
//       //         [newComplainId.insertId.toString(), key, value, 212023]
//       //       )
//       //     }
//       //   }
//       // }
//       const complaints_question = await conn.query(
//         'INSERT INTO complaints_question (complaint_id,question_id,question_option_id,agent_id) VALUES (?, ?, ?, ?)',
//         [newComplainId.insertId.toString(), 333, data.formData.sub, 212023]
//       )
//       if (child > 0) {
//         for (const key in data.formData.child) {
//           if (Object.prototype.hasOwnProperty.call(data.formData.child, key)) {
//             const value = data.formData.child[key]
//             //console.log(key + '--- ' + value)
//             const complaints_question = await conn.query(
//               'INSERT INTO complaints_question (complaint_id,question_id,question_option_id,agent_id) VALUES (?, ?, ?, ?)',
//               [newComplainId.insertId.toString(), key, value, 212023]
//             )
//           }
//         }
//       }
//       // if (subchild > 0) {
//       //   for (const key in data.formData.subchild) {
//       //     if (
//       //       Object.prototype.hasOwnProperty.call(data.formData.subchild, key)
//       //     ) {
//       //       const value = data.formData.subchild[key]
//       //       //console.log(key + '--- ' + value)
//       //       const complaints_question = await conn.query(
//       //         'INSERT INTO complaints_question (complaint_id,question_id,question_option_id,agent_id) VALUES (?, ?, ?, ?)',
//       //         [newComplainId.insertId.toString(), key, value, 212023]
//       //       )
//       //     }
//       //   }
//       // }

//       const public_report = await conn.query(
//         'INSERT INTO public_report (p_id_cnt,p_type,p_services,p_option) VALUES (?, ?, ?,?)',
//         [1, 2, 2, 0]
//       )
//       return {
//         response: true,
//         code: 200,
//         complaint_id: newComplainId.insertId.toString(),
//         message:
//           'Complaint Register Successfully Complaint Id(#' +
//           newComplainId.insertId.toString() +
//           ')',
//       }
//     } else {
//       return { response: false, code: 200, message: 'Complaint Already Exists' }
//     }
//   } finally {
//     if (conn) conn.release() //end to pool
//   }
// }
export const SaveCompDtrComplaint_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()

    const res = await conn.query(
      'SELECT dtr_complain_id FROM dtr_complaints WHERE dtr_complain_status IN (1,7) AND dtr_complain_main_category= ? AND dtr_complain_consumer_id=?',
      [
        data.formData.dtr_complain_main_category,
        data.formData.dtr_complain_consumer_id,
      ]
    )

    if (res.length === 0) {
      const subcat_det = await conn.query(
        'SELECT * FROM category_sub WHERE category_sub_id= ?',
        [data.formData.dtr_complain_category_sub]
      )

      let officer_id = []
      let officer_type
      let tat

      if (data.formData.dtr_complain_location_type === 1) {
        tat = subcat_det[0].category_sub_level1_urban_time
        officer_type = subcat_det[0].category_sub_level1_urban
      } else {
        tat = subcat_det[0].category_sub_level1_rural_time
        officer_type = subcat_det[0].category_sub_level1_rural
      }

      if (officer_type === 7) {
        officer_id = await conn.query(
          'SELECT users_id FROM users WHERE users_type= ? AND users_distributed_center_id= ?',
          [officer_type, data.formData.dtr_complain_dc_id]
        )
      } else if (officer_type === 6) {
        officer_id = await conn.query(
          'SELECT users_id FROM users WHERE users_type= ? AND users_sub_division_id= ?',
          [officer_type, data.formData.dtr_complain_sub_division_id]
        )
      } else if (officer_type === 5) {
        officer_id = await conn.query(
          'SELECT users_id FROM users WHERE users_type= ? AND users_division_id= ?',
          [officer_type, data.formData.dtr_complain_division_id]
        )
      } else if (officer_type === 4) {
        officer_id = await conn.query(
          'SELECT users_id FROM users WHERE users_type= ? AND users_circle_id= ?',
          [officer_type, data.formData.dtr_complain_circle_id]
        )
      } else if (officer_type === 3) {
        officer_id = await conn.query(
          'SELECT users_id FROM users WHERE users_type= ? AND users_region_id= ?',
          [officer_type, data.formData.dtr_complain_region_id]
        )
      }

      if (officer_id.length > 0) {
        const old_complaints_id = await conn.query(
          'SELECT dtr_complain_id FROM dtr_complaints ORDER BY dtr_complain_id DESC LIMIT 1'
        )

        let complaints_number = (
          old_complaints_id[0].dtr_complain_id + 1
        ).toString()
        complaints_number =
          data.formData.dtr_complain_main_category === 23
            ? 'R-' + complaints_number
            : 'C-' + complaints_number

        const newComplainId = await conn.query(
          `
          INSERT INTO dtr_complaints (
            dtr_complain_number, dtr_complain_main_category, dtr_complain_category_sub, dtr_complain_consumer_id,
            dtr_complain_consumer_name, dtr_complain_consumer_gr_no, dtr_complain_consumer_loc_no, dtr_complain_mobile,
            dtr_complain_alt_mobile, dtr_complain_ivrs, dtr_complain_officer_id, dtr_complain_region_id,
            dtr_complain_circle_id, dtr_complain_division_id, dtr_complain_sub_division_id, dtr_complain_dc_id,
            dtr_complain_feeder_id, dtr_complain_location_type, dtr_complain_district, dtr_complain_city,
            dtr_complain_area, dtr_complaints_reminders, dtr_complain_colony, dtr_complain_block,
            dtr_complain_gram_panchyat, dtr_complain_village, dtr_complain_address, dtr_complain_landmark,
            dtr_complain_failure_date, dtr_complain_capacity, dtr_complain_make, dtr_complain_makers_serial_number,
            dtr_complain_dtr_name, dtr_complain_dtr_location, dtr_complain_id_code, dtr_complain_new_rep,
            dtr_complain_wgp_bgp, dtr_complain_megger_value, dtr_complain_earth_resistance, dtr_complain_oil_level,
            dtr_complain_installed_on, dtr_complain_no_of_consumer, dtr_complain_total_arear, dtr_complain_paid_amount,
            dtr_complain_la_provided, dtr_complain_breather_provided, dtr_complain_dbox_provided, dtr_complain_cause_of_failure,
            dtr_complain_eligibility, dtr_complain_remarks, dtr_complain_attachment, dtr_complain_assign_officer_id,
            dtr_complain_writen_by, dtr_complain_status, dtr_complain_ae_inspection_date, dtr_complain_ae_dtr_action,
            dtr_complain_ae_remark, dtr_complain_new_capacity, dtr_complain_new_maker, dtr_complain_new_maker_serial,
            dtr_complain_new_id_code, dtr_complain_new_mfg_year, dtr_complain_new_dtr_type, complaints_severity_level,
            complaints_came_from, complaints_came_from_details, wrong_dc, dc_change_details, dtr_loc_id, dtr_flag
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
          `,
          [
            complaints_number,
            data.formData.dtr_complain_main_category,
            data.formData.dtr_complain_category_sub,
            data.formData.dtr_complain_consumer_id,
            data.formData.org_cust_name,
            '',
            0,
            data.formData.conn_mob,
            data.formData.dtr_complain_alt_mobile,
            data.formData.IVRSNumber,
            officer_id[0].users_id.toString(),
            data.formData.dtr_complain_region_id,
            data.formData.dtr_complain_circle_id,
            data.formData.dtr_complain_division_id,
            data.formData.dtr_complain_sub_division_id,
            data.formData.dtr_complain_dc_id,
            0,
            data.formData.dtr_complain_location_type,
            data.formData.dtr_complain_district,
            data.formData.dtr_complain_city,
            data.formData.dtr_complain_area,
            data.formData.dtr_complaints_reminders,
            data.formData.dtr_complain_colony,
            data.formData.dtr_complain_block,
            data.formData.dtr_complain_gram_panchyat,
            data.formData.dtr_complain_village,
            data.formData.dtr_complain_address,
            data.formData.dtr_complain_landmark,
            '',
            '',
            '',
            '',
            data.formData.dtr_complain_dtr_name,
            data.formData.dtr_complain_dtr_location,
            '',
            0,
            '',
            '',
            '',
            '',
            '',
            '',
            0,
            0,
            0,
            '',
            0,
            data.formData.remark,
            '',
            officer_id[0].users_id.toString(),
            0,
            1,
            '',
            0,
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            data.formData.complaints_severity_level,
            data.formData.complaints_came_from,
            '',
            0,
            '',
            0,
            0,
          ]
        )

        if (newComplainId.insertId) {
          await conn.query(
            'INSERT INTO dtr_complaints_escalation (escalation_officer_id, escalation_time, escalation_complaint_id, escalation_officer_type) VALUES (?, ?, ?, ?)',
            [
              officer_id[0].users_id.toString(),
              tat,
              newComplainId.insertId.toString(),
              officer_type,
            ]
          )

          await conn.query(
            'INSERT INTO dtr_complaints_history (complaints_history_complaint_id, complaints_history_type, complaints_history_followup_by, complaints_history_remark, complaints_history_status) VALUES (?, ?, ?, ?, ?)',
            [
              newComplainId.insertId.toString(),
              'New DTR Complaint Register',
              'Agent',
              'New DTR Complaint Register',
              0,
            ]
          )

          const msg_body = `आप के लिए नई शिकायत आई है शिकायत क्रमांक-${newComplainId.insertId.toString()} है, उपभोक्ता का नाम- ${
            data.formData.org_cust_name
          }, मोबाइल नंबर- ${
            data.formData.conn_mob
          } शिकायत के समाधान के लिए निम्न लिंक पर जाएं- http://example.com/complaint/${newComplainId.insertId.toString()}`

          await conn.query(
            'INSERT INTO dtr_complaints_history (complaints_history_complaint_id, complaints_history_type, complaints_history_followup_by, complaints_history_remark, complaints_history_status) VALUES (?, ?, ?, ?, ?)',
            [
              newComplainId.insertId.toString(),
              'New DTR Complaint Register',
              'Agent',
              'New DTR Complaint Register',
              0,
            ]
          )

          return {
            code: 200,
            complaint_id: newComplainId.insertId,
            message: 'Complaint registered successfully',
            response: newComplainId.insertId,
          }
        } else {
          throw new ErrorHandler('Complaint registration failed', 500)
        }
      } else {
        throw new ErrorHandler('No officer found for the complaint', 404)
      }
    } else {
      throw new ErrorHandler('Complaint already exists', 409)
    }
  } catch (error) {
    if (conn) conn.end()
    throw error
  } finally {
    if (conn) conn.end()
  }
}

//Date 31-07-2024
// export const SaveComplaint_m = async (data) => {
//   let conn
//   try {
//     console.log(data.formData)
//     conn = await pool.getConnection()

//     // Check if complaint already exists
//     const existingComplaint = await conn.query(
//       'SELECT complaints_id FROM complaints WHERE complaints_current_status IN (1, 5) AND complaints_main_category = ? AND complaints_consumer_mobile = ?',
//       [data.formData.category, data.formData.mobile]
//     )

//     if (existingComplaint.length > 0) {
//       throw new Error('Complaint already exists.')
//     }

//     // Fetch subcategory details
//     const subcat_det = await conn.query(
//       'SELECT * FROM category_sub WHERE category_sub_id = ?',
//       [data.formData.subcategory]
//     )

//     let locationData,
//       gangList,
//       officerId,
//       tat,
//       gangId = 0,
//       officerType
//     if (data.formData.locationType === 'urban') {
//       locationData = await fetchUrbanLocationData(conn, data)
//       officerId = await determineUrbanOfficerId(
//         conn,
//         data,
//         subcat_det[0],
//         locationData
//       )
//       tat = subcat_det[0].category_sub_level1_urban_time
//       officerType = subcat_det[0].category_sub_level1_urban
//     } else {
//       locationData = await fetchRuralLocationData(conn, data)
//       officerId = await determineRuralOfficerId(
//         conn,
//         data,
//         subcat_det[0],
//         locationData
//       )
//       tat = subcat_det[0].category_sub_level1_rural_time
//       officerType = subcat_det[0].category_sub_level1_rural
//     }

//     const complaintsNumber = await generateComplaintNumber(
//       conn,
//       data.formData.category
//     )
//     const consumerId = await getConsumerId(conn, data.formData.ivrs)

//     // Insert new complaint
//     const newComplaint = await conn.query('INSERT INTO complaints SET ?', {
//       complaints_consumer_id: consumerId,
//       complaints_number: complaintsNumber,
//       complaints_type: 2,
//       complaints_severity_level: 'Low',
//       complaints_came_from: data.formData.complaintThroughUp,
//       complaints_consumer_name: data.formData.name,
//       complaints_consumer_mobile: data.formData.mobile,
//       complaints_consumer_gr_no:
//         data.formData.locationType === 'urban' ? data.formData.grNo : '',
//       complaints_consumer_loc_no:
//         data.formData.locationType === 'urban' ? data.formData.locNo : '',
//       complaints_called_mobile: data.formData.called_mobile,
//       complaints_ivrs: data.formData.ivrs,
//       complaints_region: locationData.regionId,
//       complaints_circle: locationData.circleId,
//       complaints_division: locationData.divisionId,
//       complaints_sub_division: locationData.subDivisionId,
//       complaints_dc: locationData.dcId,
//       complaints_urban_rular: data.formData.locationType === 'urban' ? 1 : 2,
//       complaints_city: data.formData.city,
//       complaints_colony: data.formData.colony,
//       complaints_area: data.formData.area,
//       complaints_district: data.formData.district,
//       complaints_block: data.formData.block,
//       complaints_panchayat: data.formData.gramPanchayat,
//       complaints_village: data.formData.village,
//       complaints_address: data.formData.address,
//       complaints_landmark: data.formData.landmark,
//       complaints_assign_officer_id: officerId,
//       complaints_assign_officer_id_level1: officerId,
//       complaints_assign_gang_id: gangId,
//       complaints_assign_foc_center_id: locationData.focCenterId,
//       complaints_main_category: data.formData.category,
//       complaints_sub_category: data.formData.subcategory,
//       complaints_remark: data.formData.description,
//       complaints_created_by: 212023,
//     })

//     // Insert complaint history
//     const currentDate = new Date()
//     const formattedDate = format(currentDate, 'yyyy-MM-dd HH:mm:ss')
//     await conn.query('INSERT INTO complaints_history SET ?', {
//       complaints_history_complaint_id: newComplaint.insertId,
//       complaints_history_type: 'New Complaint Register',
//       complaints_history_followup_by: 'Agent',
//       complaints_history_remark: 'New Complaint Register',
//       complaints_history_users_id: 212023,
//       complaints_history_status: 1,
//       complaints_history_attended_date: formattedDate,
//     })

//     // Insert escalation record
//     await conn.query('INSERT INTO complaints_escalation SET ?', {
//       escalation_officer_id: officerId,
//       escalation_gang_id: gangId,
//       escalation_time: tat,
//       escalation_complaint_id: newComplaint.insertId,
//       escalation_officer_type: officerType,
//     })

//     // Insert complaint questions
//     await insertComplaintQuestions(conn, newComplaint.insertId, data.formData)

//     // Send SMS notifications (commented out code to be implemented later)
//     // await sendSmsNotifications(newComplaint.insertId, data.formData);
//   } catch (error) {
//     console.error('Error saving complaint:', error)
//     throw error
//   } finally {
//     if (conn) conn.release()
//   }
// }

// Helper functions

// async function fetchUrbanLocationData(conn, data) {
//   const result = await conn.query(
//     'SELECT loc_dc_id, loc_sub_division_id, loc_region_id, loc_circle_id, loc_division_id, foc_id FROM locations_master LEFT JOIN foc_gang_location_master ON foc_gang_location_master.fgl_location_id = loc_id LEFT JOIN foc_masters ON foc_masters.foc_id = foc_gang_location_master.fgl_foc_id WHERE loc_area_id = ? LIMIT 1',
//     [data.formData.area]
//   )
//   return result[0] || {}
// }

// async function determineUrbanOfficerId(conn, data, subcatDet, locationData) {
//   // Logic to determine the appropriate officer ID based on urban location
//   // Similar to the original code, but refactored for clarity
// }

// async function fetchRuralLocationData(conn, data) {
//   const result = await conn.query(
//     'SELECT loc_dc_id, loc_sub_division_id, loc_region_id, loc_circle_id, loc_division_id, foc_id FROM locations_master LEFT JOIN foc_gang_location_master ON foc_gang_location_master.fgl_location_id = loc_id LEFT JOIN foc_masters ON foc_masters.foc_id = foc_gang_location_master.fgl_foc_id WHERE loc_gp_id = ? AND loc_block_id = ? LIMIT 1',
//     [data.formData.gramPanchayat, data.formData.block]
//   )
//   return result[0] || {}
// }

// async function determineRuralOfficerId(conn, data, subcatDet, locationData) {
//   // Logic to determine the appropriate officer ID based on rural location
//   // Similar to the original code, but refactored for clarity
// }

// async function generateComplaintNumber(conn, category) {
//   let lastComplaint = await conn.query(
//     'SELECT complaints_id FROM complaints ORDER BY complaints_id DESC LIMIT 1'
//   )

//   const complaintNumber = (lastComplaint[0]?.complaints_id || 0) + 1
//   return category === 23
//     ? `R-${complaintNumber.toString()}`
//     : `C-${complaintNumber.toString()}`
// }

// async function getConsumerId(conn, ivrs) {
//   const [consumer] = await conn.query(
//     'SELECT consumer_id FROM consumer WHERE consumer_ivrs = ?',
//     [ivrs]
//   )
//   return consumer?.consumer_id || 0
// }

// async function insertComplaintQuestions(conn, complaintId, formData) {
//   for (const [key, value] of Object.entries(formData.sub || {})) {
//     await conn.query(
//       'INSERT INTO complaints_question (complaint_id, question_id, question_option_id, agent_id) VALUES (?, ?, ?, ?)',
//       [complaintId, key, value, 212023]
//     )
//   }

//   for (const [key, value] of Object.entries(formData.child || {})) {
//     await conn.query(
//       'INSERT INTO complaints_question (complaint_id, question_id, question_option_id, agent_id) VALUES (?, ?, ?, ?)',
//       [complaintId, key, value, 212023]
//     )
//   }

//   for (const [key, value] of Object.entries(formData.subchild || {})) {
//     await conn.query(
//       'INSERT INTO complaints_question (complaint_id, question_id, question_option_id, agent_id) VALUES (?, ?, ?, ?)',
//       [complaintId, key, value, 212023]
//     )
//   }
// }

export async function SaveComplaint_m(data) {
  let conn

  try {
    conn = await pool.getConnection()

    const existingComplaintQuery = `
      SELECT complaints_id 
      FROM complaints 
      WHERE complaints_current_status IN (1, 5) 
        AND complaints_main_category = ? 
        AND complaints_consumer_mobile = ?
    `
    const res = await conn.query(existingComplaintQuery, [
      data.formData.category,
      data.formData.mobile,
    ])

    if (res.length === 0) {
      const subCategoryQuery = `
        SELECT * 
        FROM category_sub 
        WHERE category_sub_id = ?
      `
      const subcat_det = await conn.query(subCategoryQuery, [
        data.formData.subcategory,
      ])

      let locationDetails = await getLocationDetails(conn, data, subcat_det)
      // console.log('locationDetails', locationDetails)
      let {
        complaints_dc,
        region_id,
        circle_id,
        division_id,
        sub_division_id,
        foc_center_id,
        officer_id,
        officerType,
        tat,
        gang_id,
      } = locationDetails

      let complaints_number = await generateComplaintNumber(conn, data)
      let complaints_urban_rular =
        data.formData.locationType === 'urban' ? 1 : 2
      let complaints_consumer_id = await getConsumerId(conn, data.formData.ivrs)
      let user_id = 212023

      const currentDate = new Date()
      const formattedDate = format(currentDate, 'yyyy-MM-dd HH:mm:ss')

      const newComplainId = await insertComplaint(conn, data, {
        complaints_number,
        complaints_urban_rular,
        complaints_consumer_id,
        region_id,
        circle_id,
        division_id,
        sub_division_id,
        complaints_dc,
        foc_center_id,
        officerType,
        officer_id,
        gang_id,
        formattedDate,
        user_id,
      })
      // console.log('newComplainId', newComplainId)

      await insertComplaintHistory(
        conn,
        Number(newComplainId),
        formattedDate,
        user_id
      )

      let subcategory_name = await conn.query(
        'SELECT category_sub_name FROM `category_sub` where category_sub_id =?',
        [data.formData.subcategory]
      )
      if (data.formData.category == 17) {
        var msg_body =
          'आप के लिए नई शिकायत आई है शिकायत क्रमांक-' +
          Number(newComplainId) +
          ' है,Subcategory: ' +
          subcategory_name[0].category_sub_name +
          ', उपभोक्ता का नाम- ' +
          data.formData.name +
          ' , मोबाइल-' +
          data.formData.mobile +
          ', पता-' +
          data.formData.address +
          ' धन्यवाद।'
      } else {
        var msg_body =
          'आप के लिए नई शिकायत आई है शिकायत क्रमांक-' +
          newComplainId.insertId +
          ' है,Subcategory: ' +
          subcategory_name[0].category_sub_name +
          ', उपभोक्ता का नाम- ' +
          data.formData.name +
          ' , मोबाइल-' +
          data.formData.mobile +
          ', पता-' +
          data.formData.address +
          ' धन्यवाद।'
      }
      await insertComplaintHistoryByOff(
        conn,
        Number(newComplainId),
        msg_body,
        user_id,
        formattedDate
      )

      await insertEscalation(
        conn,
        Number(newComplainId),
        officer_id,
        gang_id,
        officerType,
        tat,
        formattedDate
      )

      var sub = Object.keys(data.formData.sub).length
      var child = Object.keys(data.formData.child).length
      var subchild = Object.keys(data.formData.subchild).length

      if (sub > 0) {
        for (const key in data.formData.sub) {
          if (Object.prototype.hasOwnProperty.call(data.formData.sub, key)) {
            const value = data.formData.sub[key]
            await conn.query(
              'INSERT INTO complaints_question (complaint_id, question_id, question_option_id, agent_id) VALUES (?, ?, ?, ?)',
              [Number(newComplainId), key, value, 212023]
            )
          }
        }
      }
      if (child > 0) {
        for (const key in data.formData.child) {
          if (Object.prototype.hasOwnProperty.call(data.formData.child, key)) {
            const value = data.formData.child[key]
            await conn.query(
              'INSERT INTO complaints_question (complaint_id, question_id, question_option_id, agent_id) VALUES (?, ?, ?, ?)',
              [Number(newComplainId), key, value, 212023]
            )
          }
        }
      }
      if (subchild > 0) {
        for (const key in data.formData.subchild) {
          if (
            Object.prototype.hasOwnProperty.call(data.formData.subchild, key)
          ) {
            const value = data.formData.subchild[key]
            await conn.query(
              'INSERT INTO complaints_question (complaint_id, question_id, question_option_id, agent_id) VALUES (?, ?, ?, ?)',
              [Number(newComplainId), key, value, 212023]
            )
          }
        }
      }

      await conn.query(
        'INSERT INTO public_report (p_id_cnt, p_type, p_services, p_option) VALUES (?, ?, ?, ?)',
        [1, 2, 2, 0]
      )

      return {
        code: 200,
        complaint_id: Number(newComplainId),
        message:
          'Complaint Register Successfully Complaint Id(#' +
          Number(newComplainId) +
          ')',
      }
    } else {
      throw new ErrorHandler(
        'Complaint already exists with the same details',
        400
      )
    }
  } catch (error) {
    console.error(error)
    throw new ErrorHandler('Failed to save complaint', 500)
  } finally {
    if (conn) conn.release()
  }
}

async function getLocationDetails(conn, data, subcat_det) {
  if (data.formData.locationType === 'urban') {
    const focQuery = `
      SELECT loc_dc_id, fgl_gang_id, loc_sub_division_id, foc_id, loc_region_id, 
             loc_circle_id, loc_division_id 
      FROM locations_master 
      LEFT JOIN foc_gang_location_master ON foc_gang_location_master.fgl_location_id = loc_id 
      LEFT JOIN foc_masters ON foc_masters.foc_id = foc_gang_location_master.fgl_foc_id 
      WHERE loc_area_id = ? 
      LIMIT 1
    `
    const foc_list = await conn.query(focQuery, [data.formData.area])

    if (foc_list && foc_list.length > 0) {
      const {
        loc_dc_id: complaints_dc,
        loc_region_id: region_id,
        loc_circle_id: circle_id,
        loc_division_id: division_id,
        loc_sub_division_id: sub_division_id,
        foc_id: foc_center_id,
        fgl_gang_id,
      } = foc_list[0]

      const gangQuery = `
        SELECT gang_id 
        FROM gang 
        LEFT JOIN gang_lineman ON gang.gang_id = lineman_gang_id 
        WHERE gang.gang_id = ?
      `
      const gang_list = await conn.query(gangQuery, [fgl_gang_id])
      const complaints_assign_gang_id = gang_list[0].gang_id

      return await getOfficerDetails(
        conn,
        subcat_det,
        complaints_dc,
        sub_division_id,
        region_id,
        circle_id,
        division_id,
        complaints_assign_gang_id,
        foc_center_id,
        data
      )
    } else {
      throw new ErrorHandler('No FOC details found for urban location', 404)
    }
  } else {
    const gangLocationQuery = `
      SELECT loc_dc_id, fgl_gang_id, loc_sub_division_id, foc_id, loc_region_id, 
             loc_circle_id, loc_division_id 
      FROM locations_master 
      LEFT JOIN foc_gang_location_master ON foc_gang_location_master.fgl_location_id = loc_id 
      LEFT JOIN foc_masters ON foc_masters.foc_id = foc_gang_location_master.fgl_foc_id 
      WHERE loc_gp_id = ? AND loc_block_id = ? 
      LIMIT 1
    `
    const gang_location_list = await conn.query(gangLocationQuery, [
      data.formData.gramPanchayat,
      data.formData.block,
    ])

    if (gang_location_list && gang_location_list.length > 0) {
      const {
        loc_dc_id: complaints_dc,
        loc_region_id: region_id,
        loc_circle_id: circle_id,
        loc_division_id: division_id,
        loc_sub_division_id: sub_division_id,
        foc_id: foc_center_id,
        fgl_gang_id,
      } = gang_location_list[0]

      const gangQuery = `
        SELECT gang_id 
        FROM gang 
        LEFT JOIN gang_lineman ON gang.gang_id = lineman_gang_id 
        WHERE gang.gang_id = ?
      `
      const gang_list = await conn.query(gangQuery, [fgl_gang_id])

      return await getOfficerDetails(
        conn,
        subcat_det,
        complaints_dc,
        sub_division_id,
        region_id,
        circle_id,
        division_id,
        gang_list[0].gang_id,
        foc_center_id,
        data
      )
    } else {
      throw new ErrorHandler('No gang details found for rural location', 404)
    }
  }
}

async function getOfficerDetails(
  conn,
  subcat_det,
  complaints_dc,
  sub_division_id,
  region_id,
  circle_id,
  division_id,
  complaints_assign_gang_id,
  foc_center_id,
  data
) {
  const officerTypeMap = {
    8: 'category_sub_level1_urban',
    7: 'category_sub_level1_urban',
    6: 'category_sub_level1_urban',
    5: 'category_sub_level1_urban',
    4: 'category_sub_level1_urban',
    3: 'category_sub_level1_urban',
    // add other mappings if necessary
  }

  const officerType =
    subcat_det[0][officerTypeMap[subcat_det[0].category_sub_level1_urban]]
  // console.log(officerType)
  let officer_id,
    gang_id = 0,
    tat = subcat_det[0].category_sub_level1_urban_time

  if (officerType === 8) {
    officer_id = 0
    gang_id = complaints_assign_gang_id
  } else if (officerType === 7) {
    // similar logic for other officer types with necessary adjustments
    officer_id = await getJEOfficer(conn, complaints_dc, data.formData.category)
    console.log('officer_id', officer_id)
  } else if (officerType === 6) {
    officer_id = await getAEOOfficer(
      conn,
      sub_division_id,
      data.formData.category
    )
  } else if (officerType === 5) {
    officer_id = await getDivisionOfficer(conn, division_id)
  } else if (officerType === 4) {
    officer_id = await getCircleOfficer(conn, circle_id)
  } else if (officerType === 3) {
    officer_id = await getRegionOfficer(conn, region_id)
  }

  return {
    complaints_dc,
    region_id,
    circle_id,
    division_id,
    sub_division_id,
    foc_center_id,
    officer_id,
    officerType,
    tat,
    gang_id,
  }
}

async function getJEOfficer(conn, complaints_dc, category) {
  const jeQuery = `
    SELECT users_id 
    FROM users 
    WHERE users_type = 7 
      AND users_distributed_center_id = ? 
      AND users_category LIKE ?
  `
  const officers = await conn.query(jeQuery, [complaints_dc, category])
  // console.log("officers",officers)
  if (officers.length > 0) {
    return officers[0].users_id
  } else {
    // fallback logic if no officers found
    return await getDefaultOfficer(conn, complaints_dc, 7)
  }
}

async function getAEOOfficer(conn, sub_division_id, category) {
  const aeoQuery = `
    SELECT users_id 
    FROM users 
    WHERE users_type = 6 
      AND users_sub_division_id = ? 
      AND users_category LIKE ?
  `
  const officers = await conn.query(aeoQuery, [sub_division_id, category])

  if (officers.length > 0) {
    return officers[0].users_id
  } else {
    // fallback logic if no officers found
    return await getDefaultOfficer(conn, sub_division_id, 6)
  }
}

async function getDivisionOfficer(conn, division_id) {
  const divisionQuery = `
    SELECT users_id 
    FROM users 
    WHERE users_type = 5 
      AND users_division_id = ?
  `
  const officers = await conn.query(divisionQuery, [division_id])

  return officers.length > 0 ? officers[0].users_id : null
}

async function getCircleOfficer(conn, circle_id) {
  const circleQuery = `
    SELECT users_id 
    FROM users 
    WHERE users_type = 4 
      AND users_circle_id = ?
  `
  const officers = await conn.query(circleQuery, [circle_id])

  return officers.length > 0 ? officers[0].users_id : null
}

async function getRegionOfficer(conn, region_id) {
  const regionQuery = `
    SELECT users_id 
    FROM users 
    WHERE users_type = 3 
      AND users_region_id = ?
  `
  const officers = await conn.query(regionQuery, [region_id])

  return officers.length > 0 ? officers[0].users_id : null
}

async function getDefaultOfficer(conn, locationId, userType) {
  const defaultQuery = `
    SELECT users_id 
    FROM users 
    WHERE users_type = ? 
      AND users_distributed_center_id = ?
    LIMIT 1
  `
  const officers = await conn.query(defaultQuery, [userType, locationId])
  // console.log('officers', officers)
  return officers.length > 0 ? Number(officers[0].users_id) : null
}

async function generateComplaintNumber(conn, data) {
  const complaints_number_prefix = `${new Date()
    .getFullYear()
    .toString()
    .slice(2, 4)}${('0' + (new Date().getMonth() + 1)).slice(-2)}${(
    '0' + new Date().getDate()
  ).slice(-2)}`
  const complaints_number_increment = `${Math.floor(
    Math.random() * (99999 - 10000 + 1) + 10000
  )}`

  return `${complaints_number_prefix}${complaints_number_increment}`
}

async function getConsumerId(conn, ivrs) {
  const consumerQuery = `
    SELECT consumer_id 
    FROM consumer 
    WHERE consumer_ivrs = ?
  `
  const [consumer] = await conn.query(consumerQuery, [ivrs])

  return consumer.length > 0 ? consumer[0].consumer_id : 0
}

async function insertComplaint(
  conn,
  data,
  {
    complaints_number,
    complaints_urban_rular,
    complaints_consumer_id,
    region_id,
    circle_id,
    division_id,
    sub_division_id,
    complaints_dc,
    foc_center_id,
    officerType,
    officer_id,
    gang_id,
    formattedDate,
    user_id,
  }
) {
  const insertComplaintQuery = `
    INSERT INTO complaints (
        complaints_consumer_id,complaints_number, complaints_type, complaints_severity_level, 
        complaints_came_from, complaints_consumer_name,
        complaints_consumer_mobile, complaints_consumer_gr_no, complaints_consumer_loc_no, 
        complaints_called_mobile, complaints_ivrs, complaints_region, 
        complaints_circle, complaints_division, complaints_sub_division, complaints_dc, 
        complaints_urban_rular, complaints_city, complaints_colony,
        complaints_area, complaints_district, complaints_block, complaints_panchayat, 
        complaints_village, complaints_address, complaints_landmark,
        complaints_assign_officer_id, complaints_assign_officer_id_level1, complaints_assign_gang_id, complaints_assign_foc_center_id,
        complaints_main_category, complaints_sub_category, complaints_remark, complaints_created_by,complaints_created_date ,complaints_last_updated_date 
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)
  `
  const values = [
    complaints_consumer_id,
    complaints_number,
    2,
    data.formData.severity,
    data.formData.complaintThroughUp,
    data.formData.name,
    data.formData.mobile,
    '',
    '',
    data.formData.called_mobile,
    data.formData.ivrs,
    region_id,
    circle_id,
    division_id,
    sub_division_id,
    complaints_dc,
    complaints_urban_rular,
    data.formData.city,
    data.formData.colony,
    data.formData.area,
    data.formData.district,
    data.formData.block,
    data.formData.gramPanchayat,
    data.formData.village,
    data.formData.address,
    data.formData.landmark,
    officer_id,
    officer_id,
    gang_id,
    foc_center_id,
    data.formData.category,
    data.formData.subcategory,
    data.formData.description,
    user_id,
    formattedDate,
    formattedDate,
  ]

  const result = await conn.query(insertComplaintQuery, values)
  return result.insertId
}

async function insertComplaintHistory(
  conn,
  newComplainId,
  formattedDate,
  user_id
) {
  const insertHistoryQuery = `
    INSERT INTO complaints_history (complaints_history_complaint_id, complaints_history_type,complaints_history_followup_by,complaints_history_remark,complaints_history_users_id,complaints_history_status,complaints_history_attended_date) VALUES (?, ?, ?, ?, ?, ?,?)
  `
  await conn.query(insertHistoryQuery, [
    newComplainId,
    'New Complaint Register',
    'Agent',
    'New Complaint Register',
    user_id,
    1,
    formattedDate,
  ])
}

async function insertComplaintHistoryByOff(
  conn,
  newComplainId,
  msg_body,
  user_id,
  formattedDate
) {
  const insertHistoryQuery = `
    INSERT INTO complaints_history (complaints_history_complaint_id, complaints_history_type,complaints_history_followup_by,complaints_history_remark,complaints_history_users_id,complaints_history_status,complaints_history_attended_date) VALUES (?, ?, ?, ?, ?, ?,?)
  `
  await conn.query(insertHistoryQuery, [
    newComplainId,
    'Complaint Assign to Officer',
    'System',
    msg_body,
    user_id,
    1,
    formattedDate,
  ])
}

async function insertEscalation(
  conn,
  newComplainId,
  officer_id,
  gang_id,
  officerType,
  tat,
  formattedDate
) {
  const insertEscalationQuery = `
    INSERT INTO complaints_escalation (escalation_officer_id, escalation_gang_id, escalation_time, escalation_complaint_id, escalation_officer_type,escalation_created_date ) VALUES (?, ?, ?, ?, ?,?)
  `
  await conn.query(insertEscalationQuery, [
    officer_id,
    gang_id,
    tat,
    newComplainId,
    officerType,
    formattedDate,
  ])
}

export const SaveDC_m = async (data) => {
  let conn
  let res
  try {
    conn = await pool.getConnection()
    res = await conn.query(
      'INSERT INTO distributed_center (distributed_center_region_id, distributed_center_circle_id, distributed_center_division_id,distributed_center_sub_division_id,distributed_center_name) VALUES (?,?,?,?,?)',
      [
        data.distributed_center_region_id,
        data.distributed_center_circle_id,
        data.distributed_center_division_id,
        data.distributed_center_sub_division_id,
        data.distributed_center_name,
      ]
    )
  } finally {
    if (conn) conn.end() //end to pool
  }
}
export const SaveDivision_m = async (data) => {
  let conn
  let res
  try {
    conn = await pool.getConnection()
    res = await conn.query(
      'INSERT INTO division (division_region_id, division_circle_id, division_name) VALUES (?,?,?)',
      [data.division_region_id, data.division_circle_id, data.division_name]
    )
  } finally {
    if (conn) conn.end() //end to pool
  }
}
export const SaveOfficers_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    const res1 = await conn.query(
      'INSERT INTO users (users_gram_panchayat, users_block, users_area, users_city, users_district, users_corporate_id, users_home, users_first_name, users_last_name, users_mobile, users_address, users_password, users_empid, users_email, users_region_id, users_circle_id, users_division_id, users_sub_division_id, users_distributed_center_id, users_foc_center_id, users_status, users_is_updated, users_type, Users_company, users_foc_mobile, users_rao_id, users_common_dc, users_type_u_r) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        data.users_first_name,
        data.users_last_name,
        data.users_mobile,
        data.users_address,
        data.users_password,
        data.users_empid,
        data.users_email,
        data.users_region_id,
        data.users_circle_id,
        data.users_division_id,
        data.users_sub_division_id,
        data.users_distributed_center_id,
        data.users_foc_center_id,
        1,
        1,
        data.users_type,
        'MPPKVVCL',
        0,
        0,
        0,
        1,
      ]
    )
    console.log('Insert Result:', res1)
  } catch (err) {
    console.error('Error in SaveOfficers_m:', err)
    throw new ErrorHandler('Database query failed', 500)
  } finally {
    if (conn) conn.end() // End the connection back to the pool
  }
}
export const SaveRegion_m = async (data) => {
  let conn
  let res
  try {
    conn = await pool.getConnection()
    res = await conn.query('INSERT INTO region (region_name) VALUES (?)', [
      data.region_name,
    ])
  } finally {
    if (conn) conn.end() //end to pool
  }
}
export const SaveShutDown_m = async (data) => {
  const arr = data.pre_shut_down_feeder
  const count = arr.length
  let conn
  try {
    conn = await pool.getConnection()
    for (let i = 0; i < count; i++) {
      const [res] = await conn.query(
        'SELECT feeder_11_name FROM feeder_11 WHERE feeder_11_id = ?',
        [arr[i]]
      )

      if (res && res.length > 0) {
        const res1 = await conn.query(
          'INSERT INTO pre_shut_down (pre_shut_type, pre_shut_down_circle, pre_shut_down_division, pre_shut_down_substation, pre_shut_down_feeder, pre_shut_down_region, pre_shut_down_start_time, pre_shut_down_end_time, pre_shut_down_created_by, feeder_name, pre_shut_down_area_type, pre_shut_down_district, pre_shut_down_city, pre_shut_down_area, pre_shut_down_colony, pre_shut_down_block, pre_shut_down_gram_panchayat, pre_shut_down_village) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            data.pre_shut_type,
            data.pre_shut_down_circle,
            data.pre_shut_down_division,
            data.pre_shut_down_substation,
            arr[i], // Using arr[i] as the feeder ID
            data.pre_shut_down_region,
            data.StartDateTime,
            data.EndDateTime,
            '212023',
            res[0].feeder_11_name,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
          ]
        )

        console.log('Insert Result:', res1)
      }
    }
  } catch (err) {
    console.error('Error in SaveShutDown_m:', err)
    throw new ErrorHandler('Database query failed', 500)
  } finally {
    if (conn) conn.end() // End the connection back to the pool
  }
}
export const SaveSubdivion_m = async (data) => {
  let conn
  let res
  try {
    conn = await pool.getConnection()
    res = await conn.query(
      'INSERT INTO sub_division (sub_division_region_id, sub_division_circle_id, sub_division_division_id,sub_division_name) VALUES (?,?,?,?)',
      [
        data.sub_division_region_id,
        data.sub_division_circle_id,
        data.sub_division_division_id,
        data.sub_division_name,
      ]
    )
  } finally {
    if (conn) conn.end() //end to pool
  }
}
export const update_details_came_from_m = async (data) => {
  let conn

  try {
    conn = await pool.getConnection()

    const query = `
      UPDATE complaints
      SET complaints_came_from = ?, complaints_came_from_details = ?
      WHERE complaints_id = ?
    `

    const result = await conn.query(query, [
      data.complaints_came_from,
      data.complaints_came_from_details,
      data.complaints_id,
    ])

    if (result.affectedRows === 0) {
      throw new ErrorHandler('No record found to update', 404)
    }

    return result
  } catch (err) {
    console.error(
      'Error executing query in update_details_came_from_m:',
      err.message
    )
    throw new ErrorHandler('Database query failed', 500) // Use ErrorHandler for consistent error formatting
  } finally {
    if (conn) conn.release() // Release connection back to the pool
  }
}
export const UpdateAgentstatus_m = async (data) => {
  let conn

  if (!data.id || !data.users_status) {
    throw new ErrorHandler('Invalid input data', 400) // Throw an error for missing parameters
  }

  try {
    conn = await pool.getConnection()
    await conn.query('UPDATE users SET users_status = ? WHERE users_id = ?', [
      data.users_status,
      data.id,
    ])
  } catch (err) {
    console.error('Error executing query:', err.message)
    throw new ErrorHandler('Failed to update agent status', 500) // Use ErrorHandler for consistent error formatting
  } finally {
    if (conn) conn.release() // Release connection back to the pool
  }
}
export const updateDtrWorngDC_m = async (data) => {
  // if (
  //   !data.dtr_complain_category_sub ||
  //   !data.dtr_complain_dc_id ||
  //   !data.dtr_complain_id
  // ) {
  //   throw new ErrorHandler('Missing required data', 400) // Throw an error for missing parameters
  // }

  let conn
  try {
    conn = await pool.getConnection()
    const sub_cat = await conn.query(
      'SELECT category_sub_level1_urban, category_sub_level1_urban_time, category_sub_level1_rural FROM `category_sub` WHERE `category_sub_id` = ?',
      [data.dtr_complain_category_sub]
    )
    let gang_id = 0
    let officer_type = 0
    let officer_id = []

    if (data.dtr_complain_location_type == 1) {
      switch (sub_cat[0].category_sub_level1_urban) {
        case 7:
          officer_type = 7
          officer_id = await conn.query(
            'SELECT users_id FROM `users` WHERE users_type = ? AND users_distributed_center_id = ?',
            [sub_cat[0].category_sub_level1_urban, data.dtr_complain_dc_id]
          )
          break
        case 6:
          officer_type = 6
          officer_id = await conn.query(
            'SELECT users_id FROM `users` WHERE users_type = ? AND users_sub_division_id = ?',
            [
              sub_cat[0].category_sub_level1_urban,
              data.dtr_complain_sub_division_id,
            ]
          )
          break
        case 5:
          officer_type = 5
          officer_id = await conn.query(
            'SELECT users_id FROM `users` WHERE users_type = ? AND users_division_id = ?',
            [
              sub_cat[0].category_sub_level1_urban,
              data.dtr_complain_division_id,
            ]
          )
          break
      }
    } else {
      switch (sub_cat[0].category_sub_level1_rural) {
        case 7:
          officer_type = 7
          officer_id = await conn.query(
            'SELECT users_id FROM `users` WHERE users_type = ? AND users_distributed_center_id = ?',
            [sub_cat[0].category_sub_level1_rural, data.dtr_complain_dc_id]
          )
          break
        case 6:
          officer_type = 6
          officer_id = await conn.query(
            'SELECT users_id FROM `users` WHERE users_type = ? AND users_sub_division_id = ?',
            [
              sub_cat[0].category_sub_level1_rural,
              data.dtr_complain_sub_division_id,
            ]
          )
          break
        case 5:
          officer_type = 5
          officer_id = await conn.query(
            'SELECT users_id FROM `users` WHERE users_type = ? AND users_division_id = ?',
            [
              sub_cat[0].category_sub_level1_rural,
              data.dtr_complain_division_id,
            ]
          )
          break
      }
    }

    if (data.dtr_complain_dc_id) {
      await conn.query(
        `UPDATE dtr_complaints SET 
          dtr_complain_region_id = ?, 
          dtr_complain_circle_id = ?, 
          dtr_complain_division_id = ?, 
          dtr_complain_sub_division_id = ?, 
          dtr_complain_dc_id = ?, 
          wrong_dc = 0, 
          dtr_complain_assign_officer_id = ?, 
          dtr_complain_status = 1 
        WHERE dtr_complain_id = ?`,
        [
          data.dtr_complain_region_id,
          data.dtr_complain_circle_id,
          data.dtr_complain_division_id,
          data.dtr_complain_sub_division_id,
          data.dtr_complain_dc_id,
          officer_id[0]?.users_id || 0,
          data.dtr_complain_id,
        ]
      )

      const update_escalation = await conn.query(
        `UPDATE dtr_complaints_escalation SET 
          escalation_officer_id = ? 
        WHERE escalation_complaint_id = ? 
          AND escalation_officer_type = ?`,
        [officer_id[0]?.users_id || 0, data.dtr_complain_id, officer_type]
      )

      const insert_history = await conn.query(
        `INSERT INTO complaints_history (
          complaints_history_complaint_id, 
          complaints_history_type, 
          complaints_history_status, 
          complaints_history_followup_by, 
          complaints_history_remark, 
          complaints_history_users_id,
          complaints_history_attended_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          data.dtr_complain_id,
          'DTR Complaint Dc Changed',
          1,
          'Supervisor',
          data.action,
          212023,
          '2023-11-21 12:49:00',
        ]
      )
    }
  } catch (err) {
    console.error('Error executing updateDtrWorngDC_m:', err.message)
    throw new ErrorHandler('Failed to update DTR wrong DC', 500) // Use ErrorHandler for consistent error formatting
  } finally {
    if (conn) conn.release() // Release connection back to the pool
  }
}
export const updateservey_m = async (data) => {
  let column
  let value

  switch (data.id) {
    case 1:
      column = 'mpez_up_down'
      break
    case 2:
      column = 'lt_survey'
      break
    case 3:
      column = 'bill_information'
      break
    default:
      throw new ErrorHandler('Invalid ID', 400)
  }

  value = data.val ? 1 : 0

  if (data.id) {
    let conn

    try {
      conn = await pool.getConnection()
      await conn.query(`UPDATE settings SET ${column} = ?`, [value])
    } catch (err) {
      console.error('Error executing query:', err.message)
      throw new ErrorHandler('Failed to update settings', 500)
    } finally {
      if (conn) conn.release() // Release connection back to the pool
    }
  } else {
    throw new ErrorHandler('ID is required', 400)
  }
}
export const updateTodo_m = async (todo) => {
  let conn

  try {
    conn = await pool.getConnection()

    const { title, mess, id } = todo

    // Use parameterized query to prevent SQL injection
    const query = 'UPDATE todo SET title = ?, message = ? WHERE id = ?'
    const values = [title, mess, id]

    await conn.query(query, values)
  } catch (err) {
    console.error('Error executing query in updateTodo_m:', err.message)
    throw new ErrorHandler('Database update failed', 500) // Use ErrorHandler for consistent error formatting
  } finally {
    if (conn) conn.release() // Release connection back to the pool
  }
}
export const updateWorngDC_m = async (data) => {
  let conn
  console.log('data', data)
  try {
    conn = await pool.getConnection()

    // Fetch sub-category details
    const [subCat] = await conn.query(
      'SELECT category_sub_level1_urban, category_sub_level1_urban_time, category_sub_level1_rural FROM category_sub WHERE category_sub_id = ?',
      [data.complaints_sub_category]
    )
    console.log('subCat', subCat)
    let officerId, gangId, focId, officerType, tat

    // Urban case
    if (data.complaints_urban_rular == 1) {
      if (subCat[0].category_sub_level1_urban == 8) {
        if (data.complaint_foc != 0) {
          const [gangDetails] = await conn.query(
            'SELECT fgl_gang_id FROM foc_gang_location_master WHERE fgl_foc_id = ?',
            [data.complaint_foc]
          )
          gangId = gangDetails[0].fgl_gang_id
          focId = data.complaint_foc
        } else {
          const [gangFoc] = await conn.query(
            'SELECT fg.fgl_gang_id, fg.fgl_foc_id FROM locations_master LEFT JOIN foc_gang_location_master AS fg ON loc_id = fg.fgl_location_id WHERE loc_dc_id = ?',
            [data.complaints_dc]
          )
          gangId = gangFoc[0].fgl_gang_id
          focId = gangFoc[0].fgl_foc_id
        }
        officerId = 0
        officerType = 8
      } else if (subCat[0].category_sub_level1_urban == 7) {
        const [jecount] = await conn.query(
          'SELECT users_id FROM users WHERE users_type = ? AND users_distributed_center_id = ?',
          [subCat[0].category_sub_level1_urban, data.complaints_dc]
        )

        if (jecount.length > 1) {
          const [jeGrpId] = await conn.query(
            'SELECT users_id FROM users WHERE users_type = ? AND users_distributed_center_id = ? AND users_group != ""',
            [subCat[0].category_sub_level1_urban, data.complaints_dc]
          )

          const [jeLocId] = await conn.query(
            'SELECT users_id FROM users WHERE users_type = ? AND users_distributed_center_id = ? AND users_loc != ""',
            [subCat[0].category_sub_level1_urban, data.complaints_dc]
          )

          if (
            data.complaints_main_category == 17 ||
            data.complaints_main_category == 20
          ) {
            ;[officerId] = await conn.query(
              'SELECT users_id FROM users WHERE users_type = ? AND users_distributed_center_id = ? AND users_category = 17',
              [subCat[0].category_sub_level1_urban, data.complaints_dc]
            )
          } else if (
            jeGrpId.length > 0 &&
            data.gr_code != '' &&
            data.gr_code != '0'
          ) {
            ;[officerId] = await conn.query(
              'SELECT users_id FROM users WHERE users_type = ? AND users_distributed_center_id = ? AND users_group LIKE ?',
              [
                subCat[0].category_sub_level1_urban,
                data.complaints_dc,
                `%${data.gr_code}%`,
              ]
            )
          } else if (
            jeLocId.length > 0 &&
            data.loc_code != '' &&
            data.loc_code != '0'
          ) {
            ;[officerId] = await conn.query(
              'SELECT users_id FROM users WHERE users_type = ? AND users_distributed_center_id = ? AND FIND_IN_SET(?, users_loc)',
              [
                subCat[0].category_sub_level1_urban,
                data.complaints_dc,
                data.loc_code,
              ]
            )
          } else {
            ;[officerId] = await conn.query(
              'SELECT users_id FROM users WHERE users_type = ? AND users_distributed_center_id = ? AND users_category != 17',
              [subCat[0].category_sub_level1_urban, data.complaints_dc]
            )
          }
        } else {
          ;[officerId] = await conn.query(
            'SELECT users_id FROM users WHERE users_type = ? AND users_distributed_center_id = ?',
            [subCat[0].category_sub_level1_urban, data.complaints_dc]
          )
        }
        gangId = 0
        tat = subCat[0].category_sub_level1_urban_time
        officerType = 7
        focId = 0
      } else if (subCat.category_sub_level1_urban == 6) {
        const [aecount] = await conn.query(
          'SELECT users_id FROM users WHERE users_type = ? AND users_sub_division_id = ?',
          [subCat[0].category_sub_level1_urban, data.complaints_sub_division]
        )

        if (aecount.length > 1) {
          const [jeGrpId] = await conn.query(
            'SELECT users_id FROM users WHERE users_type = ? AND users_sub_division_id = ? AND users_group != ""',
            [subCat[0].category_sub_level1_urban, data.complaints_sub_division]
          )

          const [jeLocId] = await conn.query(
            'SELECT users_id FROM users WHERE users_type = ? AND users_sub_division_id = ? AND users_loc != ""',
            [subCat[0].category_sub_level1_urban, data.complaints_sub_division]
          )

          if (
            data.complaints_main_category == 17 ||
            data.complaints_main_category == 20
          ) {
            ;[officerId] = await conn.query(
              'SELECT users_id FROM users WHERE users_type = ? AND users_sub_division_id = ? AND users_category = 17',
              [
                subCat[0].category_sub_level1_urban,
                data.complaints_sub_division,
              ]
            )
          } else if (
            jeGrpId.length > 0 &&
            data.gr_code != '' &&
            data.gr_code != '0'
          ) {
            ;[officerId] = await conn.query(
              'SELECT users_id FROM users WHERE users_type = ? AND users_sub_division_id = ? AND FIND_IN_SET(?, users_group)',
              [
                subCat[0].category_sub_level1_urban,
                data.complaints_sub_division,
                data.gr_code,
              ]
            )
          } else if (
            jeLocId.length > 0 &&
            data.loc_code != '' &&
            data.loc_code != '0'
          ) {
            ;[officerId] = await conn.query(
              'SELECT users_id FROM users WHERE users_type = ? AND users_sub_division_id = ? AND FIND_IN_SET(?, users_loc)',
              [
                subCat[0].category_sub_level1_urban,
                data.complaints_sub_division,
                data.loc_code,
              ]
            )
          } else {
            ;[officerId] = await conn.query(
              'SELECT users_id FROM users WHERE users_type = ? AND users_sub_division_id = ? AND users_category != 17',
              [
                subCat[0].category_sub_level1_urban,
                data.complaints_sub_division,
              ]
            )
          }
          gangId = 0
          officerType = 6
          tat = subCat[0].category_sub_level1_urban
          focId = 0
        }
      }
    } else {
      // Rural case
      //console.log('subCat', subCat[0].category_sub_level1_rural)
      if (subCat[0].category_sub_level1_rural == 8) {
        const [gangFoc] = await conn.query(
          'SELECT fg.fgl_gang_id, fg.fgl_foc_id FROM locations_master LEFT JOIN foc_gang_location_master AS fg ON loc_id = fg.fgl_location_id WHERE loc_dc_id = ?',
          [data.complaints_dc]
        )
        console.log('gangFoc', gangFoc)
        gangId = gangFoc[0].fgl_gang_id
        focId = gangFoc[0].fgl_foc_id
        officerId = 0
        officerType = 8
      } else if (subCat[0].category_sub_level1_rural == 7) {
        ;[officerId] = await conn.query(
          'SELECT users_id FROM users WHERE users_type = ? AND users_distributed_center_id = ?',
          [subCat[0].category_sub_level1_rural, data.complaints_dc]
        )
        gangId = 0
        focId = 0
        officerType = 7
      } else if (subCat[0].category_sub_level1_rural == 6) {
        ;[officerId] = await conn.query(
          'SELECT users_id FROM users WHERE users_type = ? AND users_sub_division_id = ?',
          [subCat[0].category_sub_level1_rural, data.complaints_sub_division]
        )
        gangId = 0
        focId = 0
        officerType = 6
      }
    }
    //console.log('officerId', officerId)
    if (officerId.length > 0) {
      officerId = officerId[0].users_id
    } else {
      officerId = 0
    }
    console.log('officerId', officerId)
    if (data.complaints_dc != '') {
      // Update complaints
      await conn.query(
        `UPDATE complaints SET 
          complaints_region = ?, 
          complaints_circle = ?, 
          complaints_division = ?, 
          complaints_sub_division = ?, 
          complaints_dc = ?, 
          complaints_consumer_loc_no = ?, 
          complaints_consumer_gr_no = ?, 
          complaints_assign_officer_id = ?, 
          complaints_assign_gang_id = ?, 
          complaints_assign_foc_center_id = ?, 
          complaints_current_status = 1, 
          wrong_dc = 2 
        WHERE complaints_id = ?`,
        [
          data.complaints_region,
          data.complaints_circle,
          data.complaints_division,
          data.complaints_sub_division,
          data.complaints_dc,
          data.complaints_consumer_loc_no,
          data.complaints_consumer_gr_no,
          officerId,
          gangId,
          focId,
          data.complaints_id,
        ]
      )

      // Update complaints escalation
      await conn.query(
        `UPDATE complaints_escalation SET 
          escalation_officer_id = ?, 
          escalation_foc_center_id = ?, 
          escalation_gang_id = ? 
        WHERE escalation_complaint_id = ? 
          AND escalation_officer_type = ?`,
        [officerId[0], focId, gangId, data.complaints_id, officerType]
      )

      // Insert into complaints history
      await conn.query(
        `INSERT INTO complaints_history (
          complaints_history_complaint_id, 
          complaints_history_type, 
          complaints_history_followup_by, 
          complaints_history_remark, 
          complaints_history_status, 
          complaints_history_users_id, 
          complaints_history_attended_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          data.complaints_id,
          'Complaint Location Change',
          'Supervisor',
          data.action,
          1,
          212023,
          '0000-00-00 00:00:00',
        ]
      )
    }
  } catch (err) {
    console.error('Error updating wrong DC in model:', err.message)
    throw new ErrorHandler('Failed to update wrong DC', 500) // Use ErrorHandler for consistent error formatting
  } finally {
    if (conn) conn.release() // Release connection back to the pool
  }
}
export const get_feeder_wise_division_m = async () => {
  let conn
  try {
    conn = await pool.getConnection()
    const [res] = await conn.query(
      'SELECT divsion FROM `feeder_shutdown` group by divsion'
    )

    return res // Directly return the result
  } catch (err) {
    throw new ErrorHandler(500, err.message) // Use ErrorHandler class
  } finally {
    if (conn) conn.end() // End connection to pool
  }
}
export const get_feeder_wise_dc_m = async (division) => {
  let conn
  try {
    conn = await pool.getConnection()
    const [res] = await conn.query(
      `SELECT dc_name FROM feeder_shutdown where divsion='${division}' group by dc_name`
    )

    return res // Directly return the result
  } catch (err) {
    throw new ErrorHandler(500, err.message) // Use ErrorHandler class
  } finally {
    if (conn) conn.end() // End connection to pool
  }
}

export const get_feeder_wise_feeder_m = async (dc_name) => {
  let conn
  try {
    conn = await pool.getConnection()
    const [res] = await conn.query(
      `SELECT feeder_name,feeder_code FROM feeder_shutdown where dc_name='${dc_name}'`
    )

    return res // Directly return the result
  } catch (err) {
    throw new ErrorHandler(500, err.message) // Use ErrorHandler class
  } finally {
    if (conn) conn.end() // End connection to pool
  }
}
