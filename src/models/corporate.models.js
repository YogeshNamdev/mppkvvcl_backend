import mariadb from 'mariadb'
import { format, addYears } from 'date-fns'
import pool from '../db/dcConnection.js'
import ErrorHandler from '../utils/errorHandler.js'
// const pool = mariadb.createPool({
//   host: 'localhost',
//   user: 'root',
//   password: 'root',
//   database: 'test',
//   connectionLimit: 50,
// })

export const getCopComplaints_m = async () => {
  let conn
  try {
    conn = await pool.getConnection()

    const [res] = await conn.query(
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
    console.log('res', res)
    return { res }
  } catch (err) {
    throw new ErrorHandler(500, err.message) // Use ErrorHandler class
  } finally {
    if (conn) conn.release() // End connection to pool
  }
}
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
      var je_count = await conn.query(
        'SELECT users_id FROM users WHERE users_type = 7 AND users_status = 1 AND users_distributed_center_id = ?',
        [info[0].complaints_dc]
      )
      if (je_count && je_count.length > 0) {
        var mat = info[0].complaints_main_category

        var category_officer = await conn.query(
          'SELECT users_id FROM users WHERE users_type = 7 AND users_status = 1 AND users_distributed_center_id = ?  and find_in_set(?,users_category)',
          [info[0].complaints_dc, mat]
        )
        var je_loc_id = await conn.query(
          'SELECT users_id FROM users WHERE users_type = 7 AND users_status = 1 AND users_distributed_center_id = ? and find_in_set(?,users_loc)',
          [info[0].complaints_dc, info[0].complaints_consumer_loc_no]
        )
        var je_grp_id = await conn.query(
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
        cond += ' and find_in_set(' + mat + ',users_category)'

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
      var ae_count = await conn.query(
        'select users_id,users_common_dc from users where users_type=6 and users_status=1 and users_sub_division_id=? OR users_common_dc_id =?',
        [info[0].complaints_sub_division, info[0].complaints_sub_division]
      )
      if (ae_count.length == 0) {
        var ae_count = await conn.query(
          'select users_id,users_common_dc from users where users_type=6 and users_status=1 and find_in_set (?,users_common_dc_id)',
          [info[0].complaints_sub_division]
        )
      }
      var mcat = info[0].complaints_main_category
      var category_officer_ae = await conn.query(
        'select users_id from users where users_type=6 and users_sub_division_id = ? and find_in_set(' +
          mcat +
          ',users_category)',
        [info[0].complaints_sub_division]
      )
      if (info[0].complaints_consumer_loc_no != '') {
        var ae_loc_id = await conn.query(
          'select users_id from users where users_type=6 and users_sub_division_id=? and find_in_set(' +
            info[0].complaints_consumer_loc_no +
            ',users_loc)',
          [info[0].complaints_sub_division]
        )
      } else {
        var ae_loc_id = []
      }

      var ae_grp_id = await conn.query(
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
export const get_complaints_History_via_by_id_m = async (id) => {
  let conn

  try {
    conn = await pool.getConnection()
    let [res] = await conn.query(
      'SELECT complaints_history_id, complaints_history_created_date, complaints_history_status, complaints_history_followup_by, complaints_history_remark FROM `complaints_history` WHERE complaints_history_complaint_id = ? ORDER BY complaints_history_id DESC',
      [id]
    )

    // Convert necessary fields to string
    // res.forEach((data) => {
    //   data.complaints_history_id = data.complaints_history_id.toString()
    // })
    return { res }
  } catch (err) {
    console.error(err)
    throw new Error('Failed to retrieve complaint history')
  } finally {
    if (conn) conn.end()
  }
}
