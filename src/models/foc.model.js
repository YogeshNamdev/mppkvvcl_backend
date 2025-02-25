// import mariadb from 'mariadb'
import pool from '../db/index.js'
import ErrorHandler from '../utils/errorHandler.js'

// const pool = mariadb.createPool({
//   host: 'localhost',
//   user: 'root',
//   password: 'root',
//   database: 'test',
//   connectionLimit: 50,
// })
export const actionSend_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    // Update complaint status
    await conn.query(
      'UPDATE complaints SET complaints_current_status = ? WHERE complaints_id = ?',
      [data.action, data.complaints_id]
    )
    if (data.date_time_attended == '') {
      data.date_time_attended = '0000-00-00 00:00:00'
    }
    // Insert into complaints_history
    await conn.query(
      'INSERT INTO complaints_history (complaints_history_complaint_id, complaints_history_type, complaints_history_followup_by, complaints_history_remark, complaints_history_rectification, complaints_history_users_id, complaints_history_status, complaints_history_attended_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        data.complaints_id,
        'Action And Remark',
        'FOC Center',
        data.remark,
        data.foc_rectification,
        data.user_id,
        data.action,
        data.date_time_attended,
      ]
    )

    // Insert into complaint_foc_action
    await conn.query(
      'INSERT INTO complaint_foc_action (foc_action_complaint_id, foc_action_rectification, foc_action_foc_id, foc_action_maintenance) VALUES (?, ?, ?, 1)',
      [data.complaints_id, data.foc_rectification, data.user_id]
    )

    // Update complaints_foc_flag if required
    if (data.foc_rectification == 7) {
      await conn.query(
        'UPDATE complaints SET complaints_foc_flag = 1 WHERE complaints_id = ?',
        [data.complaints_id]
      )
    }
  } catch (err) {
    console.error('Error in actionSend_m:', err)
    throw err // Re-throw error to be handled by the controller
  } finally {
    if (conn) conn.release() // Release connection back to the pool
  }
}
export const actionUpdate_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    const res1 = await conn.query(
      'INSERT INTO dtr_complaints_history (complaints_history_complaint_id, complaints_history_type, complaints_history_followup_by,complaints_history_remark,complaints_history_status) VALUES (?,?,?,?,?)',
      [
        data.complaints_history_complaint_id,
        data.complaints_history_type,
        data.complaints_history_followup_by,
        data.complaints_history_remark,
        data.complaints_history_status,
      ]
    )
  } finally {
    if (conn) conn.release() //end to pool
  }
}
export const get_complaints_History_via_by_id_m = async (id) => {
  let conn
  let res
  try {
    conn = await pool.getConnection()
    res = await conn.query(
      'SELECT complaints_history_id, complaints_history_created_date, complaints_history_status, complaints_history_followup_by, complaints_history_remark FROM `complaints_history` WHERE complaints_history_complaint_id = ? ORDER BY complaints_history_id DESC',
      [id]
    )

    // Convert necessary fields to string
    res.forEach((data) => {
      data.complaints_history_id = data.complaints_history_id.toString()
    })
    return res
  } catch (err) {
    console.error(err)
    throw new Error('Failed to retrieve complaint history')
  } finally {
    if (conn) conn.release()
  }
}

