require("dotenv").config();

const express = require("express");
const session = require("express-session");
const { Pool } = require("pg");
const cors = require("cors");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
 const nodemailer = require("nodemailer");
const app = express();

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cors());

app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "gdeh_student_portal_secret",

    resave: false,
    saveUninitialized: false,

    cookie: {
      maxAge:
        1000 * 60 * 60 * 24
    }
  })
);

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);

/*
|--------------------------------------------------------------------------
| PostgreSQL Connection
|--------------------------------------------------------------------------
*/

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,

  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect()
.then(() => {
  console.log(
    "✅ PostgreSQL Connected"
  );
})
.catch(err => {
  console.error(
    "❌ PostgreSQL Error:",
    err
  );
});

/*
|--------------------------------------------------------------------------
| PDF Folder
|--------------------------------------------------------------------------
*/

const pdfDir =
  path.join(__dirname, "pdfs");

if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir);
}

/*
|--------------------------------------------------------------------------
| Home Page
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "public",
      "index.html"
    )
  );

});
app.post("/login", async (req, res) => {

  try {

    const {
      studentName,
      regNumber
    } = req.body;

    const result = await pool.query(
      `
      SELECT *
      FROM students
      WHERE student_name = $1
      AND reg_number = $2
      `,
      [studentName, regNumber]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    req.session.student =
      result.rows[0];

    res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false
    });

  }

});

app.get("/dashboard", async (req, res) => {

try {
console.log(req.session.student);
const student =
  req.session.student;

if (!student) {

  return res.status(401).json({
    error: "Not logged in"
  });

}

const studentResult =
  await pool.query(
    `
    SELECT *
    FROM students
    WHERE id = $1
    `,
    [student.id]
  );

const studentData =
  studentResult.rows[0];

const unitsResult =
  await pool.query(
    `
    SELECT DISTINCT
      unit_code,
      unit_name
    FROM questions
    WHERE course_name = $1
    ORDER BY unit_code
    `,
    [studentData.course_name]
  );

const resultsResult =
  await pool.query(
    `
    SELECT
      rd.unit_code,
      rd.unit_name,
      rd.score,
      rd.award
    FROM result_details rd
    JOIN exam_attempts ea
      ON rd.attempt_id = ea.id
    WHERE ea.student_id = $1
    ORDER BY rd.unit_code
    `,
    [student.id]
  );

res.json({

  student:
    studentData,

  units:
    unitsResult.rows,

  results:
    resultsResult.rows

});

} catch (err) {

console.error(err);

res.status(500).json({
  error:
    "Failed to load dashboard"
});

}

});
app.get("/logout", (req, res) => {

  req.session.destroy(() => {

    res.redirect(
      "/index.html"
    );

  });

});

app.post("/forgot-registration", async (req, res) => {

  try {

    const email =
      req.body.email?.trim().toLowerCase();

    if (!email) {

      return res.status(400).json({
        success: false,
        message: "Email is required"
      });

    }

    console.log("================================");
    console.log("FORGOT REGISTRATION REQUEST");
    console.log("Email:", email);

    const studentResult = await pool.query(
      `
      SELECT
        id,
        email,
        student_name,
        reg_number,
        course_name
      FROM students
      WHERE LOWER(TRIM(email)) = $1
      LIMIT 1
      `,
      [email]
    );

    if (studentResult.rows.length === 0) {

      console.log("Student not found");

      return res.status(404).json({
        success: false,
        message: "Email address not found."
      });

    }

    const student =
      studentResult.rows[0];

    const token =
      crypto.randomBytes(32)
      .toString("hex");

    await pool.query(
      `
      UPDATE students
      SET
        recovery_token = $1,
        recovery_token_expiry =
        NOW() + INTERVAL '30 minutes'
      WHERE id = $2
      `,
      [
        token,
        student.id
      ]
    );

    const verifyToken =
      await pool.query(
        `
        SELECT
          recovery_token,
          recovery_token_expiry
        FROM students
        WHERE id = $1
        `,
        [student.id]
      );

    const link =
`${process.env.BASE_URL}/recover-registration?token=${token}`;

    console.log("Student:", student.student_name);
    console.log("Reg Number:", student.reg_number);
    console.log("Student ID:", student.id);
    console.log("Saved Token:",
      verifyToken.rows[0]?.recovery_token
    );

    console.log("BASE_URL:",
      process.env.BASE_URL
    );

    console.log("Recovery Link:", link);

    console.log("EMAIL_USER:",
      process.env.EMAIL_USER
    );

    console.log("EMAIL_PASS EXISTS:",
      !!process.env.EMAIL_PASS
    );

    const transporter = nodemailer.createTransport({

  host: "smtp.gmail.com",

  port: 587,

  secure: false,

  requireTLS: true,

  auth: {

    user: process.env.EMAIL_USER,

    pass: process.env.EMAIL_PASS

  }

});

    await transporter.verify();

    console.log("SMTP VERIFIED");

    await transporter.sendMail({

      from:
        process.env.EMAIL_USER,

      to:
        student.email,

      subject:
        "GDEH Registration Number Recovery",

      html: `
      <div style="
        font-family:Arial,sans-serif;
        max-width:600px;
        margin:auto;
      ">

        <h2 style="color:#0B1F4D;">
          Garissa Digital Empowerment Hub CBO
        </h2>

        <p>
          Dear ${student.student_name},
        </p>

        <p>
          You requested to recover your
          registration number.
        </p>

        <p>
          Click the button below:
        </p>

        <a
          href="${link}"
          style="
            background:#0B1F4D;
            color:#ffffff;
            padding:12px 20px;
            text-decoration:none;
            border-radius:5px;
            display:inline-block;
          "
        >
          Recover Registration Number
        </a>

        <p>
          This link expires in
          30 minutes.
        </p>

      </div>
      `

    });

    console.log(
      "Recovery email sent successfully to:",
      student.email
    );

    console.log("================================");

    return res.json({

      success: true,

      message:
        "Recovery email sent successfully"

    });

  } catch (err) {

    console.error(
      "FORGOT REGISTRATION ERROR:"
    );

    console.error(err);

    return res.status(500).json({

      success: false,

      message:
        err.message

    });

  }

});





        
  


// ------------------------------
// RECOVERY PAGE (VERIFY TOKEN)
// ------------------------------
app.get("/recover-registration", async (req, res) => {
  try {
    const token = req.query.token;

    if (!token) {
      return res.send("<h2>Missing token</h2>");
    }

    const result = await pool.query(
      `
      SELECT student_name, reg_number, course_name
      FROM students
      WHERE recovery_token = $1
        AND recovery_token_expiry > NOW()
      `,
      [token]
    );

    if (result.rows.length === 0) {
      return res.send("<h2>Invalid or Expired Link</h2>");
    }

    const data = result.rows[0];

    // IMPORTANT: clear token AFTER fetching
    await pool.query(
      `
      UPDATE students
      SET recovery_token = NULL,
          recovery_token_expiry = NULL
      WHERE recovery_token = $1
      `,
      [token]
    );

    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Recovery</title>
        <style>
          body { font-family: Arial; background:#f5f7fb; padding:20px; }
          .card {
            max-width:600px; margin:auto; background:#fff;
            padding:25px; border-radius:10px;
            box-shadow:0 0 10px rgba(0,0,0,.1);
          }
          h2 { text-align:center; color:#0B1F4D; }
          .info { margin:15px 0; font-size:16px; }
          .reg { font-size:22px; font-weight:bold; color:green; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Registration Recovery</h2>

          <div class="info">
            <strong>Name:</strong> ${data.student_name}
          </div>

          <div class="info">
            <strong>Registration Number:</strong>
            <span class="reg">${data.reg_number}</span>
          </div>

          <div class="info">
            <strong>Course:</strong> ${data.course_name}
          </div>
        </div>
      </body>
      </html>
    `);

  } catch (err) {
    console.error(err);
    return res.status(500).send("Server error");
  }
});

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/
const PORT =
  process.env.PORT || 3002;

app.listen(PORT, () => {

  console.log(
    `🚀 GDEH Student Portal Running On Port ${PORT}`
  );

});
