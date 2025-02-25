import pool from '../db/dcConnection.js'
import axios from 'axios'
import ErrorHandler from '../utils/errorHandler.js'
import { format, addYears } from 'date-fns'
export const getEZNewCsatSurvey_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    let today = new Date()
    let priorDate = new Date(new Date().setDate(today.getDate() - 30))

    let cond = 'AND lt_feedback_circle_id != 0 '

    if (data.circle != 0) {
      cond += `AND lt_feedback_circle_id=${data.circle} `
    }
    if (data.startdate !== '' && data.enddate !== '') {
      cond += `AND DATE(lt_feedback_created_date) >= ? AND DATE(lt_feedback_created_date) <= ? `
    } else {
      cond += `AND DATE(lt_feedback_created_date) >= ? AND DATE(lt_feedback_created_date) <= ? `
    }

    const [list] = await conn.query(
      `
         SELECT 
           DATE(lt_feedback_created_date) AS datewise,
           MONTHNAME(lt_feedback_created_date) AS month_date,
           COUNT(CASE WHEN lt_feedback_question_id = 2 AND lt_feedback_answer = 'हाँ' THEN lt_feedback_id END) AS total_first_ques_yes,
           COUNT(CASE WHEN lt_feedback_question_id = 2 AND lt_feedback_answer = 'नहीं' THEN lt_feedback_id END) AS total_first_ques_no_nr,
           COUNT(CASE WHEN lt_feedback_question_id = 2 THEN lt_feedback_id END) AS grand_total,
           COUNT(CASE WHEN lt_feedback_answer = 'विधुत की निर्बाध आपूर्ति न होने के कारण।' THEN lt_feedback_id END) AS option1,
           COUNT(CASE WHEN lt_feedback_answer = 'बिजली का बिल अधिक आना या मीटर रीडिंग का समय पर न होना।' THEN lt_feedback_id END) AS option2,
           COUNT(CASE WHEN lt_feedback_answer = 'बिजली की लो वोल्टेज की समस्या।' THEN lt_feedback_id END) AS option3,
           COUNT(CASE WHEN lt_feedback_answer = 'विधुत सम्बंधित शिकायतों का समय पर निराकरण न होना।' THEN lt_feedback_id END) AS option4,
           COUNT(CASE WHEN lt_feedback_answer = 'अन्य कोई कारण।' THEN lt_feedback_id END) AS option5
         FROM 
           lt_consumer_feedback 
         WHERE 
           lt_feedback_created_date IS NOT NULL
           ${cond}
         GROUP BY 
           DATE(lt_feedback_created_date)
         ORDER BY 
           lt_feedback_created_date DESC
      `,
      [
        data.startdate || format(priorDate, 'yyyy-MM-dd'),
        data.enddate || format(today, 'yyyy-MM-dd'),
      ]
    )

    const [circlewise] = await conn.query(
      `
         SELECT 
           circle.circle_id, 
           circle.circle_name, 
           COUNT(lt_feedback.lt_feedback_id) AS total_opt, 
           SUM(CASE WHEN lt_feedback_question_id = 2 AND lt_feedback_answer = 'हाँ' THEN 1 ELSE 0 END) AS satisfied,
           SUM(CASE WHEN lt_feedback_question_id = 2 AND lt_feedback_answer = 'नहीं' THEN 1 ELSE 0 END) AS not_satisfied,
           COUNT(CASE WHEN lt_feedback_question_id = 2 THEN lt_feedback_id END) AS total_feedback,
           SUM(CASE WHEN lt_feedback_answer = 'विधुत की निर्बाध आपूर्ति न होने के कारण।' THEN 1 ELSE 0 END) AS trippings_interruptions,
           SUM(CASE WHEN lt_feedback_answer = 'बिजली का बिल अधिक आना या मीटर रीडिंग का समय पर न होना।' THEN 1 ELSE 0 END) AS billing_issue,
           SUM(CASE WHEN lt_feedback_answer = 'बिजली की लो वोल्टेज की समस्या।' THEN 1 ELSE 0 END) AS voltage_issue,
           SUM(CASE WHEN lt_feedback_answer = 'विधुत सम्बंधित शिकायतों का समय पर निराकरण न होना।' THEN 1 ELSE 0 END) AS delay_complaints,
           SUM(CASE WHEN lt_feedback_answer = 'अन्य कोई कारण।' THEN 1 ELSE 0 END) AS others
         FROM 
           lt_consumer_feedback AS lt_feedback
         LEFT JOIN 
           circle ON circle.circle_id = lt_feedback.lt_feedback_circle_id
         WHERE 
           lt_feedback.lt_feedback_id != 0 
           ${cond}
         GROUP BY 
           lt_feedback_circle_id
      `,
      [
        data.startdate || format(priorDate, 'yyyy-MM-dd'),
        data.enddate || format(today, 'yyyy-MM-dd'),
      ]
    )

    return { list, circlewise }
  } catch (err) {
    throw new ErrorHandler(err.message, 500) // Use ErrorHandler class
  } finally {
    if (conn) conn.release() // End connection to pool
  }
}

export const getCZNewCsatSurvey_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection() // If you're using this connection, otherwise, remove this line

    let condition2 = data.circle || 0
    let circle = condition2 !== 0 ? condition2 : 0

    let date = ''
    if (data.startdate !== '' && data.enddate !== '') {
      const startDate = data.startdate !== '' ? new Date(data.startdate) : ''
      const endDate = data.enddate !== '' ? new Date(data.enddate) : ''
      if (!isNaN(startDate) && !isNaN(endDate)) {
        date = `sdt=${data.startdate}&edt=${data.enddate}`
      } else {
        throw new Error('Invalid date format')
      }
    } else {
      const edt = new Date().toISOString().slice(0, 10) // Current date in 'YYYY-MM-DD' format
      date = `sdt=2019-09-01&edt=${edt}`
    }
    console.log('ci', circle)
    console.log('date', date)

    const url1 = `http://isampark.mpcz.in:8888/feedback_report_energy_dept_portal_2.aspx?${date}&circle=${circle}`
    const response1 = await axios.get(url1)
    const dateWiseData = response1.data
    const url2 = `http://isampark.mpcz.in:8888/feedback_report_energy_dept_portal.aspx?${date}&circle=${circle}`
    const response2 = await axios.get(url2)
    const circleWiseData = response2.data
    const list = {
      dateWiseData,
      circleWiseData,
    }

    return { list }
  } catch (err) {
    // Handle the error using ErrorHandler class
    throw new ErrorHandler(err.message, 500)
  } finally {
    if (conn) conn.release() // Ensure connection is released, if used
  }
}
export const getWZNewCsatSurvey_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()

    let condition2 = data.circle || ''
    let circle = condition2 !== '' ? condition2 : 'NA'
    let sdt = ''
    let edt = ''

    if (data.startdate != '' && data.enddate !== '') {
      sdt = new Date(data.startdate)
        .toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: '2-digit',
        })
        .replace(/ /g, '-')
      edt = new Date(data.enddate)
        .toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: '2-digit',
        })
        .replace(/ /g, '-')
    } else {
      const currentDate = new Date()
      sdt = '01-Sep-19'
      edt = currentDate
        .toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: '2-digit',
        })
        .replace(/ /g, '-')
    }

    // POST data for the first request
    const postdata = {
      datefrom: sdt,
      dateto: edt,
      circle: circle,
    }

    // First API call to get date-wise data
    const url1 =
      'http://urjastesting.mpwin.co.in:9090/urjasappbeckend/consumer-feedback/get-data'
    const response1 = await axios.post(url1, new URLSearchParams(postdata), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    const dateWiseData = response1.data

    // POST data for the second request (Circle-wise data)
    const postdata1 = {
      datefrom: sdt,
      dateto: edt,
      circle: circle,
    }

    // Second API call to get circle-wise data
    const url2 =
      'http://urjastesting.mpwin.co.in:9090/urjasappbeckend/consumer-feedback/get-data-circle-wise'
    const response2 = await axios.post(url2, new URLSearchParams(postdata1), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    const circleWiseData = response2.data

    // Prepare the final data similar to `$data` in PHP
    const list = {
      date_wise_data: dateWiseData,
      circle_wise_data: circleWiseData,
    }

    return { list }
  } catch (err) {
    // Handle the error using ErrorHandler class
    throw new ErrorHandler(err.message, 500)
  } finally {
    if (conn) conn.release() // Ensure the connection is released
  }
}