export const getcomplaintsbyfocID_m = async (id, complaintstatus) => {
  let conn
  try {
    conn = await pool.getConnection()

    // Get the FOC Center ID for the given user ID
    const [userFocCenter] = await conn.query(
      'SELECT users_foc_center_id FROM users WHERE users_id = ?',
      [id]
    )

    if (userFocCenter) {
      const usersFocCenterId = userFocCenter[0].users_foc_center_id

      // Fetch complaints data based on FOC Center ID and complaint status
      const [complaints] = await conn.query(
        `SELECT complaints_id AS id,
                complaints_number,
                complaints_consumer_id,
                complaints_consumer_name,
                complaints_consumer_mobile,
                complaints_called_mobile,
                complaints_ivrs,
                complaints_current_status,
                category_main.category_main_name,
                category_sub.category_sub_name,
                gang.gang_name,
                gang.gang_number,
                complaints_address,
                complaints_created_date,
                complaints_last_updated_date
         FROM complaints
         JOIN category_main ON category_main.category_main_id = complaints.complaints_main_category
         JOIN category_sub ON category_sub.category_sub_id = complaints.complaints_sub_category
         LEFT JOIN gang ON gang.gang_id = complaints.complaints_assign_gang_id
         WHERE complaints.complaints_main_category IN (17, 20)
           AND complaints.complaints_assign_foc_center_id IN (?)
           AND complaints.complaints_current_status = ?
         ORDER BY complaints_id`,
        [usersFocCenterId, complaintstatus]
      )

      return { complaints }
    } else {
      return []
    }
  } catch (err) {
    console.error('Error in getcomplaintsbyfocID_m:', err)
    throw new ErrorHandler('Database query failed', 500)
  } finally {
    if (conn) conn.release() // End the connection back to the pool
  }
}
export const getComplaintsviaGangIDStatus_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()

    console.log('data', data)
    const query = `
      SELECT 
        complaints_id AS id,
        complaints_number,
        complaints_consumer_id,
        complaints_consumer_name,
        complaints_consumer_mobile,
        complaints_called_mobile,
        complaints_ivrs,
        complaints_current_status,
        category_main.category_main_name,
        category_sub_name,
        gang.gang_name,
        gang.gang_number,
        complaints_address,
        complaints_created_date,
        complaints_last_updated_date 
      FROM complaints 
      JOIN category_main ON category_main.category_main_id = complaints.complaints_main_category
      JOIN category_sub ON category_sub.category_sub_id = complaints.complaints_sub_category
      LEFT JOIN gang ON gang.gang_id = complaints.complaints_assign_gang_id
      LEFT JOIN consumer ON consumer.consumer_id = complaints.complaints_consumer_id
      WHERE complaints.complaints_main_category IN (17, 20) 
      AND complaints.complaints_assign_gang_id = ? 
      AND complaints.complaints_current_status = ? 
      ORDER BY complaints_id
    `
    const params = [data.gangId, data.complaintstatus]
    const [res] = await conn.query(query, params)
    console.log('res', res)
    return { res }
  } catch (err) {
    console.error('Error in getComplaintsviaGangIDStatus_m:', err)
    throw new ErrorHandler('Database query failed', 500)
  } finally {
    if (conn) conn.release() // End the connection back to the pool
  }
}
const formatData = (data) => {
  for (const key in data) {
    if (typeof data[key] === 'bigint') {
      data[key] = data[key].toString()
    }
  }
  return data
}

