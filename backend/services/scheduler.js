const { db } = require('../database');

/**
 * 스케줄 변경 최적화 알고리즘
 * 학생의 수업 시간 변경 요청 시 가능 여부를 판단하고 최적의 대안을 제시
 */
const optimizeScheduleChange = (student_id, current_schedule_id, requested_schedule_id) => {
  return new Promise((resolve, reject) => {
    // 1. 요청된 스케줄 정보 가져오기
    const scheduleQuery = `
      SELECT s.*, c.max_students, c.name as course_name,
             COUNT(e.id) as enrolled_count
      FROM schedules s
      JOIN courses c ON s.course_id = c.id
      LEFT JOIN enrollments e ON s.id = e.schedule_id AND e.status = 'active'
      WHERE s.id = ?
      GROUP BY s.id
    `;

    db.get(scheduleQuery, [requested_schedule_id], (err, requestedSchedule) => {
      if (err) {
        return reject(err);
      }

      if (!requestedSchedule) {
        return resolve({
          feasible: false,
          reason: 'Requested schedule not found',
          alternatives: []
        });
      }

      // 2. 수용 인원 확인
      const hasCapacity = requestedSchedule.enrolled_count < requestedSchedule.max_students;

      if (!hasCapacity) {
        // 3. 수용 인원이 없으면 대안 찾기
        findAlternativeSchedules(student_id, requestedSchedule, (alternatives) => {
          resolve({
            feasible: false,
            reason: 'Requested schedule is full',
            enrolled_count: requestedSchedule.enrolled_count,
            max_students: requestedSchedule.max_students,
            alternatives
          });
        });
        return;
      }

      // 4. 학생의 다른 수업과 시간 충돌 확인
      const conflictQuery = `
        SELECT s.*, c.name as course_name
        FROM enrollments e
        JOIN schedules s ON e.schedule_id = s.id
        JOIN courses c ON s.course_id = c.id
        WHERE e.student_id = ? AND e.status = 'active'
          AND s.id != ?
          AND s.day_of_week = ?
          AND (
            (s.start_time <= ? AND s.end_time > ?) OR
            (s.start_time < ? AND s.end_time >= ?) OR
            (s.start_time >= ? AND s.end_time <= ?)
          )
      `;

      db.all(
        conflictQuery,
        [
          student_id,
          current_schedule_id || 0,
          requestedSchedule.day_of_week,
          requestedSchedule.start_time,
          requestedSchedule.start_time,
          requestedSchedule.end_time,
          requestedSchedule.end_time,
          requestedSchedule.start_time,
          requestedSchedule.end_time
        ],
        (err, conflicts) => {
          if (err) {
            return reject(err);
          }

          if (conflicts.length > 0) {
            // 충돌이 있으면 대안 제시
            findAlternativeSchedules(student_id, requestedSchedule, (alternatives) => {
              resolve({
                feasible: false,
                reason: 'Schedule conflict with existing enrollments',
                conflicts,
                alternatives
              });
            });
          } else {
            // 충돌 없고 수용 가능하면 승인
            resolve({
              feasible: true,
              reason: 'Schedule change is feasible',
              enrolled_count: requestedSchedule.enrolled_count,
              max_students: requestedSchedule.max_students
            });
          }
        }
      );
    });
  });
};

/**
 * 대안 스케줄 찾기
 * 같은 과목의 다른 시간대를 추천
 */