export const getCategoryWiseComplaintCount_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()

    let cond = ''
    let today = new Date()
    let firstDate = new Date(today.getFullYear(), today.getMonth(), 1)
    let currentDate = today

    if (data.startdate !== '' && data.enddate !== '') {
      cond = `WHERE c.complaints_created_date >= '${data.startdate}' AND c.complaints_created_date <= '${data.enddate}' `
    } else {
      cond = `WHERE c.complaints_created_date >= '${format(
        firstDate,
        'yyyy-MM-dd'
      )}' AND c.complaints_created_date <= '${format(
        currentDate,
        'yyyy-MM-dd'
      )}' `
    }

    const [list] = await conn.query(`
      SELECT 
        cm.category_main_name,
        cm.category_main_id,
        COUNT(c.complaints_id) AS total,
        SUM(CASE WHEN c.complaints_current_status = 1 THEN 1 ELSE 0 END) AS open,
        SUM(CASE WHEN c.complaints_current_status = 3 THEN 1 ELSE 0 END) AS attended,
        SUM(CASE WHEN c.complaints_current_status = 4 THEN 1 ELSE 0 END) AS close,
        SUM(CASE WHEN c.complaints_current_status = 5 THEN 1 ELSE 0 END) AS reopen,
        SUM(CASE WHEN c.complaints_current_status = 6 THEN 1 ELSE 0 END) AS forceclose
      FROM 
        complaints c
      LEFT JOIN 
        category_main cm ON cm.category_main_id = c.complaints_main_category
      ${cond}
      GROUP BY 
        cm.category_main_name, cm.category_main_id
    `)

    return { list }
  } catch (err) {
    throw new ErrorHandler(err.message, 500) // Use ErrorHandler class
  } finally {
    if (conn) conn.release() // End connection to pool
  }
}

export const getElectricityDateWiseReport_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    let today = new Date()
    let priorDate = new Date(new Date().setDate(today.getDate() - 30))
    let cond = ''
    if (data.circle != 0) {
      cond += `AND bill_feedback_circle=${data.circle} `
    }
    if (data.startdate !== '' && data.enddate !== '') {
      cond += `And date(created_date) >= '${data.startdate}' AND date(created_date) <= '${data.enddate}' `
    } else {
      cond += `And date(created_date) >= '${format(
        priorDate,
        'yyyy-MM-dd'
      )}' AND date(created_date) <= '${format(today, 'yyyy-MM-dd')}' `
    }
    const [list] = await conn.query(
      `SELECT DATE(created_date) as datewise,MONTHNAME(created_date) as month_date,
COUNT(CASE WHEN bill_ans1='हाँ'  THEN survey_id END) AS total_first_ques_yes,
COUNT(CASE WHEN bill_ans1='नहीं'  THEN survey_id END) AS total_first_ques_no_nr,
COUNT(CASE WHEN bill_ques_id1 = 2 THEN survey_id END) AS grand_total
FROM bill_information_survey where survey_id!='' AND  bill_feedback_circle!=0  AND DATE(created_date)!='0000-00-00' ${cond} group by DATE(created_date) order by datewise desc
        `
    )

    return { list }
  } catch (err) {
    throw new ErrorHandler(err.message, 500) // Use ErrorHandler class
  } finally {
    if (conn) conn.release() // End connection to pool
  }
}

export const getElectricityCircleWiseReport_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    let today = new Date()
    let priorDate = new Date(new Date().setDate(today.getDate() - 30))
    let cond = ''
    if (data.circle != 0) {
      cond += `AND bill_feedback_circle=${data.circle} `
    }
    if (data.startdate !== '' && data.enddate !== '') {
      cond += `And date(created_date) >= '${data.startdate}' AND date(created_date) <= '${data.enddate}' `
    } else {
      cond += `And date(created_date) >= '${format(
        priorDate,
        'yyyy-MM-dd'
      )}' AND date(created_date) <= '${format(today, 'yyyy-MM-dd')}' `
    }
    const [list] = await conn.query(
      `SELECT division_id, division_name, circle_name, count(survey_id) as total_opt, 
COUNT(CASE WHEN bill_ans1='हाँ'  THEN survey_id END) AS satisfied,
COUNT(CASE WHEN bill_ans1='नहीं'  THEN survey_id END) AS not_satisfied,
COUNT(CASE WHEN bill_ques_id1 = 2 THEN survey_id END) AS total_feedback
from bill_information_survey 
left join division on division_id=bill_feedback_division
left join circle  on circle_id=bill_feedback_circle
where survey_id != 0 and bill_feedback_division!='' ${cond} group by bill_feedback_division
        `
    )

    return { list }
  } catch (err) {
    throw new ErrorHandler(err.message, 500) // Use ErrorHandler class
  } finally {
    if (conn) conn.release() // End connection to pool
  }
}

export const getElectricityDivisionWiseReport_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    let today = new Date()
    let priorDate = new Date(new Date().setDate(today.getDate() - 30))
    let cond = ''
    if (data.circle != 0) {
      cond += `AND bill_feedback_circle=${data.circle} `
    }
    if (data.startdate !== '' && data.enddate !== '') {
      cond += `And date(created_date) >= '${data.startdate}' AND date(created_date) <= '${data.enddate}' `
    } else {
      cond += `And date(created_date) >= '${format(
        priorDate,
        'yyyy-MM-dd'
      )}' AND date(created_date) <= '${format(today, 'yyyy-MM-dd')}' `
    }
    const [list] = await conn.query(
      `SELECT division_id, division_name, circle_name, count(survey_id) as total_opt, 
COUNT(CASE WHEN bill_ans1='हाँ'  THEN survey_id END) AS satisfied,
COUNT(CASE WHEN bill_ans1='नहीं'  THEN survey_id END) AS not_satisfied,
COUNT(CASE WHEN bill_ques_id1 = 2 THEN survey_id END) AS total_feedback
from bill_information_survey 
left join division on division_id=bill_feedback_division
left join circle  on circle_id=bill_feedback_circle
where survey_id != 0 and bill_feedback_division!='' ${cond} group by bill_feedback_division
        `
    )

    return { list }
  } catch (err) {
    throw new ErrorHandler(err.message, 500) // Use ErrorHandler class
  } finally {
    if (conn) conn.release() // End connection to pool
  }
}