export const getcountcomplaintsbyID_m = async (id) => {
  let conn
  try {
    conn = await pool.getConnection()

    const [userFocCenterId] = await conn.query(
      'SELECT users_foc_center_id FROM users WHERE users_id = ?',
      [id]
    )

    if (userFocCenterId) {
      const usersFocCenterId = userFocCenterId.users_foc_center_id

      const [gangIds] = await conn.query(
        'SELECT GROUP_CONCAT(gang_id) AS gang_ids FROM gang WHERE gang_foc_id IN (?)',
        [usersFocCenterId.split(',')]
      )
      const gangIdsArray = gangIds.gang_ids ? gangIds.gang_ids.split(',') : []

      const [res1] = await conn.query(
        'SELECT COUNT(complaints_id) AS monthly_open_complain FROM complaints WHERE complaints.complaints_main_category IN (17,20) AND complaints.complaints_assign_foc_center_id IN (?) AND complaints.complaints_current_status = 1',
        [usersFocCenterId]
      )

      const [res2] = await conn.query(
        'SELECT COUNT(complaints_id) AS monthly_close_complain FROM complaints WHERE complaints.complaints_main_category IN (17,20) AND complaints.complaints_assign_foc_center_id IN (?) AND complaints.complaints_current_status = 4',
        [usersFocCenterId]
      )

      const [res3] = await conn.query(
        'SELECT COUNT(complaints_id) AS monthly_attend_complain FROM complaints WHERE complaints.complaints_main_category IN (17,20) AND complaints.complaints_assign_foc_center_id IN (?) AND complaints.complaints_current_status = 3',
        [usersFocCenterId]
      )

      const [res4] = await conn.query(
        'SELECT COUNT(complaints_id) AS monthly_reopen_complain FROM complaints WHERE complaints.complaints_main_category IN (17,20) AND complaints.complaints_assign_foc_center_id IN (?) AND complaints.complaints_current_status = 5',
        [usersFocCenterId]
      )

      const [res5] = await conn.query(
        'SELECT COUNT(complaints_id) AS monthly_total_complain FROM complaints WHERE complaints.complaints_main_category IN (17,20) AND complaints.complaints_assign_foc_center_id IN (?)',
        [usersFocCenterId]
      )

      const [res6] = await conn.query(
        'SELECT COUNT(complaints_id) AS monthly_supply_complain FROM complaints WHERE complaints.complaints_main_category = 17 AND complaints.complaints_assign_foc_center_id IN (?)',
        [usersFocCenterId]
      )

      const [res7] = await conn.query(
        'SELECT COUNT(complaints_id) AS monthly_acci_complain FROM complaints WHERE complaints.complaints_main_category = 20 AND complaints.complaints_assign_foc_center_id IN (?)',
        [usersFocCenterId]
      )

      const [sup] = await conn.query(
        'SELECT COUNT(CASE WHEN complaints_current_status = 1 THEN complaints_id END) AS total_open, COUNT(CASE WHEN complaints_current_status = 3 THEN complaints_id END) AS total_attended, DATE(complaints.complaints_created_date) AS date FROM complaints WHERE complaints.complaints_main_category = 17 AND complaints.complaints_assign_foc_center_id IN (?) AND DATE(complaints.complaints_created_date) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND DATE(complaints.complaints_created_date) <= CURDATE() GROUP BY DATE(complaints.complaints_created_date)',
        [usersFocCenterId]
      )

      const [acc] = await conn.query(
        'SELECT COUNT(CASE WHEN complaints_current_status = 1 THEN complaints_id END) AS total_open, COUNT(CASE WHEN complaints_current_status = 3 THEN complaints_id END) AS total_attended, DATE(complaints.complaints_created_date) AS date FROM complaints WHERE complaints.complaints_main_category = 20 AND complaints.complaints_assign_foc_center_id IN (?) AND DATE(complaints.complaints_created_date) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND DATE(complaints.complaints_created_date) <= CURDATE() GROUP BY DATE(complaints.complaints_created_date)',
        [usersFocCenterId]
      )

      const [gangAssign] = await conn.query(
        'SELECT COUNT(complaints.complaints_id) AS assign_complaints FROM complaints WHERE complaints.complaints_assign_gang_id IN (?) AND complaints.complaints_current_status = 1',
        [gangIdsArray]
      )
      return {
        res1: formatData(res1),
        res2: formatData(res2),
        res3: formatData(res3),
        res4: formatData(res4),
        res5: formatData(res5),
        res6: formatData(res6),
        res7: formatData(res7),
        sup: sup ? sup.map(formatData) : [],
        acc: acc ? acc.map(formatData) : [],
        gang_assign: gangAssign ? gangAssign.assign_complaints.toString() : [],
      }
    }
  } catch (err) {
    console.error('Error in getcountcomplaintsbyID_m:', err)
    throw new ErrorHandler('Database query failed', 500)
  } finally {
    if (conn) conn.release() // End the connection back to the pool
  }
}
export const getDTRComplaints_m = async (userId) => {
  let conn
  try {
    conn = await pool.getConnection()
    const query1 =
      'SELECT users_distributed_center_id FROM `users` WHERE users_id = ?'
    const res1 = await conn.query(query1, [userId])

    if (res1.length === 0) {
      throw new ErrorHandler('User not found', 404)
    }

    const distributedCenterId = res1[0].users_distributed_center_id
    const query2 = `
      SELECT 
        district.district_name,
        dtr_complaints.dtr_complain_id AS id,
        dtr_complaints.dtr_complain_date,
        block.block_name,
        gram_panchayat.gram_panchayat_name,
        dtr_complaints.dtr_complain_status,
        city.city_name,
        area.area_name 
      FROM dtr_complaints 
      JOIN district ON district.district_id = dtr_complaints.dtr_complain_district 
      LEFT JOIN block ON block.block_id = dtr_complaints.dtr_complain_block 
      LEFT JOIN gram_panchayat ON gram_panchayat.gram_panchayat_id = dtr_complaints.dtr_complain_gram_panchyat 
      LEFT JOIN city ON city.city_id = dtr_complaints.dtr_complain_city 
      LEFT JOIN area ON area.area_id = dtr_complaints.dtr_complain_area 
      LEFT JOIN colony ON colony.col_id = dtr_complaints.dtr_complain_colony 
      WHERE dtr_complaints.dtr_complain_dc_id = ? 
      AND dtr_complaints.dtr_complain_status IN (1, 2)
    `
    const res2 = await conn.query(query2, [distributedCenterId])

    if (res2.length === 0) {
      throw new ErrorHandler('No complaints found', 404)
    }

    return res2
  } catch (err) {
    console.error('Error in getDTRComplaints_m:', err)
    throw new ErrorHandler('Database query failed', 500)
  } finally {
    if (conn) await conn.release() // End the connection back to the pool
  }
}

