function createAssignmentRepository({ db, now }) {
  function getById(assignmentId) {
    return db.get('SELECT * FROM assignments WHERE id = ?', [assignmentId]);
  }

  function list({ courseId = '', lessonId = '', status = '', user = null } = {}) {
    const conditions = [];
    const params = [];
    if (courseId) {
      conditions.push('course_id = ?');
      params.push(courseId);
    }
    if (lessonId) {
      conditions.push('lesson_id = ?');
      params.push(lessonId);
    }
    if (user?.role === 'student') {
      conditions.push('status = ?');
      params.push('published');
    } else if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    let sql = 'SELECT * FROM assignments';
    if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`;
    sql += ' ORDER BY due_at IS NULL, due_at ASC, updated_at DESC';
    return db.all(sql, params);
  }

  function create(payload, userId) {
    const createdAt = now();
    const info = db.run(
      `INSERT INTO assignments (course_id, lesson_id, title, description, requirements, due_at, submit_type, rubric, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.courseId,
        payload.lessonId,
        payload.title,
        payload.description,
        payload.requirements,
        payload.dueAt,
        payload.submitType,
        JSON.stringify(payload.rubric || []),
        payload.status,
        userId,
        createdAt,
        createdAt
      ]
    );
    return getById(info.lastInsertRowid);
  }

  function update(assignmentId, payload) {
    db.run(
      `UPDATE assignments
       SET course_id = ?, lesson_id = ?, title = ?, description = ?, requirements = ?, due_at = ?, submit_type = ?, rubric = ?, status = ?, updated_at = ?
       WHERE id = ?`,
      [
        payload.courseId,
        payload.lessonId,
        payload.title,
        payload.description,
        payload.requirements,
        payload.dueAt,
        payload.submitType,
        JSON.stringify(payload.rubric || []),
        payload.status,
        now(),
        assignmentId
      ]
    );
    return getById(assignmentId);
  }

  function listSubmissions(assignmentId, user = null) {
    const params = [assignmentId];
    let sql = `
      SELECT s.*, u.name AS student_name, u.email AS student_email
      FROM assignment_submissions s
      JOIN users u ON u.id = s.student_id
      WHERE s.assignment_id = ?
    `;
    if (user?.role === 'student') {
      sql += ' AND s.student_id = ?';
      params.push(user.id);
    }
    sql += ' ORDER BY s.updated_at DESC';
    return db.all(sql, params);
  }

  function findSubmissionForStudent(assignmentId, studentId) {
    return db.get(
      'SELECT id FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?',
      [assignmentId, studentId]
    );
  }

  function getSubmissionByAssignmentAndStudent(assignmentId, studentId) {
    return db.get(
      `SELECT s.*, u.name AS student_name, u.email AS student_email
       FROM assignment_submissions s
       JOIN users u ON u.id = s.student_id
       WHERE s.assignment_id = ? AND s.student_id = ?`,
      [assignmentId, studentId]
    );
  }

  function getSubmissionById(submissionId) {
    return db.get(
      `SELECT s.*, u.name AS student_name, u.email AS student_email
       FROM assignment_submissions s
       JOIN users u ON u.id = s.student_id
       WHERE s.id = ?`,
      [submissionId]
    );
  }

  function upsertSubmission({
    assignmentId,
    studentId,
    content,
    link,
    attachmentNote,
    status,
    score,
    feedback,
    reviewedBy,
    reviewedAt
  }) {
    const submittedAt = now();
    const existing = findSubmissionForStudent(assignmentId, studentId);

    db.transaction((trx) => {
      if (existing) {
        trx.run(
          `UPDATE assignment_submissions
           SET content = ?, link = ?, attachment_note = ?, status = ?, score = ?, feedback = ?, reviewed_by = ?, reviewed_at = ?, submitted_at = ?, updated_at = ?
           WHERE id = ?`,
          [content, link, attachmentNote, status, score, feedback, reviewedBy, reviewedAt, submittedAt, submittedAt, existing.id]
        );
        return;
      }

      trx.run(
        `INSERT INTO assignment_submissions (assignment_id, student_id, content, link, attachment_note, status, score, feedback, reviewed_by, submitted_at, reviewed_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [assignmentId, studentId, content, link, attachmentNote, status, score, feedback, reviewedBy, submittedAt, reviewedAt, submittedAt]
      );
    });

    return getSubmissionByAssignmentAndStudent(assignmentId, studentId);
  }

  function reviewSubmission({ assignmentId, submissionId, status, score, feedback, reviewedBy }) {
    const reviewedAt = now();
    const result = db.run(
      `UPDATE assignment_submissions
       SET status = ?, score = ?, feedback = ?, reviewed_by = ?, reviewed_at = ?, updated_at = ?
       WHERE id = ? AND assignment_id = ?`,
      [status, score, feedback, reviewedBy, reviewedAt, reviewedAt, submissionId, assignmentId]
    );
    if (!result.changes) return null;
    return getSubmissionById(submissionId);
  }

  return {
    create,
    getById,
    list,
    listSubmissions,
    reviewSubmission,
    update,
    upsertSubmission
  };
}

module.exports = {
  createAssignmentRepository
};