export const getDayWiseReport_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    let today = new Date()
    let priorDate = new Date(new Date().setDate(today.getDate() - 30))
    let cond = ''
    if (data.startdate !== '' && data.enddate !== '') {
      cond = `WHERE DATE(B1) >= '${data.startdate}' AND DATE(B1) <= '${data.enddate}' `
    } else {
      cond = `WHERE YEAR(B1) = YEAR(CURRENT_DATE()) AND MONTH(B1) = MONTH(CURRENT_DATE() - INTERVAL 1 DAY) AND date(B1) <= (CURDATE() - INTERVAL 1 DAY)`
    }
    const [list] = await conn.query(
      `SELECT * FROM process_summery ${cond} ORDER BY DATE(B1) DESC
        `
    )
    const [list_total] = await conn.query(
      `SELECT
SUM(C1) as C1_t,
SUM(D1) as D1_t,
SUM(E1) as E1_t,
SUM(F1) as F1_t,
SUM(G1) as G1_t,
SUM(H1) as H1_t,
SUM(I1) as I1_t,
ROUND(AVG(X1) ,7) as X1_t,

sec_to_time(sum(time_to_sec(J1))) as J1_t,

SEC_TO_TIME(SUM(TIME_TO_SEC(M1))) as M1_t,
FORMAT((SUM(D1)/SUM(C1))*100, 2) as  Answered_per,
FORMAT((SUM(F1)/SUM(D1))*100, 2) as  SLA,
FORMAT((SUM(E1)/SUM(D1))*100, 2) as  Abandoned,

SUM(Q1) as Q1_t,
SUM(R1) as R1_t,
SEC_TO_TIME( SUM( TIME_TO_SEC(S1))) as S1_t,
SEC_TO_TIME( SUM( TIME_TO_SEC(V1))) as V1_t,
FORMAT((SUM(R1)/SUM(Q1))*100, 2) as  Outbound_connected_per
 FROM process_summery ${cond}
        `
    )

    if (list.length > 0) {
      return { list, list_total }
    }
  } catch (err) {
    throw new ErrorHandler(err.message, 500) // Use ErrorHandler class
  } finally {
    if (conn) conn.release() // End connection to pool
  }
}

export const gethourlyReport_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    let cond = ''
    if (data.startdate !== '' && data.enddate !== '') {
      cond = `WHERE DATE(interval_start) >= '${data.startdate}' AND DATE(interval_start) <= '${data.enddate}' `
    } else {
      cond = `WHERE date(interval_start)= ( CURDATE() - INTERVAL 1 DAY )`
    }
    const [listinbound] = await conn.query(
      `select * from process_summery_hourly  ${cond} order by interval_start ASC
        `
    )
    const [listoutbound] = await conn.query(
      `select * from process_summery_hourly_outbound  ${cond} order by interval_start ASC
        `
    )
    const [list_total_inbound] = await conn.query(
      `SELECT
SUM(total_offered_calls) AS total_offered_calls_T,
SUM(total_answered_calls) AS total_answered_calls_T,
SUM(total_abandoned_calls) AS total_abandoned_calls_T,
SUM(answer_within_20_sec) AS answer_within_20_sec_T,
SUM(answer_after_20_sec) AS answer_after_20_sec_T,
SUM(abandoned_within_20_sec) AS abandoned_within_20_sec_T,
SUM(abandoned_after_20_sec) AS abandoned_after_20_sec_T,
SEC_TO_TIME(SUM(TIME_TO_SEC(total_handling_time))) as total_handling_time_T,
FORMAT((SUM(total_answered_calls)/SUM(total_offered_calls))*100, 2) as  Answered_per,
FORMAT((SUM(answer_within_20_sec)/SUM(total_answered_calls))*100, 0) as  sla_per,
FORMAT((SUM(total_abandoned_calls)/SUM(total_offered_calls))*100, 2) as  Abandoned_per
 FROM process_summery_hourly ${cond}
      `
    )

    const [list_total_outbound] = await conn.query(
      `SELECT
SUM(total_offered_calls) AS total_offered_calls_T,
SUM(total_answered_calls) AS total_answered_calls_T,
FORMAT((SUM(total_answered_calls)/SUM(total_offered_calls))*100, 1) as  Abandoned_per
 FROM process_summery_hourly_outbound ${cond}
      `
    )

    return {
      listinbound,
      listoutbound,
      list_total_inbound,
      list_total_outbound,
    }
  } catch (err) {
    throw new ErrorHandler(err.message, 500) // Use ErrorHandler class
  } finally {
    if (conn) conn.release() // End connection to pool
  }
}

export const getMTDReport_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    let cond = ''

    if (data.date !== '') {
      cond = ` WHERE DATE(date) >= '${data.date}'`
    } else {
      cond = ` WHERE DATE(date)= (CURDATE() - INTERVAL 1 DAY )`
    }

    const [listinbound] = await conn.query(
      `SELECT * FROM  import_Inbound_MTD_Report ${cond} ORDER BY date ASC LIMIT 3
        `
    )
    const [listoutbound] = await conn.query(
      `select * from import_Outbound_MTD_Report ${cond} order by date ASC LIMIT 3
        `
    )
    const [list_total_inbound] = await conn.query(
      `SELECT
  -- Sum fields
  SUM(Sum_of_Total_Offered_Calls) AS Sum_of_Total_Offered_Calls,
  SUM(Sum_of_Total_Answered_Calls) AS Sum_of_Total_Answered_Calls,
  SUM(Sum_of_Total_Abandoned_Calls) AS Sum_of_Total_Abandoned_Calls,
  SUM(Sum_of_Ans_Within_20_Secs) AS Sum_of_Ans_Within_20_Secs,
  SUM(Sum_of_Ans_After_20_Secs) AS Sum_of_Ans_After_20_Secs,
  SUM(Sum_of_Abandond_Within_20_Secs) AS Sum_of_Abandond_Within_20_Secs,
  SUM(Sum_of_Abandond_After_20_Secs) AS Sum_of_Abandond_After_20_Secs,

  -- Average handling time
  SEC_TO_TIME(AVG(TIME_TO_SEC(Average_of_Average_Handling_Time))) AS Average_of_Average_Handling_Time,

  -- Use AVG for average calculations (not SUM)
  AVG(Average_of_Answered) AS Average_of_Answered,
  AVG(Average_of_SLA) AS Average_of_SLA,
  AVG(Average_of_Abandoned) AS Average_of_Abandoned,

  -- Total handling time
  SEC_TO_TIME(SUM(TIME_TO_SEC(Sum_of_Total_Handling_Time))) AS Sum_of_Total_Handling_Time

FROM import_Inbound_MTD_Report
${cond}
      `
    )

    const [list_total_outbound] = await conn.query(
      `SELECT
SUM(total_offered_calls) AS total_offered_calls_T,
SUM(total_answered_calls) AS total_answered_calls_T,
SEC_TO_TIME(SUM(TIME_TO_SEC(total_handling_time))) as total_ht,
SEC_TO_TIME(AVG(TIME_TO_SEC(Average_Handling_Time))) as Average_Handling_Time,

SUM(Outbound_connected) as  Average_of_Abandoned

 FROM  import_Outbound_MTD_Report ${cond}
      `
    )
    console.log()

    return {
      listinbound,
      listoutbound,
      list_total_inbound,
      list_total_outbound,
    }
  } catch (err) {
    throw new ErrorHandler(err.message, 500) // Use ErrorHandler class
  } finally {
    if (conn) conn.release() // End connection to pool
  }
}