export const getdtrcomplaintsbyID_m = async (id) => {
  let conn
  try {
    conn = await pool.getConnection()

    // Query to fetch basic complaint information
    const [res1] = await conn.query(
      'SELECT users_region_id, users_circle_id, users_division_id, users_sub_division_id FROM `users` WHERE users_id = ?',
      [37892] // Replace with actual ID if needed
    )

    if (res1.length === 0) {
      return { res1: [], res2: [], res3: [], res4: [] } // No data found
    }

    // Query to fetch detailed complaint information
    const res2 = await conn.query(
      `SELECT region.region_name, circle.circle_name, division.division_name, sub_division.sub_division_name,
              distributed_center.distributed_center_name, dtr_complain_location_type, district.district_name,
              city_name, area.area_name, colony.colony_name, block.block_name, gram_panchayat.gram_panchayat_name,
              village.village_name, category_main.category_main_name, category_sub.category_sub_name,
              CASE 
                WHEN dtr_complaints.dtr_complain_status = 1 THEN "Open" 
                WHEN dtr_complaints.dtr_complain_status = 3 THEN "Attended" 
                WHEN dtr_complaints.dtr_complain_status = 4 THEN "Close" 
                ELSE "Forced Close" 
              END AS complain_status,
              dtr_complaints.dtr_complain_dtr_location,
              CASE 
                WHEN dtr_complaints.dtr_complain_location_type = 1 THEN "Urban" 
                ELSE "Rural" 
              END AS location_type,
              dtr_complaints.dtr_complain_consumer_name, dtr_complaints.dtr_complain_mobile,
              dtr_complaints.dtr_complain_date, dtr_complaints.dtr_complain_remarks,
              dtr_complaints.dtr_complain_status, dtr_complaints.dtr_complain_id, dtr_complaints.dtr_complain_ivrs
       FROM dtr_complaints
       INNER JOIN region ON region.region_id = dtr_complaints.dtr_complain_region_id
       INNER JOIN circle ON circle.circle_id = dtr_complaints.dtr_complain_circle_id
       INNER JOIN division ON division.division_id = dtr_complaints.dtr_complain_division_id
       INNER JOIN sub_division ON sub_division.sub_division_id = dtr_complaints.dtr_complain_sub_division_id
       INNER JOIN distributed_center ON distributed_center.distributed_center_id = dtr_complaints.dtr_complain_dc_id
       LEFT JOIN category_main ON category_main.category_main_id = dtr_complaints.dtr_complain_main_category
       LEFT JOIN category_sub ON category_sub.category_sub_id = dtr_complaints.dtr_complain_category_sub
       INNER JOIN district ON district.district_id = dtr_complaints.dtr_complain_district
       LEFT JOIN city ON city.city_id = dtr_complaints.dtr_complain_city
       LEFT JOIN area ON area.area_id = dtr_complaints.dtr_complain_area
       LEFT JOIN colony ON colony.colony_id = dtr_complaints.dtr_complain_colony
       LEFT JOIN block ON block.block_id = dtr_complaints.dtr_complain_block
       LEFT JOIN gram_panchayat ON gram_panchayat.gram_panchayat_id = dtr_complaints.dtr_complain_gram_panchyat
       LEFT JOIN village ON village.village_id = dtr_complaints.dtr_complain_village
       WHERE dtr_complaints.dtr_complain_id = ?`,
      [id]
    )

    // Convert dtr_complain_id to string
    res2.forEach((data) => {
      if (data.dtr_complain_id) {
        data.dtr_complain_id = data.dtr_complain_id.toString()
      }
    })

    // Query to fetch complaint questions
    const res3 = await conn.query(
      `SELECT questions_master.q_title_hindi, questions_master.q_type,
              dtr_complaints_question.question_option_id, options_master.opt_title,
              CASE 
                WHEN questions_master.q_type = "Dropdown" THEN options_master.opt_title 
                WHEN questions_master.q_type = "Numeric" THEN options_master.opt_title 
                WHEN questions_master.q_type = "Datetime" THEN dtr_complaints_question.question_option_id 
                ELSE dtr_complaints_question.question_option_id 
              END AS question_status
       FROM dtr_complaints_question
       INNER JOIN questions_master ON questions_master.q_id = dtr_complaints_question.question_id
       LEFT JOIN options_master ON options_master.opt_id = dtr_complaints_question.question_option_id
       WHERE complaint_id = ?
       ORDER BY questions_master.q_order ASC`,
      [id]
    )

    // Query to fetch complaint history
    const res4 = await conn.query(
      `SELECT dtr_complaints_history.*, dtr_complaints_history.complaints_history_id AS id,
              users.users_type, users.users_first_name, users.users_last_name, users.users_name
       FROM dtr_complaints_history
       LEFT JOIN users ON users.users_id = complaints_history_users_id
       WHERE complaints_history_complaint_id = ?
       ORDER BY complaints_history_id DESC`,
      [id]
    )

    return { res1, res2, res3, res4 }
  } catch (err) {
    console.error('Error in getdtrcomplaintsbyID_m:', err)
    throw new ErrorHandler('Database query failed', 500)
  } finally {
    if (conn) conn.release() // End the connection back to the pool
  }
}