const findAlternativeSchedules = (student_id, originalSchedule, callback) => {
  const query = `
    SELECT s.*, c.name as course_name,
           COUNT(e.id) as enrolled_count,
           c.max_students
    FROM schedules s
    JOIN courses c ON s.course_id = c.id
    LEFT JOIN enrollments e ON s.id = e.schedule_id AND e.status = 'active'
    WHERE s.course_id = (
      SELECT course_id FROM schedules WHERE id = ?
    )
    AND s.id != ?
    AND s.active = 1
    GROUP BY s.id
    HAVING enrolled_count < max_students
    ORDER BY s.day_of_week, s.start_time
    LIMIT 5
  `;

  db.all(query, [originalSchedule.id, originalSchedule.id], (err, alternatives) => {
    if (err) {
      return callback([]);
    }

    // 각 대안에 대해 충돌 여부 확인
    const alternativesWithConflictCheck = [];
    let processed = 0;

    if (alternatives.length === 0) {
      return callback([]);
    }

    alternatives.forEach((alt) => {
      const conflictQuery = `
        SELECT COUNT(*) as conflict_count
        FROM enrollments e
        JOIN schedules s ON e.schedule_id = s.id
        WHERE e.student_id = ? AND e.status = 'active'
          AND s.day_of_week = ?
          AND (
            (s.start_time <= ? AND s.end_time > ?) OR
            (s.start_time < ? AND s.end_time >= ?) OR
            (s.start_time >= ? AND s.end_time <= ?)
          )
      `;

      db.get(
        conflictQuery,
        [
          student_id,
          alt.day_of_week,
          alt.start_time,
          alt.start_time,
          alt.end_time,
          alt.end_time,
          alt.start_time,
          alt.end_time
        ],
        (err, result) => {
          alt.has_conflict = !err && result.conflict_count > 0;
          alternativesWithConflictCheck.push(alt);
          processed++;

          if (processed === alternatives.length) {
            // 충돌 없는 것을 우선 정렬
            alternativesWithConflictCheck.sort((a, b) => {
              if (a.has_conflict !== b.has_conflict) {
                return a.has_conflict ? 1 : -1;
              }
              return 0;
            });
            callback(alternativesWithConflictCheck);
          }
        }
      );
    });
  });
};

/**
 * 최적의 스케줄 추천
 * 학생의 현재 스케줄과 선호도를 기반으로 최적의 수업 시간을 추천
 */
const recommendOptimalSchedule = (student_id, course_id) => {
  return new Promise((resolve, reject) => {
    // 학생의 현재 수업 패턴 분석
    const patternQuery = `
      SELECT s.day_of_week, s.start_time, s.end_time
      FROM enrollments e
      JOIN schedules s ON e.schedule_id = s.id
      WHERE e.student_id = ? AND e.status = 'active'
      ORDER BY s.day_of_week, s.start_time
    `;

    db.all(patternQuery, [student_id], (err, currentSchedules) => {
      if (err) {
        return reject(err);
      }

      // 해당 과목의 사용 가능한 모든 스케줄 가져오기
      const availableQuery = `
        SELECT s.*, c.name as course_name,
               COUNT(e.id) as enrolled_count,
               c.max_students
        FROM schedules s
        JOIN courses c ON s.course_id = c.id
        LEFT JOIN enrollments e ON s.id = e.schedule_id AND e.status = 'active'
        WHERE s.course_id = ? AND s.active = 1
        GROUP BY s.id
        HAVING enrolled_count < max_students
        ORDER BY s.day_of_week, s.start_time
      `;

      db.all(availableQuery, [course_id], (err, availableSchedules) => {
        if (err) {
          return reject(err);
        }

        // 각 스케줄에 점수 부여 (충돌 없음, 시간대 선호도 등)
        const scoredSchedules = availableSchedules.map((schedule) => {
          let score = 100;

          // 충돌 체크
          const hasConflict = currentSchedules.some((current) => {
            return (
              current.day_of_week === schedule.day_of_week &&
              ((current.start_time <= schedule.start_time && current.end_time > schedule.start_time) ||
               (current.start_time < schedule.end_time && current.end_time >= schedule.end_time) ||
               (current.start_time >= schedule.start_time && current.end_time <= schedule.end_time))
            );
          });

          if (hasConflict) {
            score -= 50;
          }

          // 수용률 (낮을수록 좋음)
          const capacityRatio = schedule.enrolled_count / schedule.max_students;
          score -= capacityRatio * 20;

          // 연속 수업 선호도 (기존 수업과 같은 날 있으면 가점)
          const sameDayClass = currentSchedules.some(
            (current) => current.day_of_week === schedule.day_of_week
          );
          if (sameDayClass) {
            score += 10;
          }

          return { ...schedule, score, has_conflict: hasConflict };
        });

        // 점수순으로 정렬
        scoredSchedules.sort((a, b) => b.score - a.score);

        resolve({
          recommended: scoredSchedules.filter((s) => !s.has_conflict).slice(0, 3),
          all_available: scoredSchedules
        });
      });
    });
  });
};

module.exports = {
  optimizeScheduleChange,
  findAlternativeSchedules,
  recommendOptimalSchedule
};