export const getYTDReport_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    let cond = ''

    if (data.date !== '') {
      cond = ` WHERE DATE(date) >= '${data.date}'`
    } else {
      cond = ` WHERE DATE(date)= (CURDATE() - INTERVAL 1 DAY )`
    }

    const [listinbound] = await conn.query(
      `SELECT * FROM import_inbound_ytd_report ${cond} ORDER BY date ASC LIMIT 3 
        `
    )
    const [listoutbound] = await conn.query(
      `SELECT * FROM  import_outbound_ytd_report ${cond} ORDER BY date ASC LIMIT 3 
        `
    )
    const [list_total_inbound] = await conn.query(
      `SELECT
  SUM(Sum_of_Total_Offered_Calls) AS Sum_of_Total_Offered_Calls,
  SUM(Sum_of_Total_Answered_Calls) AS Sum_of_Total_Answered_Calls,
  SUM(Sum_of_Total_Abandoned_Calls) AS Sum_of_Total_Abandoned_Calls,
  SUM(Sum_of_Ans_Within_20_Secs) AS Sum_of_Ans_Within_20_Secs,
  SUM(Sum_of_Ans_After_20_Secs) AS Sum_of_Ans_After_20_Secs,
  SUM(Sum_of_Abandond_Within_20_Secs) AS Sum_of_Abandond_Within_20_Secs,
  SUM(Sum_of_Abandond_After_20_Secs) AS Sum_of_Abandond_After_20_Secs,
  
  -- Optimized Time Aggregation
  SEC_TO_TIME(SUM(TIME_TO_SEC(Sum_of_Total_Handling_Time))) AS Sum_of_Total_Handling_Time,
  SEC_TO_TIME(AVG(TIME_TO_SEC(Average_of_Average_Handling_Time))) AS Average_of_Average_Handling_Time,

  -- Calculated Fields
  FORMAT((SUM(Sum_of_Total_Answered_Calls) / SUM(Sum_of_Total_Offered_Calls)) * 100, 2) AS Average_of_Answered,
  FORMAT((SUM(Sum_of_Ans_Within_20_Secs) / SUM(Sum_of_Total_Answered_Calls)) * 100, 0) AS Average_of_SLA,

  -- Use AVG for average calculation, SUM might not be correct here
  AVG(Average_of_Abandoned) AS Average_of_Abandoned

FROM import_inbound_ytd_report
${cond};
      `
    )

    const [list_total_outbound] = await conn.query(
      `SELECT
SUM(total_offered_calls) AS total_offered_calls_T,
SUM(total_answered_calls) AS total_answered_calls_T,
SEC_TO_TIME(SUM(TIME_TO_SEC(total_handling_time))) as total_handling_time_T,
SEC_TO_TIME(AVG(TIME_TO_SEC(Average_Handling_Time))) as Average_Handling_Time,
SUM(Outbound_connected) as  Average_of_Abandoned

 FROM  import_outbound_ytd_report ${cond}
      `
    )

    if (listinbound.length > 0 && listoutbound.length > 0) {
      return {
        listinbound,
        listoutbound,
        list_total_inbound,
        list_total_outbound,
      }
    }
  } catch (err) {
    throw new ErrorHandler(err.message, 500) // Use ErrorHandler class
  } finally {
    if (conn) conn.release() // End connection to pool
  }
}

export const get_circle_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    let cond = ''
    const [list] = await conn.query(
      `SELECT circle_id,circle_name FROM circle 
        `
    )
    if (list.length > 0) {
      return { list }
    }
  } catch (err) {
    throw new ErrorHandler(err.message, 500) // Use ErrorHandler class
  } finally {
    if (conn) conn.release() // End connection to pool
  }
}

export const getSupplyFailureClosure_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    const [list] = await conn.query(
      `select ci.circle_name as circle, division.division_name as division,division.division_urban_rural as type, count(DISTINCT c.complaints_id) as total_complaints, DATE(c.complaints_created_date) AS date_of, DATE_FORMAT(c.complaints_created_date, '%M - %Y') month_year, AVG(TIMESTAMPDIFF(HOUR,IF(c.complaints_current_status,c.complaints_created_date,'0'),IF(h.complaints_history_status=3 ,h.complaints_history_created_date,'0'))) AS AVG_Time_in_hours FROM complaints as c LEFT JOIN complaints_history as h ON c.complaints_id=h.complaints_history_complaint_id LEFT JOIN circle as ci ON ci.circle_id=c.complaints_circle inner join division on c.complaints_division=division.division_id WHERE c.complaints_main_category=17 AND c.complaints_sub_category=21 AND c.complaints_circle=${data.circle} AND date(complaints_created_date) BETWEEN '${data.startdate}' AND '${data.enddate}' group by c.complaints_circle,c.complaints_division ORDER BY YEAR(c.complaints_created_date)
        `
    )
    if (list.length > 0) {
      return { list }
    }
  } catch (err) {
    throw new ErrorHandler(err.message, 500) // Use ErrorHandler class
  } finally {
    if (conn) conn.release() // End connection to pool
  }
}
export const getSupplyFailureSlotWisePendency_m = async () => {
  let conn
  try {
    conn = await pool.getConnection()
    const [list] = await conn.query(
      `SELECT 
  COUNT(complaints_id) AS totalrecords,
  SUM(CASE WHEN DATE(complaints_created_date) = (CURDATE() - INTERVAL 1 DAY) THEN 1 ELSE 0 END) AS sameday,
  SUM(CASE WHEN DATE(complaints_created_date) BETWEEN (CURDATE() - INTERVAL 3 DAY) AND (CURDATE() - INTERVAL 2 DAY) THEN 1 ELSE 0 END) AS t1_3_days,
  SUM(CASE WHEN DATE(complaints_created_date) BETWEEN (CURDATE() - INTERVAL 7 DAY) AND (CURDATE() - INTERVAL 4 DAY) THEN 1 ELSE 0 END) AS t4_7_days,
  SUM(CASE WHEN DATE(complaints_created_date) BETWEEN (CURDATE() - INTERVAL 15 DAY) AND (CURDATE() - INTERVAL 8 DAY) THEN 1 ELSE 0 END) AS t8_15_days,
  SUM(CASE WHEN DATE(complaints_created_date) BETWEEN (CURDATE() - INTERVAL 30 DAY) AND (CURDATE() - INTERVAL 16 DAY) THEN 1 ELSE 0 END) AS t16_30_days,
  SUM(CASE WHEN DATE(complaints_created_date) < (CURDATE() - INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS g_30_days
FROM 
  complaints 
WHERE 
  complaints_current_status = 1
  AND complaints_sub_category = 21
  AND complaints_created_date <= (CURDATE() - INTERVAL 1 DAY);
        `
    )

    const [list_data] = await conn.query(
      `SELECT 
  COUNT(*) AS totalrecords,
  circle.circle_name,
  division.division_name,
  SUM(CASE WHEN DATE(complaints_created_date) = (CURDATE() - INTERVAL 1 DAY) THEN 1 ELSE 0 END) AS sameday,
  SUM(CASE WHEN DATE(complaints_created_date) BETWEEN (CURDATE() - INTERVAL 3 DAY) AND (CURDATE() - INTERVAL 2 DAY) THEN 1 ELSE 0 END) AS t1_3_days,
  SUM(CASE WHEN DATE(complaints_created_date) BETWEEN (CURDATE() - INTERVAL 7 DAY) AND (CURDATE() - INTERVAL 4 DAY) THEN 1 ELSE 0 END) AS t4_7_days,
  SUM(CASE WHEN DATE(complaints_created_date) BETWEEN (CURDATE() - INTERVAL 15 DAY) AND (CURDATE() - INTERVAL 8 DAY) THEN 1 ELSE 0 END) AS t8_15_days,
  SUM(CASE WHEN DATE(complaints_created_date) BETWEEN (CURDATE() - INTERVAL 30 DAY) AND (CURDATE() - INTERVAL 16 DAY) THEN 1 ELSE 0 END) AS t16_30_days,
  SUM(CASE WHEN DATE(complaints_created_date) < (CURDATE() - INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS g_30_days
FROM 
  complaints 
LEFT JOIN 
  circle ON complaints.complaints_circle = circle.circle_id
LEFT JOIN 
  division ON complaints.complaints_division = division.division_id
WHERE 
  complaints.complaints_current_status = 1 
  AND complaints.complaints_main_category = 17 
  AND complaints.complaints_sub_category = 21 
  AND DATE(complaints_created_date) <= (CURDATE() - INTERVAL 1 DAY)
GROUP BY 
  complaints.complaints_division;

        `
    )
    if (list.length > 0 && list_data.length > 0) {
      return { list, list_data }
    }
  } catch (err) {
    throw new ErrorHandler(err.message, 500) // Use ErrorHandler class
  } finally {
    if (conn) conn.release() // End connection to pool
  }
}