export const getFOCComplaints_m = async (data) => {
  let conn

  try {
    conn = await pool.getConnection()
    const [res1] = await conn.query(
      'SELECT users_foc_center_id, users_distributed_center_id FROM `users` WHERE users_id = ?',
      [data.id]
    )

    if (res1 && res1.length > 0) {
      let cond = ''
      if (
        data.startdate !== 'Invalid date' &&
        data.enddate !== 'Invalid date'
      ) {
        cond = `AND DATE(complaints_created_date) >= '${data.startdate}' AND DATE(complaints_created_date) <= '${data.enddate}'`
      }

      const users_foc_center_id = res1[0].users_foc_center_id
      const users_distributed_center_id = res1[0].users_distributed_center_id

      const complaintsQuery = `
            SELECT 
            complaints_id AS id,
            CASE 
            WHEN complaints.wrong_dc = 0 AND complaints.complaints_current_status = 1 THEN 'Open'
            WHEN complaints.wrong_dc = 0 AND complaints.complaints_current_status = 3 THEN 'Attended'
            WHEN complaints.wrong_dc = 2 AND complaints.complaints_current_status = 1 THEN 'Open'
            WHEN complaints.complaints_current_status = 4 THEN 'Close'
            ELSE 'Forced Close'
            END AS complaints_status,
            complaints_number,
            complaints_consumer_id,
            category_main.category_main_name,
            category_sub_name,
            complaints_consumer_name,
            complaints_consumer_mobile,
            complaints_called_mobile,
            complaints_ivrs,
            complaints_current_status,
            gang.gang_name,
            gang.gang_number,
            complaints_address,
            complaints_created_date,
            complaints_last_updated_date
            FROM 
            complaints
            LEFT JOIN 
            category_main ON category_main.category_main_id = complaints.complaints_main_category
            LEFT JOIN 
            category_sub ON category_sub.category_sub_id = complaints.complaints_sub_category
            LEFT JOIN 
            gang ON gang.gang_id = complaints.complaints_assign_gang_id
            where
            complaints.complaints_main_category IN (17, 20)
            AND complaints.complaints_assign_foc_center_id IN (?)
            AND complaints.complaints_current_status IN (1, 3, 5) ${cond}
            ORDER BY 
            complaints_id
          `

      const dtrQuery = `
            SELECT
            district.district_name,
            dtr_complaints.dtr_complain_id AS id,
            dtr_complaints.dtr_complain_date,
            block.block_name,
            gram_panchayat.gram_panchayat_name,
            dtr_complaints.dtr_complain_status,
            city.city_name,
            area.area_name
            FROM
            dtr_complaints
            JOIN
            district ON district.district_id = dtr_complaints.dtr_complain_district
            LEFT JOIN
            block ON block.block_id = dtr_complaints.dtr_complain_block
            LEFT JOIN
            gram_panchayat ON gram_panchayat.gram_panchayat_id = dtr_complaints.dtr_complain_gram_panchyat
            LEFT JOIN
            city ON city.city_id = dtr_complaints.dtr_complain_city
            LEFT JOIN
            area ON area.area_id = dtr_complaints.dtr_complain_area
            LEFT JOIN
            colony ON colony.col_id = dtr_complaints.dtr_complain_colony
            WHERE
            dtr_complaints.dtr_complain_dc_id = ?
            AND dtr_complaints.dtr_complain_status IN (1, 2)
          `

      try {
        const [res] = await conn.query(complaintsQuery, [users_foc_center_id])
        const [dtr] = await conn.query(dtrQuery, [users_distributed_center_id])
        return { res, dtr }
      } catch (error) {
        throw new ErrorHandler(error.message, 500)
      }
    }
  } finally {
    if (conn) conn.release() // end to pool
  }
}
export const getFOCcomplaintsbyID_m = async (id) => {
  let conn
  try {
    conn = await pool.getConnection()
    const [res1] = await conn.query(
      'SELECT complaints.*, CASE ' +
        'WHEN complaints.complaints_current_status = 1 THEN "Open" ' +
        'WHEN complaints.complaints_current_status = 3 THEN "Attended" ' +
        'WHEN complaints.complaints_current_status = 4 THEN "Close" ' +
        'ELSE "Forced Close" ' +
        'END AS complaints_status, ' +
        'CASE ' +
        'WHEN complaints.complaints_urban_rular = 1 THEN "Urban" ' +
        'WHEN complaints.complaints_urban_rular = 2 THEN "Rural" ' +
        'ELSE "" ' +
        'END AS location_type, ' +
        'category_main.category_main_name, category_sub.category_sub_name, ' +
        'region.region_name, circle.circle_name, division.division_name, ' +
        'sub_division.sub_division_name, distributed_center.distributed_center_name, ' +
        'district.district_name, city.city_name, block.block_name, ' +
        'gram_panchayat.gram_panchayat_name, village.village_name, ' +
        'area.area_name, colony.colony_name, foc_masters.foc_name ' +
        'FROM `complaints` ' +
        'LEFT JOIN category_main ON category_main.category_main_id=complaints_main_category ' +
        'LEFT JOIN category_sub ON category_sub.category_sub_id=complaints_sub_category ' +
        'LEFT JOIN region ON region.region_id=complaints_region ' +
        'LEFT JOIN circle ON circle.circle_id=complaints_circle ' +
        'LEFT JOIN division ON division.division_id=complaints_division ' +
        'LEFT JOIN sub_division ON sub_division.sub_division_id=complaints_sub_division ' +
        'LEFT JOIN distributed_center ON distributed_center.distributed_center_id=complaints_dc ' +
        'LEFT JOIN district ON district.district_id=complaints_district ' +
        'LEFT JOIN city ON city.city_id=complaints_city ' +
        'LEFT JOIN block ON block.block_id=complaints_block ' +
        'LEFT JOIN gram_panchayat ON gram_panchayat.gram_panchayat_id=complaints_panchayat ' +
        'LEFT JOIN village ON village.village_id=complaints_village ' +
        'LEFT JOIN area ON area.area_id=complaints_area ' +
        'LEFT JOIN colony ON colony.colony_id=complaints_colony ' +
        'LEFT JOIN foc_masters ON foc_masters.foc_id=complaints_assign_foc_center_id ' +
        'WHERE complaints_id = ?',
      [id]
    )
    const [res2] = await conn.query(
      'SELECT complaints_history_id, complaints_history_created_date, complaints_history_status, complaints_history_followup_by, complaints_history_remark FROM `complaints_history` WHERE complaints_history_complaint_id= ? ORDER BY complaints_history_id DESC',
      [id]
    )
    const [res3] = await conn.query(
      'SELECT * FROM `complaints_question` LEFT JOIN questions_master on complaints_question.question_id=questions_master.q_id LEFT JOIN options_master on options_master.opt_id=complaints_question.question_option_id WHERE complaints_question.complaint_id= ?',
      [id]
    )

    return { res1, res2, res3 } // Assuming that you want to return the first row of the result
  } catch (err) {
    console.error('Error in getFOCcomplaintsbyID_m:', err)
    throw new ErrorHandler('Database query failed', 500)
  } finally {
    if (conn) conn.release() // end the connection back to the pool
  }
}
export const getFocProfileData_m = async (id) => {
  let conn
  try {
    conn = await pool.getConnection()

    const query = `
      SELECT 
        CASE 
          WHEN users.users_type = 6 THEN "AE" 
          WHEN users.users_type = 7 THEN "JE" 
          WHEN users.users_type = 9 THEN "FOC" 
          ELSE "USERS" 
        END AS users_des,
        users.users_name,
        users.users_first_name,
        users.users_last_name,
        users.users_empid,
        users.users_mobile,
        users.users_loc,
        users.users_group,
        users.users_password,
        region.region_name,
        circle.circle_name,
        division.division_name,
        sub_division.sub_division_name,
        distributed_center.distributed_center_name
      FROM users
      INNER JOIN region ON region.region_id = users.users_region_id
      INNER JOIN circle ON circle.circle_id = users.users_circle_id
      INNER JOIN division ON division.division_id = users.users_division_id
      INNER JOIN sub_division ON sub_division.sub_division_id = users.users_sub_division_id
      INNER JOIN distributed_center ON distributed_center.distributed_center_id = users.users_distributed_center_id
      WHERE users.users_id = ?
    `

    const res1 = await conn.query(query, [id])
    return { res1 }
  } catch (err) {
    console.error('Error in getFocProfileData_m:', err)
    throw new ErrorHandler('Database query failed', 500)
  } finally {
    if (conn) await conn.release() // End the connection back to the pool
  }
}
export const getGang_m = async (id) => {
  let conn

  try {
    conn = await pool.getConnection()
    const [res1] = await conn.query(
      'SELECT users_foc_center_id FROM `users` where users_id = ?',
      [id]
    )
    if (res1 && res1.length > 0) {
      const users_foc_center_id = res1[0].users_foc_center_id

      const [res] = await conn.query(
        'SELECT gang_id, gang_name, gang_number, (SELECT COUNT(complaints.complaints_id) FROM complaints WHERE complaints.complaints_assign_gang_id = gang.gang_id) AS total_complaint, (SELECT COUNT(complaints.complaints_id) FROM complaints WHERE complaints.complaints_assign_gang_id = gang.gang_id AND complaints.complaints_current_status = 1) AS total_open, (SELECT COUNT(complaints.complaints_id) FROM complaints WHERE complaints.complaints_assign_gang_id = gang.gang_id AND complaints.complaints_current_status IN (2, 3)) AS total_attended, (SELECT COUNT(complaints.complaints_id) FROM complaints WHERE complaints.complaints_assign_gang_id = gang.gang_id AND complaints.complaints_current_status IN (4)) AS total_close, (SELECT COUNT(complaints.complaints_id) FROM complaints WHERE complaints.complaints_assign_gang_id = gang.gang_id AND complaints.complaints_current_status IN (5)) AS total_reopen FROM `gang` WHERE gang_foc_id IN (' +
          users_foc_center_id +
          ')'
      )
      return { res }
      // Convert necessary fields to string
    }
  } finally {
    if (conn) conn.release() //end to pool
  }
}

