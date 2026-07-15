function createAssignmentRepository({ db, now }) {
  function listNormalizedAttachments(submissionId) {
    return db.all(
      `SELECT id, original_name AS name, storage_key AS path, mime_type AS mimeType,
              file_size AS size, sort_order AS sortOrder
       FROM assignment_submission_attachments
       WHERE submission_id = ?
       ORDER BY sort_order ASC, id ASC`,
      [submissionId]
    );
  }

  function withNormalizedAttachments(row) {
    if (!row) return row;
    const attachments = listNormalizedAttachments(row.id);
    return attachments.length ? { ...row, attachments: JSON.stringify(attachments) } : row;
  }

  function replaceNormalizedAttachments(executor, submissionId, attachments, createdAt) {
    executor.run('DELETE FROM assignment_submission_attachments WHERE submission_id = ?', [submissionId]);
    (Array.isArray(attachments) ? attachments : []).forEach((attachment, index) => {
      const storageKey = String(attachment?.path || '').trim().replace(/\\/g, '/');
      if (!storageKey) return;
      const fileSize = Number(attachment?.size);
      executor.run(
        `INSERT OR IGNORE INTO assignment_submission_attachments
         (submission_id, original_name, storage_key, mime_type, file_size, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          submissionId,
          String(attachment?.name || storageKey.split('/').pop() || '附件').trim() || '附件',
          storageKey,
          String(attachment?.mimeType || attachment?.mime_type || '').trim() || null,
          Number.isFinite(fileSize) && fileSize >= 0 ? fileSize : 0,
          index,
          createdAt
        ]
      );
    });
  }

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
    return db.all(sql, params).map(withNormalizedAttachments);
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
    } else if (user?.role === 'teacher') {
      sql += `
        AND EXISTS (
          SELECT 1 FROM assignments ass
          WHERE ass.id = s.assignment_id AND ass.created_by = ?
        )
        AND EXISTS (
          SELECT 1 FROM teacher_student_links tsl
          WHERE tsl.teacher_id = ? AND tsl.student_id = s.student_id
        )`;
      params.push(user.id, user.id);
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
    return withNormalizedAttachments(db.get(
      `SELECT s.*, u.name AS student_name, u.email AS student_email
       FROM assignment_submissions s
       JOIN users u ON u.id = s.student_id
       WHERE s.assignment_id = ? AND s.student_id = ?`,
      [assignmentId, studentId]
    ));
  }

  function getSubmissionById(submissionId) {
    return withNormalizedAttachments(db.get(
      `SELECT s.*, u.name AS student_name, u.email AS student_email
       FROM assignment_submissions s
       JOIN users u ON u.id = s.student_id
       WHERE s.id = ?`,
      [submissionId]
    ));
  }

  function upsertSubmission({
    assignmentId,
    studentId,
    content,
    link,
    attachmentNote,
    attachments,
    status,
    score,
    feedback,
    reviewedBy,
    reviewedAt
  }) {
    const submittedAt = now();
    const existing = findSubmissionForStudent(assignmentId, studentId);

    let submissionId = existing?.id || null;
    db.transaction((trx) => {
      if (existing) {
        trx.run(
          `UPDATE assignment_submissions
           SET content = ?, link = ?, attachment_note = ?, attachments = ?, status = ?, score = ?, feedback = ?, reviewed_by = ?, reviewed_at = ?, submitted_at = ?, updated_at = ?
           WHERE id = ?`,
          [
            content,
            link,
            attachmentNote,
            JSON.stringify(Array.isArray(attachments) ? attachments : []),
            status,
            score,
            feedback,
            reviewedBy,
            reviewedAt,
            submittedAt,
            submittedAt,
            existing.id
          ]
        );
        replaceNormalizedAttachments(trx, existing.id, attachments, submittedAt);
        return;
      }

      const info = trx.run(
        `INSERT INTO assignment_submissions (assignment_id, student_id, content, link, attachment_note, attachments, status, score, feedback, reviewed_by, submitted_at, reviewed_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          assignmentId,
          studentId,
          content,
          link,
          attachmentNote,
          JSON.stringify(Array.isArray(attachments) ? attachments : []),
          status,
          score,
          feedback,
          reviewedBy,
          submittedAt,
          reviewedAt,
          submittedAt
        ]
      );
      submissionId = info.lastInsertRowid;
      replaceNormalizedAttachments(trx, submissionId, attachments, submittedAt);
    });

    return withNormalizedAttachments(getSubmissionByAssignmentAndStudent(assignmentId, studentId));
  }

  function reviewSubmission({ assignmentId, submissionId, status, score, feedback, reviewedBy, reviewerRole }) {
    const reviewedAt = now();
    const authorizationSql = reviewerRole === 'admin'
      ? ''
      : `
        AND EXISTS (
          SELECT 1 FROM assignments ass
          WHERE ass.id = assignment_submissions.assignment_id AND ass.created_by = ?
        )
        AND EXISTS (
          SELECT 1 FROM teacher_student_links tsl
          WHERE tsl.teacher_id = ? AND tsl.student_id = assignment_submissions.student_id
        )`;
    const params = [status, score, feedback, reviewedBy, reviewedAt, reviewedAt, submissionId, assignmentId];
    if (authorizationSql) params.push(reviewedBy, reviewedBy);
    const result = db.run(
      `UPDATE assignment_submissions
       SET status = ?, score = ?, feedback = ?, reviewed_by = ?, reviewed_at = ?, updated_at = ?
       WHERE id = ? AND assignment_id = ?${authorizationSql}`,
      params
    );
    if (!result.changes) return null;
    return withNormalizedAttachments(getSubmissionById(submissionId));
  }

  function getAttachmentById(attachmentId) {
    return db.get(
      `SELECT a.*, s.assignment_id, s.student_id, ass.course_id, ass.created_by AS assignment_created_by
       FROM assignment_submission_attachments a
       JOIN assignment_submissions s ON s.id = a.submission_id
       JOIN assignments ass ON ass.id = s.assignment_id
       WHERE a.id = ?`,
      [attachmentId]
    );
  }

  return {
    create,
    getById,
    getAttachmentById,
    getSubmissionById,
    getSubmissionByAssignmentAndStudent,
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
