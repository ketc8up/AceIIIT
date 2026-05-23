// ================================================================
// ACEIIIT - INTERVIEW PREP APPLICATION BACKEND
// Deploy this as a separate Apps Script Web App from the paid-course
// enrollment backend so the doPost handlers do not conflict.
// ================================================================

var ADMIN_EMAIL = "aceiiit.official@gmail.com";
var CENTRE_NAME = "AceIIIT";
var FAST2SMS_KEY = "PASTE_YOUR_FAST2SMS_KEY_HERE";
var SPREADSHEET_ID = "PASTE_YOUR_SPREADSHEET_ID_HERE";
var APPLICATION_SHEET_NAME = "Interview Applications";
var SCORECARD_FOLDER_NAME = "AceIIIT_Interview_Scorecards";

function getSpreadsheet_() {
  if (SPREADSHEET_ID && SPREADSHEET_ID !== "PASTE_YOUR_SPREADSHEET_ID_HERE") {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }

  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    return active;
  }

  throw new Error("Configure SPREADSHEET_ID or bind this script to a spreadsheet.");
}

function getApplicationsSheet_() {
  var spreadsheet = getSpreadsheet_();
  var sheet = spreadsheet.getSheetByName(APPLICATION_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(APPLICATION_SHEET_NAME);
  }

  return sheet;
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() > 0) {
    return;
  }

  var headers = [
    "Timestamp",
    "Name",
    "Phone",
    "Email",
    "City",
    "Age",
    "SUPR Score",
    "REAP Score",
    "Scorecard",
    "Notes",
    "Status"
  ];

  sheet.appendRow(headers);

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#101010");
  headerRange.setFontColor("#b89e57");
  headerRange.setFontWeight("bold");
  sheet.setFrozenRows(1);
}

function normalisePayload_(e) {
  if (!e) {
    throw new Error("Missing request payload.");
  }

  if (e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }

  if (e.parameter && Object.keys(e.parameter).length) {
    return e.parameter;
  }

  throw new Error("Unsupported request format.");
}

