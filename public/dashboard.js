let studentData = {};
let unitsData = [];
let resultsData = [];
let failedUnitsData = [];
fetch("/dashboard")
.then(res => res.json())
.then(data => {

  // STORE GLOBALLY (for PDF use later)
  studentData = data.student;
  unitsData = data.units;
  resultsData = data.results;
failedUnitsData = data.failedUnits || [];

  // =====================
  // STUDENT DETAILS
  // =====================
  document.getElementById("name").textContent =
    data.student.student_name;

  document.getElementById("reg").textContent =
    data.student.reg_number;

  document.getElementById("course").textContent =
    data.student.course_name;

  // =====================
  // UNITS LIST
  // =====================
  const unitsList = document.getElementById("unitsList");
unitsList.innerHTML = "";

// REMOVE DUPLICATES BY unit_code
const uniqueUnits = [...new Map(
  data.units.map(unit => [unit.unit_code, unit])
).values()];

uniqueUnits.forEach(unit => {
  unitsList.innerHTML += `
    <div class="unit-card">
      <strong>${unit.unit_code}</strong><br>
      ${unit.unit_name}
    </div>
  `;
});
// =====================
// FAILED UNITS
// =====================

const failedUnitsList =
  document.getElementById("failedUnitsList");
if (failedUnitsList) {

  failedUnitsList.innerHTML = "";

  if (!data.failedUnits ||
      data.failedUnits.length === 0) {

    failedUnitsList.innerHTML = `
      <div class="unit-card">
        No failed units.
      </div>
    `;

  } else {

    data.failedUnits.forEach(unit => {

      failedUnitsList.innerHTML += `
        <div class="unit-card failed-unit">
          <strong>${unit.unit_code}</strong><br>
          ${unit.unit_name}
        </div>
      `;

    });

  }

}

}) // <-- THIS WAS MISSING

.catch(err => {
  console.error("Dashboard load error:", err);
});
async function loadImage(url){

  const response = await fetch(url);

  if(!response.ok){
    throw new Error(`Failed to load ${url}`);
  }

  const blob = await response.blob();

  return new Promise((resolve,reject)=>{

    const reader = new FileReader();

    reader.onloadend = () => resolve(reader.result);

    reader.onerror = reject;

    reader.readAsDataURL(blob);

  });

}

async function downloadResultPDF(){

  try{

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const logo =
      await loadImage("/gdeh_logo.png");

    const signature =
      await loadImage("/signature.jpg");

  const student = {
  name: studentData.student_name || "",
  reg: studentData.reg_number || "",
  course: studentData.course_name || ""
};

const verifyUrl =
  `https://gdehexm.onrender.com/verify/${student.reg}`;

const qrData =
  await QRCode.toDataURL(
    verifyUrl
  );  
// =====================
// LOGO
// =====================

doc.addImage(
  logo,
  "PNG",
  87,
  10,
  35,
  35
);

// =====================
// INSTITUTION DETAILS
// =====================

doc.setTextColor(11,31,77);

doc.setFont("helvetica","bold");
doc.setFontSize(15);

doc.text(
  "GARISSA DIGITAL EMPOWERMENT HUB CBO",
  105,
  52,
  { align:"center" }
);

doc.setFont("helvetica","normal");
doc.setFontSize(10);

doc.text(
  "Along Kismayu RD Off Rubis Energy Opp Horizon High School",
  105,
  59,
  { align:"center" }
);

doc.text(
  "P.O Box 10 - 70100 Garissa",
  105,
  65,
  { align:"center" }
);

// NAVY STROKE

doc.setDrawColor(11,31,77);
doc.setLineWidth(1);

doc.line(
  15,
  72,
  195,
  72
);

// =====================
// RESULT SLIP TITLE
// =====================

doc.setFont("helvetica","bold");
doc.setFontSize(14);

doc.text(
  "OFFICIAL RESULT SLIP",
  105,
  82,
  { align:"center" }
);

doc.line(
  65,
  85,
  145,
  85
);

// =====================
// WATERMARK
// =====================

doc.saveGraphicsState();

doc.setFont("helvetica","bold");
doc.setFontSize(12);
doc.setTextColor(240,240,240);

for(let wy=30; wy<290; wy+=30){
  for(let wx=10; wx<210; wx+=55){
    doc.text(
      "GDEH CBO RESULT SLIP",
      wx,
      wy,
      { angle:45 }
    );
  }
}

doc.restoreGraphicsState();

// =====================
// STUDENT DETAILS
// =====================

doc.setTextColor(0,0,0);

doc.setFont("helvetica","normal");
doc.setFontSize(11);

doc.text(
  `Student Name: ${student.name}`,
  105,
  100,
  { align:"center" }
);

doc.text(
  `Registration No: ${student.reg}`,
  105,
  108,
  { align:"center" }
);

doc.text(
  `Course: ${student.course}`,
  105,
  116,
  { align:"center" }
);

doc.text(
  `Date Issued: ${new Date().toLocaleDateString()}`,
  105,
  124,
  { align:"center" }
);

doc.text(
  "Academic Year: 2026",
  105,
  132,
  { align:"center" }
);

// =====================
// RESULTS TABLE
// =====================

let y = 150;

doc.setTextColor(11,31,77);

doc.setFont("helvetica","bold");

doc.text("Code",15,y);
doc.text("Unit",45,y);
doc.text("Score",145,y);
doc.text("Award",170,y);

y += 4;

doc.line(
  15,
  y,
  195,
  y
);

y += 8;

doc.setTextColor(0,0,0);

doc.setFont("helvetica","normal");

resultsData.forEach(result => {

  doc.text(
    String(result.unit_code || ""),
    15,
    y
  );

  doc.text(
    String(result.unit_name || ""),
    45,
    y
  );

  doc.text(
    String(result.score || ""),
    145,
    y
  );

  doc.text(
    String(result.award || ""),
    170,
    y
  );

  y += 10;

});

doc.addImage(
qrData,
"PNG",
150,
220,
35,
35
);

doc.text(
"SCAN TO VERIFY",
167,
260,
{ align:"center" }
);
doc.setFont("helvetica","bold");
doc.setFontSize(9);


doc.text(
"AUTHORIZING SIGNATURE",
15,
220
);

doc.line(
15,
222,
75,
222
);

doc.addImage(
signature,
"JPEG",
15,
226,
45,
18
);

doc.text(
"Abdullahi Sheikh Aden",
15,
250
);

doc.setFont("helvetica","normal");

doc.text(
"Programme Coordinator",
15,
256
);
doc.setDrawColor(11,31,77);

doc.line(
15,
270,
195,
270
);

doc.setFont("helvetica","bold");
doc.setFontSize(8);

doc.text(
"GARISSA DIGITAL EMPOWERMENT HUB CBO",
105,
278,
{ align:"center" }
);

doc.text(
"ALL RIGHTS RESERVED",
105,
284,
{ align:"center" }
);
// DOWNLOAD

    doc.save(
      `${student.reg}_Result_Slip.pdf`
    );

  }catch(err){

    console.error(err);

    alert(
      "PDF generation failed. Check browser console."
    );

  }

}
