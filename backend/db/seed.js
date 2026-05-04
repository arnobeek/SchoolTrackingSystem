const db = require("./database");

function gradeFromMarks(marks) {
  if (marks >= 80) return "D1";
  if (marks >= 70) return "D2";
  if (marks >= 60) return "C3";
  if (marks >= 50) return "C4";
  if (marks >= 45) return "C5";
  if (marks >= 40) return "C6";
  if (marks >= 35) return "P7";
  if (marks >= 30) return "P8";
  return "F9";
}

function seed() {
  console.log("Seeding database...");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','teacher','head_teacher','accountant','parent')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      subject TEXT NOT NULL,
      fingerprint_id TEXT UNIQUE,
      email TEXT UNIQUE,
      phone TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      check_in_time TEXT,
      check_out_time TEXT,
      status TEXT NOT NULL CHECK(status IN ('present','late','absent')),
      gps_verified INTEGER DEFAULT 0,
      fingerprint_verified INTEGER DEFAULT 0,
      UNIQUE(teacher_id, date),
      FOREIGN KEY(teacher_id) REFERENCES teachers(id)
    );

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_name TEXT UNIQUE NOT NULL,
      teacher_id INTEGER,
      FOREIGN KEY(teacher_id) REFERENCES teachers(id)
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      class_id INTEGER NOT NULL,
      parent_contact TEXT,
      fee_balance REAL DEFAULT 0,
      UNIQUE(first_name, last_name, class_id),
      FOREIGN KEY(class_id) REFERENCES classes(id)
    );

    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_name TEXT NOT NULL,
      term TEXT NOT NULL,
      year INTEGER NOT NULL,
      UNIQUE(exam_name, term, year)
    );

    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      exam_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      marks INTEGER NOT NULL,
      grade TEXT NOT NULL,
      UNIQUE(student_id, exam_id, subject),
      FOREIGN KEY(student_id) REFERENCES students(id),
      FOREIGN KEY(exam_id) REFERENCES exams(id)
    );

    CREATE TABLE IF NOT EXISTS fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER UNIQUE NOT NULL,
      total_fee REAL NOT NULL,
      amount_paid REAL NOT NULL,
      balance REAL NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('paid','partial','overdue')),
      due_date TEXT NOT NULL,
      FOREIGN KEY(student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('attendance','fees','system')),
      channel TEXT NOT NULL CHECK(channel IN ('sms','email')),
      is_read INTEGER DEFAULT 0,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, message, type, channel),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  const users = [
    ["admin", "admin123", "admin"],
    ["teacher1", "pass123", "teacher"],
    ["headteacher", "pass123", "head_teacher"],
    ["accountant", "pass123", "accountant"],
    ["parent1", "pass123", "parent"],
  ];
  const insertUser = db.prepare("INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)");
  users.forEach((u) => insertUser.run(...u));

  const userByName = db.prepare("SELECT id FROM users WHERE username = ?");
  const teacherUserId = userByName.get("teacher1")?.id;
  const headTeacherUserId = userByName.get("headteacher")?.id;

  const teachers = [
    [teacherUserId, "John", "Doe", "Mathematics", "FP_001", "john.doe@school.com", "+256701123456"],
    [headTeacherUserId, "Jane", "Smith", "Physics", "FP_002", "jane.smith@school.com", "+256701654321"],
    [null, "Robert", "Brown", "English", "FP_003", "robert.brown@school.com", "+256701987654"],
    [null, "Grace", "Nansubuga", "Chemistry", "FP_004", "grace.n@school.com", "+256701987620"],
    [null, "Peter", "Okot", "Biology", "FP_005", "peter.okot@school.com", "+256701999111"],
  ];
  const insertTeacher = db.prepare(
    "INSERT OR IGNORE INTO teachers (user_id, first_name, last_name, subject, fingerprint_id, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  teachers.forEach((t) => insertTeacher.run(...t));

  const insertClass = db.prepare("INSERT OR IGNORE INTO classes (class_name, teacher_id) VALUES (?, ?)");
  insertClass.run("Primary 7", 1);
  insertClass.run("Senior 1", 2);
  insertClass.run("Senior 4", 3);

  const insertStudent = db.prepare(
    "INSERT OR IGNORE INTO students (first_name, last_name, class_id, parent_contact, fee_balance) VALUES (?, ?, ?, ?, ?)"
  );
  [
    ["Alice", "Kizza", 1, "+256772000111", 500000],
    ["Bob", "Mugisha", 1, "+256772222333", 0],
    ["Charlie", "Okello", 2, "+256772444555", 1200000],
    ["Daisy", "Namyalo", 2, "+256772666777", 600000],
    ["Ethan", "Ssembatya", 3, "+256772888999", 250000],
  ].forEach((s) => insertStudent.run(...s));

  const insertExam = db.prepare("INSERT OR IGNORE INTO exams (exam_name, term, year) VALUES (?, ?, ?)");
  insertExam.run("End of Term 1", "Term 1", 2026);
  insertExam.run("Mid Term", "Term 2", 2026);

  const examRows = db.prepare("SELECT id, term FROM exams").all();
  const studentRows = db.prepare("SELECT id FROM students").all();
  const subjects = ["Mathematics", "English", "Biology"];
  const insertResult = db.prepare(
    "INSERT OR IGNORE INTO results (student_id, exam_id, subject, marks, grade) VALUES (?, ?, ?, ?, ?)"
  );
  studentRows.forEach((student, studentIndex) => {
    examRows.forEach((exam, examIndex) => {
      subjects.forEach((subject, subjectIndex) => {
        const marks = 52 + ((studentIndex * 9 + examIndex * 7 + subjectIndex * 11) % 45);
        insertResult.run(student.id, exam.id, subject, marks, gradeFromMarks(marks));
      });
    });
  });

  const insertFee = db.prepare(
    "INSERT OR IGNORE INTO fees (student_id, total_fee, amount_paid, balance, status, due_date) VALUES (?, ?, ?, ?, ?, ?)"
  );
  [
    [1, 1500000, 1000000, 500000, "partial", "2026-05-30"],
    [2, 1500000, 1500000, 0, "paid", "2026-05-30"],
    [3, 1500000, 300000, 1200000, "overdue", "2026-03-30"],
    [4, 1500000, 900000, 600000, "partial", "2026-05-30"],
    [5, 1500000, 1250000, 250000, "partial", "2026-05-30"],
  ].forEach((f) => insertFee.run(...f));
  db.exec("UPDATE students SET fee_balance = (SELECT balance FROM fees WHERE fees.student_id = students.id)");

  const insertAttendance = db.prepare(
    "INSERT OR IGNORE INTO attendance (teacher_id, date, check_in_time, check_out_time, status, gps_verified, fingerprint_verified) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  const teacherIds = db.prepare("SELECT id FROM teachers").all().map((t) => t.id);
  for (let i = 1; i <= 14; i += 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().split("T")[0];
    teacherIds.forEach((teacherId) => {
      const selector = (i + teacherId) % 10;
      const status = selector <= 1 ? "absent" : selector <= 3 ? "late" : "present";
      const checkIn = status === "absent" ? null : status === "late" ? "08:15" : "07:42";
      const checkOut = status === "absent" ? null : selector === 4 ? null : "16:45";
      insertAttendance.run(teacherId, date, checkIn, checkOut, status, status === "absent" ? 0 : 1, status === "absent" ? 0 : 1);
    });
  }

  const adminId = userByName.get("admin")?.id;
  const accountantId = userByName.get("accountant")?.id;
  const insertNotification = db.prepare(
    "INSERT OR IGNORE INTO notifications (user_id, message, type, channel, is_read) VALUES (?, ?, ?, ?, ?)"
  );
  [
    [adminId, "Teacher John Doe clocked in late today.", "attendance", "sms", 0],
    [adminId, "3 fee accounts are overdue this week.", "fees", "email", 0],
    [adminId, "System backup completed successfully.", "system", "email", 1],
    [headTeacherUserId, "Review missing clock-outs from the previous school day.", "attendance", "email", 0],
    [accountantId, "Outstanding fee balances increased for Senior 1 this week.", "fees", "email", 0],
  ].forEach((n) => insertNotification.run(...n));

  const insertLog = db.prepare("INSERT INTO activity_logs (user_id, action) VALUES (?, ?)");
  if (db.prepare("SELECT COUNT(*) AS count FROM activity_logs").get().count === 0 && adminId) {
    insertLog.run(adminId, "Initialized school dashboard");
    insertLog.run(adminId, "Reviewed attendance report");
    insertLog.run(adminId, "Sent overdue fee notifications");
  }

  console.log("Database ready.");
}

if (require.main === module) {
  seed();
}

module.exports = seed;
