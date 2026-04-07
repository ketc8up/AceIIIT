// ================================================================
// ACEIIIT - ENROLLMENT BACKEND
// ================================================================

var ADMIN_EMAIL  = "aceiiit.official@gmail.com";
var CENTRE_NAME  = "AceIIIT";
var FAST2SMS_KEY = "PASTE_YOUR_FAST2SMS_KEY_HERE";
var MOCK_TEST_PORTAL_URL = "https://apj21-s.github.io/aceiiit-mock-portal-secure/";

var MAIN_ENROLLMENT_SHEET_NAME = "Sheet1";
var MOCK_VERIFIED_SHEET_ID = "1fWDsF3JcoUuFZ9ENAvGRtJlmEaAWy5EXI4FUxM65JnA";
var MOCK_VERIFIED_SHEET_NAME = "Verified";

function getSheet_(){
  return SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
}

function getMainEnrollmentSheet_(){
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(MAIN_ENROLLMENT_SHEET_NAME);
  return sheet || getSheet_();
}

function ensureHeaders_(sheet){

  if(sheet.getLastRow() > 0){
    return;
  }

  var headers=[
  "Timestamp",
  "Name",
  "Phone",
  "Email",
  "City",
  "Age",
  "Course",
  "Amount (Rs)",
  "Transaction ID",
  "Screenshot",
  "Notes",
  "Status"
  ];

  sheet.appendRow(headers);

  var hr=sheet.getRange(1,1,1,headers.length);
  hr.setBackground("#0a0a0a");
  hr.setFontColor("#c9961a");
  hr.setFontWeight("bold");

  sheet.setFrozenRows(1);
}

function normalisePayload_(e){

  if(!e){
    throw new Error("Missing request payload.");
  }

  if(e.postData && e.postData.contents){
    return JSON.parse(e.postData.contents);
  }

  if(e.parameter && Object.keys(e.parameter).length){
    return e.parameter;
  }

  throw new Error("Unsupported request format.");
}

function isValidTransactionId_(transactionId){
  return /^\d{12}$/.test(String(transactionId || "").trim());
}

function normalizeEmail_(value){
  return String(value || "").trim().toLowerCase();
}