export const getRegion_m = async () => {
  let conn
  try {
    conn = await pool.getConnection()
    const [list] = await conn.query(
      `SELECT region_id, region_name from region where region_status = 1
        `
    )

    if (list.length > 0) {
      return { list }
    }
  } catch (err) {
    throw new ErrorHandler(err.message, 500) // Use ErrorHandler class
  } finally {
    if (conn) conn.release() // End connection to pool
  }
}
export const getCategoryData_m = async () => {
  let conn
  try {
    conn = await pool.getConnection()
    const [list] = await conn.query(
      `SELECT category_main_id, category_main_name from category_main where category_main_status = 1 and merge_show=1
        `
    )

    if (list.length > 0) {
      return { list }
    }
  } catch (err) {
    throw new ErrorHandler(err.message, 500) // Use ErrorHandler class
  } finally {
    if (conn) conn.release() // End connection to pool
  }
}

export const getComplaintsReport_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()

    let cond = ''
    if (data.region != '' && data.region != 0 && data.region != null) {
      cond += `AND complaints.complaints_region IN (${data.region}) `
    }
    if (
      data.categoryID != '' &&
      data.categoryID != 0 &&
      data.categoryID != null
    ) {
      cond += `AND complaints.complaints_main_category = '${data.categoryID}' `
    }
    if (data.startdate !== '' && data.enddate !== '') {
      cond += `AND DATE(complaints.complaints_created_date) >= '${data.startdate}' AND DATE(complaints.complaints_created_date) <= '${data.enddate}' `
    }
    const [list] = await conn.query(
      `SELECT 
    COUNT(complaints.complaints_id) AS total_count,
    SUM(CASE WHEN complaints.complaints_current_status = 1 THEN 1 ELSE 0 END) AS total_open,
    SUM(CASE WHEN complaints.complaints_current_status = 3 THEN 1 ELSE 0 END) AS total_attended,
    SUM(CASE WHEN complaints.complaints_current_status = 4 THEN 1 ELSE 0 END) AS total_close,
    SUM(CASE WHEN complaints.complaints_current_status = 5 THEN 1 ELSE 0 END) AS total_reopen,
    SUM(CASE WHEN complaints.complaints_current_status = 6 THEN 1 ELSE 0 END) AS total_forceclose,
    circle.circle_id, 
    circle.circle_name
    FROM complaints
    JOIN circle ON circle.circle_id = complaints.complaints_circle
    WHERE circle.circle_status = 1 
    ${cond} -- additional filters like region, category, and date range
    GROUP BY complaints.complaints_circle
        `
    )

    if (list.length > 0) {
      return { list }
    }
  } catch (err) {
    throw new ErrorHandler(err.message, 500) // Use ErrorHandler class
  } finally {
    if (conn) conn.release() // End connection to pool
  }
}

export const getCircleDetails_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()

    let cond = ''
    if (data.region != '' && data.region != 0 && data.region != null) {
      cond = `AND complaints.complaints_region IN (${data.region}) `
    }
    if (
      data.categoryID != '' &&
      data.categoryID != 0 &&
      data.categoryID != null
    ) {
      cond = `AND complaints.complaints_main_category = '${data.categoryID}' `
    }
    if (data.startdate !== '' && data.enddate !== '') {
      cond = `AND DATE(complaints.complaints_created_date) >= '${data.startdate}' AND DATE(complaints.complaints_created_date) <= '${data.enddate}' `
    }
    const [list] = await conn.query(
      `select division_name,COUNT(complaints_id) as total_count,
COUNT(CASE WHEN complaints_current_status=1 THEN complaints_id END) as open_count,
COUNT(CASE WHEN complaints_current_status=3 THEN complaints_id END) as attended_count,
COUNT(CASE WHEN complaints_current_status=4 THEN complaints_id END) as close_count,
COUNT(CASE WHEN complaints_current_status=5 THEN complaints_id END) as reopen_count,
COUNT(CASE WHEN complaints_current_status=6 THEN complaints_id END) as forceclose_count
from complaints left join division on division_id=complaints_division where complaints_division !=''and complaints_circle='${data.circle_id}' and division_status=1 ${cond} group by complaints_division
        `
    )

    if (list.length > 0) {
      return { list }
    }
  } catch (err) {
    throw new ErrorHandler(err.message, 500) // Use ErrorHandler class
  } finally {
    if (conn) conn.release() // End connection to pool
  }
}

export const getDTRComplaintCount_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    let cond = ''
    if (data.startdate !== '' && data.enddate !== '') {
      cond = `AND DATE(dtr_complain_date) >= '${data.startdate}' AND DATE(dtr_complain_date) <= '${data.enddate}' `
    }
    const [list] = await conn.query(
      `select COUNT(dtr_complain_id) as total_complaints,
        COUNT(CASE WHEN dtr_complain_status = 1 THEN dtr_complain_id END) as total_open,
        COUNT(CASE WHEN dtr_complain_status = 6 THEN dtr_complain_id END) as total_close,
        COUNT(CASE WHEN dtr_complain_status = 11 THEN dtr_complain_id END) as total_forceclose
        from dtr_complaints where dtr_complain_id!=0 ${cond}
      `
    )
    if (list.length > 0) {
      return { list }
    }
  } catch (err) {
    throw new ErrorHandler(err.message, 500)
  } finally {
    if (conn) conn.release()
  }
}