export const getGanglist_m = async (id) => {
  let conn

  try {
    conn = await pool.getConnection()
    const [res1] = await conn.query(
      'SELECT users_foc_center_id FROM `users` where users_id = ?',
      [id]
    )
    if (res1 && res1.length > 0) {
      const users_foc_center_id = res1[0].users_foc_center_id

      const [res] = await conn.query(
        'SELECT gang_id, gang_name, gang_number FROM `gang` WHERE gang_foc_id IN (' +
          users_foc_center_id +
          ')'
      )
      return { res }
      // Convert necessary fields to string
    }
  } finally {
    if (conn) conn.release() //end to pool
  }
}

export const getGangLineMan_m = async (id) => {
  let conn
  try {
    conn = await pool.getConnection()
    const query1 = 'SELECT users_foc_center_id FROM `users` WHERE users_id = ?'
    const [res1] = await conn.query(query1, [id])

    if (res1.length === 0) {
      throw new ErrorHandler('User not found', 404)
    }

    const users_foc_center_id = res1[0].users_foc_center_id

    // Using parameterized query to prevent SQL injection
    const query2 = `SELECT gang.* FROM foc_masters INNER JOIN gang ON gang.gang_foc_id = foc_masters.foc_id  WHERE foc_masters.foc_id IN (?)`
    const [res2] = await conn.query(query2, [users_foc_center_id.split(',')])

    return res2
  } catch (err) {
    console.error('Error in getGangLineMan_m:', err)
    throw new ErrorHandler('Database query failed', 500)
  } finally {
    if (conn) conn.release() // End the connection back to the pool
  }
}
export const getSubCategory_m = async (id) => {
  let conn
  try {
    conn = await pool.getConnection()
    const query =
      'SELECT category_sub_id, category_sub_name FROM category_sub WHERE category_sub_main_id = ?'
    const res = await conn.query(query, [id])

    if (res.length === 0) {
      throw new ErrorHandler('No subcategories found', 404)
    }

    return res
  } catch (err) {
    console.error('Error in getSubCategory_m:', err)
    throw new ErrorHandler('Database query failed', 500)
  } finally {
    if (conn) await conn.release() // End the connection back to the pool
  }
}
export const UpdateGang_m = async (data) => {
  const commaSeparatedIds = data.complaints_id.map((id) => `'${id}'`).join(',')
  let conn
  try {
    conn = await pool.getConnection()
    const res = await conn.query(
      `UPDATE complaints SET complaints_assign_gang_id = ? WHERE complaints_id IN (${commaSeparatedIds})`,
      [data.GangId]
    )
  } finally {
    if (conn) conn.release() // end to pool
  }
}

