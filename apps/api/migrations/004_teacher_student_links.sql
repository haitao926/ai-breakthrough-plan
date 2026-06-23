CREATE TABLE IF NOT EXISTS teacher_student_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(teacher_id, student_id),
  FOREIGN KEY(teacher_id) REFERENCES users(id),
  FOREIGN KEY(student_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_student_links_teacher_id
  ON teacher_student_links (teacher_id);

CREATE INDEX IF NOT EXISTS idx_teacher_student_links_student_id
  ON teacher_student_links (student_id);