export const getRegionWiseDtrReport_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    let cond = ''
    if (data.startdate !== '' && data.enddate !== '') {
      cond = `AND DATE(dtr_complain_date) >= '${data.startdate}' AND DATE(dtr_complain_date) <= '${data.enddate}' `
    }
    const [list] = await conn.query(
      `select COUNT(dtr_complain_id) as total_count,
COUNT(CASE WHEN dtr_complain_status=1 then dtr_complain_id END) as total_open,

COUNT(CASE WHEN dtr_complain_status=6 then dtr_complain_id END) as total_close,

COUNT(CASE WHEN dtr_complain_status=11 then dtr_complain_id END) as total_forceclose,
region_id,region_name
        from dtr_complaints left join region on (region_id = dtr_complain_region_id) where dtr_complain_id!=0 ${cond} group by dtr_complain_region_id
      `
    )
    if (list.length > 0) {
      return { list }
    }
  } catch (err) {
    throw new ErrorHandler(err.message, 500)
  } finally {
    if (conn) conn.release()
  }
}

export const getCircleWiseDtrReport_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    let cond = ''
    if (data.startdate !== '' && data.enddate !== '') {
      cond = `AND DATE(dtr_complain_date) >= '${data.startdate}' AND DATE(dtr_complain_date) <= '${data.enddate}' `
    }
    const [list] = await conn.query(
      `select COUNT(dtr_complain_id) as total_count,
COUNT(CASE WHEN dtr_complain_status=1 then dtr_complain_id END) as total_open,

COUNT(CASE WHEN dtr_complain_status=6 then dtr_complain_id END) as total_close,

COUNT(CASE WHEN dtr_complain_status=11 then dtr_complain_id END) as total_forceclose,
circle_id,circle_name
        from dtr_complaints left join circle on (circle_id = dtr_complain_circle_id) where dtr_complain_id!=0 ${cond} group by dtr_complain_circle_id
      `
    )
    if (list.length > 0) {
      return { list }
    }
  } catch (err) {
    throw new ErrorHandler(err.message, 500)
  } finally {
    if (conn) conn.release()
  }
}
export const getDivisionWiseDtrReport_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    let cond = ''
    if (data.startdate !== '' && data.enddate !== '') {
      cond = `AND DATE(dtr_complain_date) >= '${data.startdate}' AND DATE(dtr_complain_date) <= '${data.enddate}' `
    }
    const [list] = await conn.query(
      `select COUNT(dtr_complain_id) as total_count,
COUNT(CASE WHEN dtr_complain_status=1 then dtr_complain_id END) as total_open,

COUNT(CASE WHEN dtr_complain_status=6 then dtr_complain_id END) as total_close,

COUNT(CASE WHEN dtr_complain_status=11 then dtr_complain_id END) as total_forceclose,
division_id,division_name 
        from dtr_complaints left join division on (division_id = dtr_complain_division_id ) where dtr_complain_id!=0 ${cond} group by dtr_complain_division_id
      `
    )
    if (list.length > 0) {
      return { list }
    }
  } catch (err) {
    throw new ErrorHandler(err.message, 500)
  } finally {
    if (conn) conn.release()
  }
}

///this code give data in 9 sec//////
// export const getComplaintCount_m = async (data) => {
//   let conn
//   try {
//     conn = await pool.getConnection()

//     // Build date condition only if startdate and enddate are provided
//     let cond = ''
//     if (data.startdate && data.enddate) {
//       cond = `AND DATE(complaints_created_date) BETWEEN '${data.startdate}' AND '${data.enddate}' `
//     }

//     // Optimized single query using conditional aggregation
//     const [list] = await conn.query(`
//       SELECT
//         type,
//         total_complaints,
//         total_open,
//         total_attended,
//         total_close,
//         total_reopen,
//         total_forceclose
//       FROM (
//         SELECT 'current' AS type,
//             COUNT(complaints_id) AS total_complaints,
//             COUNT(CASE WHEN complaints_current_status = 1 THEN complaints_id END) AS total_open,
//             COUNT(CASE WHEN complaints_current_status = 3 THEN complaints_id END) AS total_attended,
//             COUNT(CASE WHEN complaints_current_status = 4 THEN complaints_id END) AS total_close,
//             COUNT(CASE WHEN complaints_current_status = 5 THEN complaints_id END) AS total_reopen,
//             COUNT(CASE WHEN complaints_current_status = 6 THEN complaints_id END) AS total_forceclose
//         FROM complaints
//         WHERE complaints_id != 0 ${cond}

//         UNION ALL

//         SELECT 'old' AS type,
//             COUNT(complaints_id) AS total_complaints,
//             COUNT(CASE WHEN complaints_current_status = 4 THEN complaints_id END) AS total_close,
//             0 AS total_open,
//             0 AS total_attended,
//             0 AS total_reopen,
//             COUNT(CASE WHEN complaints_current_status = 6 THEN complaints_id END) AS total_forceclose
//         FROM complaints_closed
//         WHERE complaints_id != 0 ${cond}

//         UNION ALL

//         SELECT '20_21' AS type,
//             COUNT(complaints_id) AS total_complaints,
//             0 AS total_open,
//             0 AS total_attended,
//             0 AS total_close,
//             0 AS total_reopen,
//             0 AS total_forceclose
//         FROM complaints_closed_20_21
//         WHERE complaints_id != 0 ${cond}

//         UNION ALL

//         SELECT '21_22' AS type,
//             COUNT(complaints_id) AS total_complaints,
//             0 AS total_open,
//             0 AS total_attended,
//             0 AS total_close,
//             0 AS total_reopen,
//             0 AS total_forceclose
//         FROM complaints_closed_21_22
//         WHERE complaints_id != 0 ${cond}
//       ) AS complaint_summary
//     `)

//     // Log raw data to ensure query returned data
//     console.log('Raw query result:', list)

//     // Aggregating the results
//     let total_complaints = 0,
//       total_open = 0,
//       total_attended = 0,
//       total_close = 0

//     list.forEach((row) => {
//       if (row.type === 'current') {
//         total_complaints += row.total_complaints
//         total_open += row.total_open + row.total_reopen // Open + Reopen for current period
//         total_attended += row.total_attended // Attended for current period
//         total_close += row.total_close + row.total_forceclose // Close + ForceClose for current period
//       } else if (row.type === 'old') {
//         total_complaints += row.total_complaints // Add old complaints to total
//         total_close += row.total_close + row.total_forceclose // Close + ForceClose for old period
//       } else if (row.type === '20_21' || row.type === '21_22') {
//         total_complaints += row.total_complaints // Add complaints from 20_21 and 21_22
//         total_close += row.total_complaints // Add 20_21 and 21_22 complaints to close total
//       }
//     })

//     const fetch = {
//       total_complaints,
//       total_open,
//       total_attended,
//       total_close,
//     }

//     console.log('Final aggregated result:', fetch) // Log final result

//     return { fetch }
//   } catch (err) {
//     throw new ErrorHandler(err.message, 500)
//   } finally {
//     if (conn) conn.release()
//   }
// }