export const updategangdetails_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    const query =
      'UPDATE gang SET gang_name = ?, gang_number = ? WHERE gang_id = ?'
    const params = [data.gang_name, data.gang_number, data.gangId]
    const res = await conn.query(query, params)

    if (res.affectedRows === 0) {
      throw new ErrorHandler('No gang found with the provided ID', 404)
    }
  } catch (err) {
    console.error('Error in updategangdetails_m:', err)
    throw new ErrorHandler('Database query failed', 500)
  } finally {
    if (conn) await conn.release() // End the connection back to the pool
  }
}
export const updateProfile_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()

    const updateProfileQuery = `
      UPDATE users 
      SET 
        users_first_name = ?,
        users_last_name = ?,
        users_empid = ?,
        users_mobile = ?,
        users_loc = ?,
        users_group = ?,
        users_name = ?
      WHERE users_id = ?
    `

    await conn.query(updateProfileQuery, [
      data.users_first_name,
      data.users_last_name,
      data.users_empid,
      data.users_mobile,
      data.users_loc,
      data.users_group,
      data.users_name,
      data.users_id,
    ])
  } catch (err) {
    console.error('Error in updateProfile_m:', err)
    throw new ErrorHandler('Database query failed', 500)
  } finally {
    if (conn) await conn.release() // End the connection back to the pool
  }
}