function normalizeEmail_(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail_(value) {
  return /\S+@\S+\.\S+/.test(normalizeEmail_(value));
}

function isValidPhone_(value) {
  return /^\d{10}$/.test(String(value || "").trim());
}

function isValidScore_(value) {
  return /^\d+(\.\d+)?$/.test(String(value || "").trim());
}

function saveScorecard_(base64Data, fileName, mimeType) {
  if (!base64Data) {
    return "";
  }

  var cleanBase64 = String(base64Data).replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
  var folders = DriveApp.getFoldersByName(SCORECARD_FOLDER_NAME);
  var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(SCORECARD_FOLDER_NAME);
  var decoded = Utilities.base64Decode(cleanBase64);
  var blob = Utilities.newBlob(
    decoded,
    mimeType || "image/png",
    fileName || ("scorecard_" + new Date().getTime() + ".png")
  );

  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function doPost(e) {
  try {
    var sheet = getApplicationsSheet_();
    ensureHeaders_(sheet);

    var d = normalisePayload_(e);

    if (!String(d.fullName || "").trim()) {
      return jsonResponse_({ status: "error", message: "Full name is required." });
    }

    if (!isValidPhone_(d.phone)) {
      return jsonResponse_({ status: "error", message: "Phone number must be 10 digits." });
    }

    if (!isValidEmail_(d.email)) {
      return jsonResponse_({ status: "error", message: "Please enter a valid email address." });
    }

    if (!isValidScore_(d.suprScore)) {
      return jsonResponse_({ status: "error", message: "Please enter a valid SUPR score." });
    }

    if (!isValidScore_(d.reapScore)) {
      return jsonResponse_({ status: "error", message: "Please enter a valid REAP score." });
    }

    if (!d.scorecardBase64) {
      return jsonResponse_({ status: "error", message: "Please upload a scorecard image." });
    }

    var scorecardUrl = saveScorecard_(d.scorecardBase64, d.scorecardFileName, d.scorecardMimeType);
    var scorecardCell = scorecardUrl ? '=HYPERLINK("' + scorecardUrl + '","Open Scorecard")' : "";

    sheet.appendRow([
      d.timestamp || new Date(),
      d.fullName || "",
      d.phone || "",
      normalizeEmail_(d.email),
      d.city || "",
      d.age || "",
      d.suprScore || "",
      d.reapScore || "",
      scorecardCell,
      d.lastQuestion || "",
      "Under Review"
    ]);

    sendStudentEmail_(d);
    sendStudentSMS_(d);
    sendAdminAlert_(d, scorecardUrl);

    return jsonResponse_({ status: "success" });
  } catch (err) {
    Logger.log(err);
    return jsonResponse_({ status: "error", message: err.toString() });
  }
}

function sendStudentEmail_(d) {
  if (!d.email) {
    return;
  }

  var fullName = d.fullName || "Student";
  var name = fullName.split(" ")[0];
  var html =
    '<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;background:#101010;color:#f4ead4;border:1px solid #202020;">' +
    '<div style="padding:22px 24px;border-bottom:2px solid #b89e57;background:#151515;">' +
    '<div style="font-size:24px;font-weight:900;letter-spacing:2px;">Ace<span style="color:#c8102e;">IIIT</span></div>' +
    '<div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#8b8173;margin-top:4px;">Mock Interviews · Interview Prep Application</div>' +
    '</div>' +
    '<div style="padding:24px;">' +
    '<p style="font-size:18px;font-weight:800;margin:0 0 10px;">Hey ' + escapeHtml_(name) + ',</p>' +
    '<p style="font-size:14px;line-height:1.7;color:#d5ccbe;margin:0 0 18px;">Your application for the AceIIIT interview-prep cohort has been received. We will review your scores and reach out on this email if you are selected.</p>' +
    '<table style="width:100%;border-collapse:collapse;border:1px solid #2a2a2a;margin-bottom:18px;">' +
    '<tr style="background:#181818;"><td colspan="2" style="padding:8px 12px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#8b8173;">Application Summary</td></tr>' +
    erow_("SUPR Score", d.suprScore || "") +
    erow_("REAP Score", d.reapScore || "") +
    erow_("City", d.city || "") +
    erow_("Status", "Under Review") +
    '</table>' +
    '<div style="padding:14px 16px;background:#151515;border-left:3px solid #c8102e;">' +
    '<p style="margin:0;font-size:13px;line-height:1.7;color:#d5ccbe;">This is a selective cohort with only 10 seats. If shortlisted, you will receive the next instructions by email.</p>' +
    '</div>' +
    '<p style="font-size:13px;color:#8b8173;margin:18px 0 0;">- Team AceIIIT</p>' +
    '</div>' +
    '</div>';

  var plain =
    "Hi " + name + ",\n\n" +
    "Your AceIIIT mock interview application has been received.\n\n" +
    "SUPR Score: " + (d.suprScore || "") + "\n" +
    "REAP Score: " + (d.reapScore || "") + "\n" +
    "Status: Under Review\n\n" +
    "If shortlisted, we will contact you on this email.\n\n" +
    "- Team AceIIIT";

  MailApp.sendEmail({
    to: d.email,
    subject: "Application Received - AceIIIT Mock Interviews",
    body: plain,
    htmlBody: html,
    name: CENTRE_NAME
  });
}

function sendStudentSMS_(d) {
  try {
    if (!FAST2SMS_KEY || FAST2SMS_KEY === "PASTE_YOUR_FAST2SMS_KEY_HERE") {
      return;
    }

    if (!d.phone) {
      return;
    }

    var phone = String(d.phone).replace(/[\s\-\+\(\)]/g, "");
    if (phone.startsWith("91") && phone.length === 12) {
      phone = phone.substring(2);
    }

    if (phone.length !== 10) {
      return;
    }

    var name = (d.fullName || "Student").split(" ")[0];
    var msg =
      "Hi " + name +
      "! AceIIIT received your mock interview application. " +
      "SUPR: " + (d.suprScore || "-") +
      ", REAP: " + (d.reapScore || "-") +
      ". We will contact selected students by email.";

    UrlFetchApp.fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "post",
      headers: {
        authorization: FAST2SMS_KEY
      },
      payload: {
        route: "q",
        message: msg,
        language: "english",
        flash: 0,
        numbers: phone
      },
      muteHttpExceptions: true
    });
  } catch (err) {
    Logger.log(err);
  }
}

function sendAdminAlert_(d, scorecardUrl) {
  if (!ADMIN_EMAIL) {
    return;
  }

  var subject = "New AceIIIT Interview Prep Application - " + (d.fullName || "Student");
  var body =
    "A new interview-prep application has been received.\n\n" +
    "Name: " + (d.fullName || "") + "\n" +
    "Phone: " + (d.phone || "") + "\n" +
    "Email: " + normalizeEmail_(d.email) + "\n" +
    "City: " + (d.city || "") + "\n" +
    "Age: " + (d.age || "") + "\n" +
    "SUPR Score: " + (d.suprScore || "") + "\n" +
    "REAP Score: " + (d.reapScore || "") + "\n" +
    "Scorecard: " + (scorecardUrl || "-") + "\n" +
    "Notes: " + (d.lastQuestion || "-") + "\n" +
    "Status: Under Review";

  MailApp.sendEmail(ADMIN_EMAIL, subject, body, { name: CENTRE_NAME });
}

function erow_(label, value) {
  return '<tr>' +
    '<td style="padding:10px 12px;border-top:1px solid #2a2a2a;font-size:12px;color:#8b8173;letter-spacing:0.08em;text-transform:uppercase;">' + escapeHtml_(label) + '</td>' +
    '<td style="padding:10px 12px;border-top:1px solid #2a2a2a;font-size:14px;color:#f4ead4;font-weight:700;text-align:right;">' + escapeHtml_(value) + '</td>' +
    '</tr>';
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function escapeHtml_(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