//this code get data in 11 sec
export const getComplaintCount_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    let cond = ''
    if (data.startdate !== '' && data.enddate !== '') {
      cond = `AND DATE(complaints_created_date) >= '${data.startdate}' AND DATE(complaints_created_date) <= '${data.enddate}' `
    }
    const [list] = await conn.query(
      `SELECT 'current' AS type,
              COUNT(complaints_id) AS total_complaints,
              COUNT(CASE WHEN complaints_current_status = 1 THEN complaints_id END) AS total_open,
              COUNT(CASE WHEN complaints_current_status = 3 THEN complaints_id END) AS total_attended,
              COUNT(CASE WHEN complaints_current_status = 4 THEN complaints_id END) AS total_close,
              COUNT(CASE WHEN complaints_current_status = 5 THEN complaints_id END) AS total_reopen,
              COUNT(CASE WHEN complaints_current_status = 6 THEN complaints_id END) AS total_forceclose
        FROM complaints
        WHERE complaints_id != 0 ${cond}
        
        UNION ALL
        
        SELECT 'old' AS type,
              COUNT(complaints_id) AS total_complaints,
              COUNT(CASE WHEN complaints_current_status = 1 THEN complaints_id END) AS total_open,
              COUNT(CASE WHEN complaints_current_status = 3 THEN complaints_id END) AS total_attended,
              COUNT(CASE WHEN complaints_current_status = 4 THEN complaints_id END) AS total_close,
              COUNT(CASE WHEN complaints_current_status = 5 THEN complaints_id END) AS total_reopen,
              COUNT(CASE WHEN complaints_current_status = 6 THEN complaints_id END) AS total_forceclose
        FROM complaints_closed
        WHERE complaints_id != 0 ${cond}
        
        UNION ALL
        
        SELECT '20_21' AS type,
              COUNT(complaints_id) AS total_complaints,
              0 AS total_open,
              0 AS total_attended,
              0 AS total_close,
              0 AS total_reopen,
              0 AS total_forceclose
        FROM complaints_closed_20_21
        WHERE complaints_id != 0 ${cond}

        UNION ALL
        
        SELECT '21_22' AS type,
              COUNT(complaints_id) AS total_complaints,
              0 AS total_open,
              0 AS total_attended,
              0 AS total_close,
              0 AS total_reopen,
              0 AS total_forceclose
        FROM complaints_closed_21_22
        WHERE complaints_id != 0 ${cond}`
    )

    let total_complaints = 0,
      total_open = 0,
      total_attended = 0,
      total_close = 0

    list.forEach((row) => {
      if (row.type === 'current') {
        total_complaints += row.total_complaints
        total_open += row.total_open + row.total_reopen // Open + Reopen for current period
        total_attended += row.total_attended // Attended for current period
        total_close += row.total_close + row.total_forceclose // Close + ForceClose for current period
      } else if (row.type === 'old') {
        total_complaints += row.total_complaints // Add old complaints to total
        total_close += row.total_close + row.total_forceclose // Close + ForceClose for old period
      } else if (row.type === '20_21' || row.type === '21_22') {
        total_complaints += row.total_complaints // Add complaints from 20_21 and 21_22
        total_close += row.total_complaints // Add 20_21 and 21_22 complaints to close total
      }
    })

    const fetch = {
      total_complaints,
      total_open,
      total_attended,
      total_close,
    }

    return { fetch }
  } catch (err) {
    throw new ErrorHandler(err.message, 500)
  } finally {
    if (conn) conn.release()
  }
}
export const getOpenAgeingAnalysis_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    let cond = ''
    if (data.startdate !== '' && data.enddate !== '') {
      cond = `AND DATE(complaints_created_date) >= '${data.startdate}' AND DATE(complaints_created_date) <= '${data.enddate}' `
    }
    const [list] = await conn.query(
      `SELECT
      COUNT(complaints_id) AS total_complaints_open,
      SUM(CASE WHEN duration < 5 THEN 1 ELSE 0 END) AS from_4_hour,
      SUM(CASE WHEN duration >= 5 AND duration < 9 THEN 1 ELSE 0 END) AS from_8_hour,
      SUM(CASE WHEN duration >= 9 AND duration < 13 THEN 1 ELSE 0 END) AS from_12_hour,
      SUM(CASE WHEN duration >= 13 AND duration < 25 THEN 1 ELSE 0 END) AS from_24_hour,
      SUM(CASE WHEN duration >= 25 THEN 1 ELSE 0 END) AS more_than_24_hour
  FROM (
      SELECT 
        complaints_id,
        TIMESTAMPDIFF(HOUR, complaints_created_date, complaints_last_updated_date) AS duration
      FROM complaints
      WHERE complaints_current_status = 1
      ${cond}
  ) AS complaint_durations`
    )
    if (list.length > 0) {
      return { list }
    }
  } catch (err) {
    throw new ErrorHandler(err.message, 500)
  } finally {
    if (conn) conn.release()
  }
}

export const getOpenCategoryAnalysis_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    let cond = ''
    if (data.startdate !== '' && data.enddate !== '') {
      cond = `AND DATE(complaints_created_date) >= '${data.startdate}' AND DATE(complaints_created_date) <= '${data.enddate}' `
    }
    const [list] = await conn.query(
      `SELECT 
          COUNT(complaints.complaints_id) AS total_count, 
          complaints.complaints_main_category AS category_main_id, 
          category_main.category_main_name 
          FROM 
          complaints 
          INNER JOIN 
          category_main ON complaints.complaints_main_category = category_main.category_main_id 
          WHERE 
          complaints.complaints_main_category <> '' 
          AND complaints.complaints_current_status = 1 
          AND category_main.category_main_status = 1
          ${cond}  
          GROUP BY 
          complaints.complaints_main_category 
          ORDER BY 
          total_count DESC;
        `
    )
    if (list.length > 0) {
      return { list }
    }
  } catch (err) {
    throw new ErrorHandler(err.message, 500)
  } finally {
    if (conn) conn.release()
  }
}
export const getTimeWiseCategoryDetails_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    let cond = ''
    if (data.region != '' && data.region != 0 && data.region != null) {
      cond = `AND complaints.complaints_region IN (${data.region}) `
    }
    if (data.startdate !== '' && data.enddate !== '') {
      cond = `AND DATE(complaints_created_date) >= '${data.startdate}' AND DATE(complaints_created_date) <= '${data.enddate}' `
    }
    const [list] = await conn.query(
      `SELECT 
    SUM(CASE WHEN complaints_main_category = 17 THEN 1 ELSE 0 END) AS supply,
    SUM(CASE WHEN complaints_main_category = 12 THEN 1 ELSE 0 END) AS electricity,
    SUM(CASE WHEN complaints_main_category = 16 THEN 1 ELSE 0 END) AS meter,
    SUM(CASE WHEN complaints_main_category = 20 THEN 1 ELSE 0 END) AS accident,
    HOUR(complaints_created_date) AS mtime
FROM 
    complaints
WHERE 
    complaints_id IS NOT NULL ${cond}
GROUP BY 
    HOUR(complaints_created_date);
        `
    )
    if (list.length > 0) {
      return { list }
    }
  } catch (err) {
    throw new ErrorHandler(err.message, 500)
  } finally {
    if (conn) conn.release()
  }
}