export const updateProfilePass_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()

    // Check if the old password is correct
    const checkPasswordQuery = `
      SELECT users_id 
      FROM users 
      WHERE users_id = ? AND users_password = ?
    `
    const checkPasswordResult = await conn.query(checkPasswordQuery, [
      data.users_id,
      data.old_pass,
    ])

    if (checkPasswordResult.length === 0) {
      throw new ErrorHandler('Old password is incorrect', 400)
    }

    // Update to the new password
    const updatePasswordQuery = `
      UPDATE users 
      SET users_password = ? 
      WHERE users_id = ?
    `
    await conn.query(updatePasswordQuery, [data.new_pass, data.users_id])
  } catch (err) {
    console.error('Error in updateProfilePass_m:', err)
    throw new ErrorHandler('Database query failed', 500)
  } finally {
    if (conn) await conn.release() // End the connection back to the pool
  }
}
export const getFOCDashboardCount_m = async (id) => {
  let conn
  try {
    conn = await pool.getConnection()
    const [userFocCenterId] = await conn.query(
      'SELECT users_foc_center_id FROM users WHERE users_id = ?',
      [id]
    )

    if (userFocCenterId) {
      const usersFocCenterId = userFocCenterId[0].users_foc_center_id

      const [gangIds] = await conn.query(
        'SELECT GROUP_CONCAT(gang_id) AS gang_ids FROM gang WHERE gang_foc_id IN (?)',
        [usersFocCenterId.split(',')]
      )
      const gangIdsArray = gangIds[0].gang_ids
        ? gangIds[0].gang_ids.split(',')
        : []

      const [res1] = await conn.query(
        'SELECT COUNT(complaints_id) AS monthly_open_complain FROM complaints WHERE complaints.complaints_main_category IN (17,20) AND complaints.complaints_assign_foc_center_id IN (?) AND complaints.complaints_current_status = 1',
        [usersFocCenterId]
      )

      const [res2] = await conn.query(
        'SELECT COUNT(complaints_id) AS monthly_close_complain FROM complaints WHERE complaints.complaints_main_category IN (17,20) AND complaints.complaints_assign_foc_center_id IN (?) AND complaints.complaints_current_status = 4',
        [usersFocCenterId]
      )

      const [res3] = await conn.query(
        'SELECT COUNT(complaints_id) AS monthly_attend_complain FROM complaints WHERE complaints.complaints_main_category IN (17,20) AND complaints.complaints_assign_foc_center_id IN (?) AND complaints.complaints_current_status = 3',
        [usersFocCenterId]
      )

      const [res4] = await conn.query(
        'SELECT COUNT(complaints_id) AS monthly_reopen_complain FROM complaints WHERE complaints.complaints_main_category IN (17,20) AND complaints.complaints_assign_foc_center_id IN (?) AND complaints.complaints_current_status = 5',
        [usersFocCenterId]
      )

      const [res5] = await conn.query(
        'SELECT COUNT(complaints_id) AS monthly_total_complain FROM complaints WHERE complaints.complaints_main_category IN (17,20) AND complaints.complaints_assign_foc_center_id IN (?)',
        [usersFocCenterId]
      )

      const [res6] = await conn.query(
        'SELECT COUNT(complaints_id) AS monthly_supply_complain FROM complaints WHERE complaints.complaints_main_category = 17 AND complaints.complaints_assign_foc_center_id IN (?)',
        [usersFocCenterId]
      )

      const [res7] = await conn.query(
        'SELECT COUNT(complaints_id) AS monthly_acci_complain FROM complaints WHERE complaints.complaints_main_category = 20 AND complaints.complaints_assign_foc_center_id IN (?)',
        [usersFocCenterId]
      )

      const [sup] = await conn.query(
        'SELECT COUNT(CASE WHEN complaints_current_status = 1 THEN complaints_id END) AS total_open,  COUNT(CASE WHEN complaints_current_status = 3 THEN complaints_id END) AS total_attended, DATE(complaints.complaints_created_date) AS date FROM complaints WHERE complaints.complaints_main_category = 17 AND date(complaints.complaints_created_date) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND date(complaints.complaints_created_date)  <= CURDATE() and complaints.complaints_assign_foc_center_id IN (?) GROUP BY DATE(complaints.complaints_created_date) limit 7',
        [usersFocCenterId]
      )

      const [acc] = await conn.query(
        'SELECT COUNT(CASE WHEN complaints_current_status = 1 THEN complaints_id END) AS total_open, COUNT(CASE WHEN complaints_current_status = 3 THEN complaints_id END) AS total_attended, DATE(complaints.complaints_created_date) AS date FROM complaints WHERE complaints.complaints_main_category = 20 AND date(complaints.complaints_created_date) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND date(complaints.complaints_created_date)  <= CURDATE()  and complaints.complaints_assign_foc_center_id IN (?) GROUP BY DATE(complaints.complaints_created_date) limit 7',
        [usersFocCenterId]
      )

      const [gang_assign] = await conn.query(
        'SELECT COUNT(complaints.complaints_id) AS assign_complaints FROM complaints WHERE complaints.complaints_assign_gang_id IN (?) AND complaints.complaints_current_status = 1',
        [gangIdsArray]
      )

      // return {
      //   res1: formatData(res1),
      //   res2: formatData(res2),
      //   res3: formatData(res3),
      //   res4: formatData(res4),
      //   res5: formatData(res5),
      //   res6: formatData(res6),
      //   res7: formatData(res7),
      //   sup: sup ? sup.map(formatData) : [],
      //   acc: acc ? acc.map(formatData) : [],
      //   gang_assign: gangAssign ? gangAssign.assign_complaints.toString() : [],
      // }
      return { res1, res2, res3, res4, res5, res6, res7, sup, acc, gang_assign }
    }
  } catch (err) {
    console.error('Error in getcountcomplaintsbyID_m:', err)
    throw new ErrorHandler('Database query failed', 500)
  } finally {
    if (conn) conn.release() // End the connection back to the pool
  }
}