function normalizeCourseKey_(value){
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function isMockTestPackCourse_(course){
  return normalizeCourseKey_(course) === "mocktestpack";
}

function formatEnrollmentAmount_(value){
  var normalized=String(value || "").replace(/[^\d.]/g, "");

  if(!normalized){
    return "Rs.-";
  }

  if(normalized === "1499"){
    return "Rs.1,499";
  }

  if(normalized === "599"){
    return "Rs.599";
  }

  if(normalized === "499"){
    return "Rs.499";
  }

  return "Rs." + normalized;
}

function resolveEnrollmentMeta_(courseValue, amountValue){
  var rawCourse=String(courseValue || "").trim();
  var rawAmount=String(amountValue || "").trim();
  var courseKey=normalizeCourseKey_(rawCourse);
  var courseLabel=rawCourse || "AceIIIT Enrollment";
  var amountValueResolved=rawAmount;

  if(courseKey === "notesonly"){
    courseLabel="Notes Only";
    amountValueResolved="499";
  }else if(courseKey === "mocktestpack"){
    courseLabel="Mock Test Pack";
    amountValueResolved="599";
  }else if(courseKey === "classnotes"){
    courseLabel="Class + Notes";
    amountValueResolved="1499";
  }

  return {
    courseKey: courseKey,
    courseLabel: courseLabel,
    fee: formatEnrollmentAmount_(amountValueResolved || rawAmount),
    isMockTestPack: courseKey === "mocktestpack"
  };
}


// ================================================================
// SAVE SCREENSHOT TO GOOGLE DRIVE
// ================================================================

function saveScreenshot(base64Data,fileName){

  if(!base64Data){
    return "";
  }

  var cleanBase64=String(base64Data).replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
  var folderName="AceIIIT_Payments";
  var folders=DriveApp.getFoldersByName(folderName);

  var folder;

  if(folders.hasNext()){
    folder=folders.next();
  }else{
    folder=DriveApp.createFolder(folderName);
  }

  var decoded=Utilities.base64Decode(cleanBase64);
  var blob=Utilities.newBlob(decoded,"image/png",fileName || ("payment_" + new Date().getTime() + ".png"));

  var file=folder.createFile(blob);

  file.setSharing(
    DriveApp.Access.ANYONE_WITH_LINK,
    DriveApp.Permission.VIEW
  );

  return file.getUrl();
}


// ================================================================
// CHECK DUPLICATE UTR
// ================================================================

function isDuplicateUTR(utr){

  if(!utr){
    return false;
  }

  var sheet=getSheet_();
  var data=sheet.getDataRange().getValues();

  for(var i=1;i<data.length;i++){

    var existingUTR=data[i][8];

    if(existingUTR==utr){
      return true;
    }

  }

  return false;
}


// ================================================================
// MAIN FORM HANDLER
// ================================================================

function doPost(e){

  try{

    var sheet=getSheet_();
    ensureHeaders_(sheet);

    var d=normalisePayload_(e);
    var transactionId=(d.transactionId || d.utr || "").toString().trim();

    if(!isValidTransactionId_(transactionId)){
      return ContentService
      .createTextOutput(
      JSON.stringify({
        status:"error",
        message:"UPI Transaction ID must be exactly 12 digits."
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }


    // ==============================================================
    // DUPLICATE UTR CHECK
    // ==============================================================

    if(isDuplicateUTR(transactionId)){

      return ContentService
      .createTextOutput(
      JSON.stringify({
        status:"duplicate",
        message:"This UTR has already been used."
      }))
      .setMimeType(ContentService.MimeType.JSON);

    }


    // ==============================================================
    // SAVE SCREENSHOT
    // ==============================================================

    var screenshotUrl="";

    if(d.screenshotBase64){

      screenshotUrl=saveScreenshot(
      d.screenshotBase64,
      d.screenshotFileName
      );

    }


    // ==============================================================
    // SAVE DATA TO SHEET
    // ==============================================================

    sheet.appendRow([
      d.timestamp || new Date(),
      d.fullName || d.name || "",
      d.phone || "",
      d.email || "",
      d.city || "",
      d.age || "",
      d.course || "",
      d.amount || "",
      transactionId,
      screenshotUrl ? '=IMAGE("' + screenshotUrl + '")' : "",
      d.lastQuestion || d.notes || "",
      "Pending"
    ]);


    // ==============================================================
    // SEND EMAIL + SMS
    // ==============================================================

    sendStudentEmail(d);
    sendStudentSMS(d);
    sendAdminAlert(d);


    return ContentService
    .createTextOutput(JSON.stringify({status:"success"}))
    .setMimeType(ContentService.MimeType.JSON);

  }

  catch(err){

    Logger.log(err);

    return ContentService
    .createTextOutput(
      JSON.stringify({
        status:"error",
        message:err.toString()
      })
    )
    .setMimeType(ContentService.MimeType.JSON);

  }

}


// ================================================================
// EMAIL TO STUDENT
// ================================================================

function sendStudentEmail(d){

  if(!d.email){
    return;
  }

  var fullName=d.fullName || d.name || "Student";
  var name=fullName.split(" ")[0];
  var enrollmentMeta=resolveEnrollmentMeta_(d.course, d.amount);
  var transactionId=d.transactionId || d.utr || "";

  var html=
    '<div style="font-family:Inter,Arial,sans-serif;max-width:500px;margin:0 auto;background:#0a0a0a;color:#f0ece6;border:1px solid #1a1a1a;">' +
    '<div style="background:#131313;border-bottom:2px solid #c9961a;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;">' +
    '<div>' +
    '<div style="font-size:22px;font-weight:900;letter-spacing:2px;color:#f0ece6;">Ace<span style="color:#c9961a;">IIIT</span></div>' +
    '<div style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#555;margin-top:2px;">Course Enrollment</div>' +
    '</div>' +
    '<div style="background:#c8102e;color:#fff;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:5px 10px;border-radius:2px;">Confirmed</div>' +
    '</div>' +
    '<div style="padding:24px;">' +
    '<p style="font-size:18px;font-weight:700;margin-bottom:4px;">Hey ' + escapeHtml_(name) + '! &#128170;</p>' +
    '<p style="font-size:13px;color:#888;margin-bottom:20px;line-height:1.6;">' +
    'Your enrollment at <strong style="color:#f0ece6;">AceIIIT</strong> is confirmed. ' +
    'We\'ll verify your payment within <strong style="color:#c9961a;">24 hours</strong> and send the next access update to this email.' +
    '</p>' +
    '<table style="width:100%;border-collapse:collapse;margin-bottom:20px;border:1px solid #1a1a1a;">' +
    '<tr style="background:#161616;"><td colspan="2" style="padding:8px 12px;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#555;">Enrollment Summary</td></tr>' +
    erow_("Course", enrollmentMeta.courseLabel) +
    erow_("Amount Paid", enrollmentMeta.fee) +
    erow_("Transaction ID", transactionId) +
    erow_("Phone", d.phone || "") +
    erow_("Status", "Pending Verification") +
    '</table>' +
    '<div style="border-left:3px solid #c9961a;padding:12px 16px;background:#131313;margin-bottom:20px;">' +
    '<p style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#c9961a;margin-bottom:8px;">What Happens Next</p>' +
    '<p style="font-size:12px;color:#888;margin:4px 0;line-height:1.6;"><span style="color:#f0ece6;font-weight:700;">1.</span> Payment verified within 24 hours</p>' +
    '<p style="font-size:12px;color:#888;margin:4px 0;line-height:1.6;"><span style="color:#f0ece6;font-weight:700;">2.</span> Course access details sent to this email</p>' +
    '<p style="font-size:12px;color:#888;margin:4px 0;line-height:1.6;"><span style="color:#f0ece6;font-weight:700;">3.</span> Show up. We handle the rest.</p>' +
    '</div>' +
    '<p style="font-size:13px;font-weight:600;color:#f0ece6;">See you soon. &#127919;</p>' +
    '<p style="font-size:12px;color:#444;margin-top:4px;">- Team AceIIIT</p>' +
    '</div>' +
    '<div style="background:#0f0f0f;padding:10px 24px;font-size:10px;color:#333;border-top:1px solid #1a1a1a;">' +
    '&#128274; We will NEVER ask for your PIN, OTP or password. &nbsp;|&nbsp; Reply to this email for any help.' +
    '</div>' +
    '</div>';

  var plain=
    "Hi " + name + ",\n\n" +
    "Enrollment confirmed at AceIIIT!\n\n" +
    "Course: " + enrollmentMeta.courseLabel + "\n" +
    "Amount: " + enrollmentMeta.fee + "\n" +
    "Txn ID: " + transactionId + "\n" +
    "Status: Pending Verification\n\n" +
    "We verify within 24 hrs and send the next access update to this email.\n\n" +
    "- Team AceIIIT\n\n" +
    "We will NEVER ask for your PIN, OTP or password.";

  MailApp.sendEmail({
    to:d.email,
    subject:"Enrollment Confirmed - AceIIIT",
    body:plain,
    htmlBody:html,
    name:"AceIIIT"
  });

}


// ================================================================
// SMS
// ================================================================

function sendStudentSMS(d){

  try{

    if(!FAST2SMS_KEY || FAST2SMS_KEY==="PASTE_YOUR_FAST2SMS_KEY_HERE"){
      return;
    }

    if(!d.phone){
      return;
    }

    var phone=d.phone.replace(/[\s\-\+\(\)]/g,'');

    if(phone.startsWith("91") && phone.length===12){
      phone=phone.substring(2);
    }

    if(phone.length!==10){
      return;
    }

    var fullName=d.fullName || d.name || "Student";
    var name=fullName.split(" ")[0];

    var msg=
    "Hi "+name+
    "! AceIIIT enrollment received. "+
    "Txn:"+(d.transactionId || d.utr || "")+
    ". Verification within 24 hrs.";

    UrlFetchApp.fetch(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        method:"post",
        headers:{
          authorization:FAST2SMS_KEY,
          "Content-Type":"application/json"
        },
        payload:JSON.stringify({
          route:"q",
          message:msg,
          language:"english",
          numbers:phone
        })
      }
    );

  }

  catch(e){
    Logger.log(e);
  }

}


// ================================================================
// ADMIN ALERT
// ================================================================

function sendAdminAlert(d){

  var fullName=d.fullName || d.name || "";
  var transactionId=d.transactionId || d.utr || "";

  MailApp.sendEmail({

    to:ADMIN_EMAIL,

    subject:
    "New Enrollment: "+
    fullName+
    " | Rs."+
    (d.amount || ""),

    body:
    "Name: "+fullName+"\n"+
    "Phone: "+(d.phone || "")+"\n"+
    "Email: "+(d.email || "")+"\n"+
    "Course: "+(d.course || "")+"\n"+
    "Amount: "+(d.amount || "")+"\n"+
    "Txn ID: "+transactionId+"\n"

  });

}

function erow_(label, value) {
  return '<tr style="border-bottom:1px solid #1a1a1a;">' +
    '<td style="padding:10px 12px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#444;background:#131313;width:38%;">' + escapeHtml_(label) + '</td>' +
    '<td style="padding:10px 12px;font-size:13px;font-weight:600;color:#f0ece6;background:#0a0a0a;">' + escapeHtml_(value || "-") + '</td>' +
    '</tr>';
}

function escapeHtml_(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sendVerifiedEmail_(email, name, course, amount){

  if(!email){
    return;
  }

  var first=(name || "Student").split(" ")[0];
  var enrollmentMeta=resolveEnrollmentMeta_(course, amount);
  var accessLine=enrollmentMeta.isMockTestPack
    ? 'You can now access your test series using your verified email here: <a href="' + escapeHtml_(MOCK_TEST_PORTAL_URL) + '" style="color:#c9961a;">' + escapeHtml_(MOCK_TEST_PORTAL_URL) + '</a>'
    : 'You will be contacted soon through WhatsApp with course access details and the next steps.';
  var html=
    '<div style="font-family:Inter,Arial,sans-serif;max-width:500px;margin:0 auto;background:#0a0a0a;color:#f0ece6;border:1px solid #1a1a1a;">' +
    '<div style="background:#131313;border-bottom:2px solid #2e8b57;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;">' +
    '<div>' +
    '<div style="font-size:22px;font-weight:900;letter-spacing:2px;color:#f0ece6;">Ace<span style="color:#c9961a;">IIIT</span></div>' +
    '<div style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#555;margin-top:2px;">Payment Update</div>' +
    '</div>' +
    '<div style="background:#2e8b57;color:#fff;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:5px 10px;border-radius:2px;">Verified</div>' +
    '</div>' +
    '<div style="padding:24px;">' +
    '<p style="font-size:18px;font-weight:700;margin-bottom:4px;">Hi ' + escapeHtml_(first) + ',</p>' +
    '<p style="font-size:13px;color:#888;line-height:1.6;margin-bottom:16px;">Your payment has been <strong style="color:#2e8b57;">verified successfully</strong>.</p>' +
    '<table style="width:100%;border-collapse:collapse;margin-bottom:20px;border:1px solid #1a1a1a;">' +
    '<tr style="background:#161616;"><td colspan="2" style="padding:8px 12px;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#555;">Verification Summary</td></tr>' +
    erow_("Course", enrollmentMeta.courseLabel) +
    erow_("Amount Paid", enrollmentMeta.fee) +
    erow_("Status", "Verified") +
    '</table>' +
    '<p style="font-size:13px;color:#888;line-height:1.6;margin-bottom:16px;">' + accessLine + '</p>' +
    '<p style="font-size:13px;font-weight:600;color:#f0ece6;">- Team AceIIIT</p>' +
    '</div>' +
    '</div>';

  var plain=
    "Hi " + first + ",\n\n" +
    "Your payment has been verified successfully.\n\n" +
    "Course: " + enrollmentMeta.courseLabel + "\n" +
    "Amount: " + enrollmentMeta.fee + "\n" +
    "Status: Verified\n\n" +
    (
      enrollmentMeta.isMockTestPack
        ? "Access your test series using your verified email here:\n" + MOCK_TEST_PORTAL_URL + "\n\n"
        : "You will be contacted soon through WhatsApp with course access details and the next steps.\n\n"
    ) +
    "- Team AceIIIT";

  MailApp.sendEmail({
    to:email,
    subject:"Payment Verified - AceIIIT",
    body:plain,
    htmlBody:html,
    name:"AceIIIT"
  });
}


// ================================================================
// MOCK TEST ACCESS SYNC
// ================================================================

function getMockVerifiedSheet_(){
  var spreadsheet=SpreadsheetApp.openById(MOCK_VERIFIED_SHEET_ID);
  var sheet=spreadsheet.getSheetByName(MOCK_VERIFIED_SHEET_NAME);

  if(!sheet){
    throw new Error("Mock verified sheet not found: " + MOCK_VERIFIED_SHEET_NAME);
  }

  return sheet;
}

function appendMockVerifiedEmailIfMissing_(email){

  var normalizedEmail=normalizeEmail_(email);

  if(!normalizedEmail){
    return false;
  }

  var sheet=getMockVerifiedSheet_();
  var lastRow=sheet.getLastRow();

  if(lastRow > 0){
    var existingValues=sheet.getRange(1,1,lastRow,1).getValues();

    for(var i=0;i<existingValues.length;i++){
      if(normalizeEmail_(existingValues[i][0]) === normalizedEmail){
        return false;
      }
    }
  }

  sheet.getRange(lastRow + 1,1).setValue(normalizedEmail);
  Logger.log("Mock test access granted: " + normalizedEmail);
  return true;
}

function syncMockTestAccessForRow_(sheet,row){

  var course=String(sheet.getRange(row,7).getValue() || "").trim();

  if(!isMockTestPackCourse_(course)){
    return false;
  }

  var email=String(sheet.getRange(row,4).getValue() || "").trim();

  if(!email){
    Logger.log("Mock test access skipped: missing email on row " + row);
    return false;
  }

  return appendMockVerifiedEmailIfMissing_(email);
}

function syncMockTestUsers(){

  var sheet=getMainEnrollmentSheet_();
  var lastRow=sheet.getLastRow();
  var addedCount=0;

  if(lastRow < 2){
    Logger.log("No enrollment rows found for mock test sync.");
    return;
  }

  var values=sheet.getRange(2,1,lastRow - 1,12).getValues();

  for(var i=0;i<values.length;i++){
    var email=normalizeEmail_(values[i][3]);
    var course=String(values[i][6] || "").trim();
    var status=String(values[i][11] || "").trim().toLowerCase();

    if(status !== "verified"){
      continue;
    }

    if(!isMockTestPackCourse_(course)){
      continue;
    }

    if(appendMockVerifiedEmailIfMissing_(email)){
      addedCount++;
    }
  }

  Logger.log("Mock verified sync complete. Added: " + addedCount);
}

function setupMockVerifiedSyncTrigger() {
  var triggers = ScriptApp.getProjectTriggers();

  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "syncMockTestUsers") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger("syncMockTestUsers")
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log("Installable time trigger created for mock verified sync.");
}


// ================================================================
// AUTO EMAIL WHEN VERIFIED
// ================================================================

function onEdit(e){
  installedOnEdit(e);
}

function installedOnEdit(e){

  if(!e || !e.range){
    return;
  }

  var range=e.range;
  var sheet=range.getSheet();
  var row=range.getRow();
  var col=range.getColumn();

  if(row <= 1){
    return;
  }

  if(col !== 12){
    return;
  }

  var status=String(range.getValue() || "").trim().toLowerCase();

  if(status !== "verified"){
    return;
  }

  var email=String(sheet.getRange(row,4).getValue() || "").trim();
  var name=String(sheet.getRange(row,2).getValue() || "").trim();
  var course=String(sheet.getRange(row,7).getValue() || "").trim();
  var amount=String(sheet.getRange(row,8).getValue() || "").trim();

  if(!email){
    Logger.log("Verified email skipped: missing email on row " + row);
    return;
  }

  syncMockTestAccessForRow_(sheet,row);
  sendVerifiedEmail_(email, name, course, amount);
  Logger.log("Verified email sent to: " + email + " for row " + row);
}

function setupVerifiedTrigger() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var triggers = ScriptApp.getProjectTriggers();

  for (var i = 0; i < triggers.length; i++) {
    var fn = triggers[i].getHandlerFunction();
    if (fn === "onEdit" || fn === "installedOnEdit") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger("installedOnEdit")
    .forSpreadsheet(spreadsheet)
    .onEdit()
    .create();

  Logger.log("Installable onEdit trigger created for verified emails.");
}

// TEST FUNCTIONS
function testSetup() {
  Logger.log("=================================");
  Logger.log("Centre : " + CENTRE_NAME);
  Logger.log("Email  : " + ADMIN_EMAIL);
  Logger.log("SMS    : " + (FAST2SMS_KEY!=="PASTE_YOUR_FAST2SMS_KEY_HERE"?"ENABLED":"disabled - add Fast2SMS key"));
  Logger.log("Sheet  : " + SpreadsheetApp.getActiveSpreadsheet().getName());
  Logger.log("Trigger: run setupVerifiedTrigger() once after deploy");
  Logger.log("Mock   : run setupMockVerifiedSyncTrigger() once after deploy");
  Logger.log("=================================");
}

function testEmail() {
  sendStudentEmail({
    fullName:"Test Student", email:ADMIN_EMAIL, phone:"9999999999",
    course:"Class + Notes", amount:"1499", transactionId:"123456789012"
  });
  Logger.log("Test email sent to: " + ADMIN_EMAIL);
}

function testVerifiedEmail() {
  sendVerifiedEmail_(ADMIN_EMAIL, "Test Student", "Class + Notes", "1499");
  Logger.log("Verified email test sent to: " + ADMIN_EMAIL);
}

function testMockPackEmail() {
  sendStudentEmail({
    fullName:"Mock Test Student", email:ADMIN_EMAIL, phone:"9999999999",
    course:"Mock Test Pack", amount:"599", transactionId:"123456789012"
  });
  Logger.log("Mock test pack email test sent to: " + ADMIN_EMAIL);
}

function sendVerifiedEmailsForMarkedRows() {
  var sheet = getMainEnrollmentSheet_();
  var lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    Logger.log("No enrollment rows found.");
    return;
  }

  var values = sheet.getRange(2, 1, lastRow - 1, 12).getValues();
  var sent = 0;

  for (var i = 0; i < values.length; i++) {
    var status = String(values[i][11] || "").trim().toLowerCase();
    var email = String(values[i][3] || "").trim();
    var name = String(values[i][1] || "").trim();
    var course = String(values[i][6] || "").trim();

    if (status !== "verified" || !email) {
      continue;
    }

    if (isMockTestPackCourse_(course)) {
      appendMockVerifiedEmailIfMissing_(email);
    }

    sendVerifiedEmail_(email, name, course, values[i][7]);
    sent++;
  }

  Logger.log("Verified follow-up emails sent: " + sent);
}

function sendVerifiedEmailForRow(rowNumber) {
  var row = Number(rowNumber);
  var sheet = getMainEnrollmentSheet_();

  if (!row || row < 2) {
    throw new Error("Enter a valid sheet row number, for example 4.");
  }

  var status = String(sheet.getRange(row, 12).getValue() || "").trim().toLowerCase();
  var email = String(sheet.getRange(row, 4).getValue() || "").trim();
  var name = String(sheet.getRange(row, 2).getValue() || "").trim();
  var course = String(sheet.getRange(row, 7).getValue() || "").trim();

  if (status !== "verified") {
    throw new Error("Row " + row + " is not marked Verified.");
  }

  if (!email) {
    throw new Error("Row " + row + " has no student email.");
  }

  if (isMockTestPackCourse_(course)) {
    appendMockVerifiedEmailIfMissing_(email);
  }

  sendVerifiedEmail_(email, name, course, sheet.getRange(row, 8).getValue());
  Logger.log("Verified email sent manually for row " + row + " to " + email);
}

function logVerifiedTriggerStatus() {
  var triggers = ScriptApp.getProjectTriggers();

  if (!triggers.length) {
    Logger.log("No installable triggers found.");
    return;
  }

  for (var i = 0; i < triggers.length; i++) {
    Logger.log(
      "Trigger " + (i + 1) +
      ": " + triggers[i].getHandlerFunction() +
      " | event=" + triggers[i].getEventType()
    );
  }
}