export const getCategoryWiseComplaintMonth_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    const [list] = await conn.query(
      `SELECT 
    category_main.category_main_name,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 1 AND complaints.complaints_current_status = 1 THEN 1 END) AS january,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 2 AND complaints.complaints_current_status = 1 THEN 1 END) AS february,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 3 AND complaints.complaints_current_status = 1 THEN 1 END) AS march,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 4 AND complaints.complaints_current_status = 1 THEN 1 END) AS april,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 5 AND complaints.complaints_current_status = 1 THEN 1 END) AS may,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 6 AND complaints.complaints_current_status = 1 THEN 1 END) AS june,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 7 AND complaints.complaints_current_status = 1 THEN 1 END) AS july,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 8 AND complaints.complaints_current_status = 1 THEN 1 END) AS august,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 9 AND complaints.complaints_current_status = 1 THEN 1 END) AS september,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 10 AND complaints.complaints_current_status = 1 THEN 1 END) AS october,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 11 AND complaints.complaints_current_status = 1 THEN 1 END) AS november,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 12 AND complaints.complaints_current_status = 1 THEN 1 END) AS december
FROM 
    complaints
JOIN 
    category_main ON category_main.category_main_id = complaints.complaints_main_category
WHERE 
    complaints.complaints_created_date BETWEEN CONCAT(YEAR(CURDATE()), '-01-01') AND CONCAT(YEAR(CURDATE()), '-12-31')
GROUP BY 
    category_main.category_main_id
        `
    )
    if (list.length > 0) {
      return { list }
    }
  } catch (err) {
    throw new ErrorHandler(err.message, 500)
  } finally {
    if (conn) conn.release()
  }
}

export const getRegionComplaintMonth_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    const [list] = await conn.query(
      `SELECT 
    region.region_name,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 1 AND complaints.complaints_current_status = 1 THEN 1 END) AS january,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 2 AND complaints.complaints_current_status = 1 THEN 1 END) AS february,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 3 AND complaints.complaints_current_status = 1 THEN 1 END) AS march,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 4 AND complaints.complaints_current_status = 1 THEN 1 END) AS april,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 5 AND complaints.complaints_current_status = 1 THEN 1 END) AS may,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 6 AND complaints.complaints_current_status = 1 THEN 1 END) AS june,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 7 AND complaints.complaints_current_status = 1 THEN 1 END) AS july,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 8 AND complaints.complaints_current_status = 1 THEN 1 END) AS august,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 9 AND complaints.complaints_current_status = 1 THEN 1 END) AS september,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 10 AND complaints.complaints_current_status = 1 THEN 1 END) AS october,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 11 AND complaints.complaints_current_status = 1 THEN 1 END) AS november,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 12 AND complaints.complaints_current_status = 1 THEN 1 END) AS december
FROM complaints
JOIN region ON region.region_id = complaints.complaints_region
WHERE complaints.complaints_created_date BETWEEN CONCAT(YEAR(CURDATE()), '-01-01') AND CONCAT(YEAR(CURDATE()), '-12-31')
GROUP BY region.region_id
        `
    )
    if (list.length > 0) {
      return { list }
    }
  } catch (err) {
    throw new ErrorHandler(err.message, 500)
  } finally {
    if (conn) conn.release()
  }
}

export const getCircleComplaintMonth_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    const [list] = await conn.query(
      `SELECT circle_name,
count(case when  month(complaints_created_date) =1 and complaints.complaints_current_status=1 then 1 else  null end )as january,
count(case when  month(complaints_created_date) =2 and complaints.complaints_current_status=1 then 1 else  null end )as february,
count(case when  month(complaints_created_date) =3 and complaints.complaints_current_status=1 then 1 else  null end )as march,
count(case when  month(complaints_created_date) =4 and complaints.complaints_current_status=1 then 1 else  null end )as april,
count(case when  month(complaints_created_date) =5 and complaints.complaints_current_status=1 then 1 else  null end )as may,
count(case when  month(complaints_created_date) =6 and complaints.complaints_current_status=1 then 1 else  null end )as june,
count(case when  month(complaints_created_date) =7 and complaints.complaints_current_status=1 then 1 else  null end )as july,
count(case when  month(complaints_created_date) =8 and complaints.complaints_current_status=1 then 1 else  null end )as august,
count(case when  month(complaints_created_date) =9 and complaints.complaints_current_status=1 then 1 else  null end )as september,
count(case when  month(complaints_created_date) =10 and complaints.complaints_current_status=1 then 1 else  null end )as october,
count(case when  month(complaints_created_date) =11 and complaints.complaints_current_status=1 then 1 else  null end )as november,
count(case when  month(complaints_created_date) =12 and complaints.complaints_current_status=1 then 1 else  null end )as december
      from complaints
      left join circle on circle.circle_id=complaints.complaints_circle
      where  date(complaints.complaints_created_date) BETWEEN CONCAT(YEAR(CURDATE()), '-01-01') AND CONCAT(YEAR(CURDATE()), '-12-31')
      group by circle.circle_id;
        `
    )
    if (list.length > 0) {
      return { list }
    }
  } catch (err) {
    throw new ErrorHandler(err.message, 500)
  } finally {
    if (conn) conn.release()
  }
}
export const getDivisionComplaintMonth_m = async (data) => {
  let conn
  try {
    conn = await pool.getConnection()
    const [list] = await conn.query(
      `SELECT 
    division.division_name,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 1 AND complaints.complaints_current_status = 1 THEN 1 END) AS january,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 2 AND complaints.complaints_current_status = 1 THEN 1 END) AS february,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 3 AND complaints.complaints_current_status = 1 THEN 1 END) AS march,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 4 AND complaints.complaints_current_status = 1 THEN 1 END) AS april,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 5 AND complaints.complaints_current_status = 1 THEN 1 END) AS may,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 6 AND complaints.complaints_current_status = 1 THEN 1 END) AS june,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 7 AND complaints.complaints_current_status = 1 THEN 1 END) AS july,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 8 AND complaints.complaints_current_status = 1 THEN 1 END) AS august,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 9 AND complaints.complaints_current_status = 1 THEN 1 END) AS september,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 10 AND complaints.complaints_current_status = 1 THEN 1 END) AS october,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 11 AND complaints.complaints_current_status = 1 THEN 1 END) AS november,
    COUNT(CASE WHEN MONTH(complaints.complaints_created_date) = 12 AND complaints.complaints_current_status = 1 THEN 1 END) AS december
FROM 
    complaints
JOIN 
    division ON division.division_id = complaints.complaints_division
WHERE 
    complaints.complaints_created_date BETWEEN CONCAT(YEAR(CURDATE()), '-01-01') AND CONCAT(YEAR(CURDATE()), '-12-31')
GROUP BY 
    division.division_id
        `
    )
    if (list.length > 0) {
      return { list }
    }
  } catch (err) {
    throw new ErrorHandler(err.message, 500)
  } finally {
    if (conn) conn.release()
  }
}

export const getComplaintsList_m = async (fetchData) => {
  let conn
  try {
    conn = await pool.getConnection()
    let cond = ''
    if (fetchData.startdate !== '' && fetchData.enddate !== '') {
      cond = `And date(complaints.complaints_created_date) >= '${fetchData.startdate}' AND date(complaints.complaints_created_date) <= '${fetchData.enddate}' `
    }

    if (fetchData.complaints_id !== null) {
      cond = ` And complaints.complaints_id = '${fetchData.complaints_id}'`
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
        id: 'C-' + v_list.complaints_id,
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
        cate_name: cate_name + '/' + cate_sub_name,
        //cate_sub_name: cate_sub_name,
        agent: agent,
        gang: gang,
        officer1: officer1,
        complaints_created_date: v_list.complaints_created_date,
        complaints_last_updated_date: v_list.complaints_last_updated_date,
        wdc: wdc,
        rm_count: rm_count,
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
