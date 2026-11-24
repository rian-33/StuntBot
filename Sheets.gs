/** Spreadsheet access. Columns: NIK, name, gender, birth, measure date, height, position, phone, stunted. */
var Sheets = (function () {
  function getSheet_() {
    var sheet = SpreadsheetApp.openById(CHATBOT.SPREADSHEET_ID).getSheetByName(CHATBOT.SHEET_NAME);
    if (!sheet) throw new Error('Sheet "' + CHATBOT.SHEET_NAME + '" tidak ditemukan.');
    if (sheet.getLastRow() === 0) sheet.appendRow(CHATBOT.REQUIRED_HEADERS);
    return sheet;
  }

  function normalizePhone_(value) {
    var digits = String(value || "").replace(/\D/g, "");
    if (digits.indexOf("62") === 0) digits = "0" + digits.slice(2);
    return digits;
  }

  function addRecord(data) {
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var sheet = getSheet_();
      var row = [
        String(data.nik || ""), String(data.nama || "").trim(),
        String(data.jenis_kelamin || "").trim().toUpperCase(),
        new Date(data.tanggal_lahir + "T00:00:00"),
        new Date(data.tanggal_ukur + "T00:00:00"),
        Number(data.tinggi_cm), String(data.posisi_ukur || "").trim(),
        normalizePhone_(data.hp),
        (data.isStunted === true || String(data.isStunted).toLowerCase() === "true") ? "TRUE" : "FALSE"
      ];
      var rowNumber = sheet.getLastRow() + 1;
      sheet.getRange(rowNumber, 1).setNumberFormat("@");
      sheet.getRange(rowNumber, 8).setNumberFormat("@");
      sheet.getRange(rowNumber, 1, 1, row.length).setValues([row]);
      return rowNumber;
    } finally {
      lock.releaseLock();
    }
  }

  function getRecordByRow(rowNumber) {
    var sheet = getSheet_();
    var row = Number(rowNumber);
    if (!Number.isInteger(row) || row < 2 || row > sheet.getLastRow()) return null;
    var v = sheet.getRange(row, 1, 1, 9).getDisplayValues()[0];
    return {
      nik: v[0], nama: v[1], jenisKelamin: v[2], tanggalLahir: v[3],
      tanggalUkur: v[4], tinggi: v[5], posisiUkur: v[6],
      hp: normalizePhone_(v[7]), isStunted: String(v[8]).toUpperCase() === "TRUE"
    };
  }

  function getRecentRecords(limit) {
    var sheet = getSheet_();
    var last = sheet.getLastRow();
    if (last < 2) return [];
    var first = Math.max(2, last - limit + 1);
    return sheet.getRange(first, 1, last - first + 1, 9).getDisplayValues().reverse().map(function (v) {
      return {
        nama: v[1], jenisKelamin: v[2], tanggalLahir: v[3], tanggalUkur: v[4],
        tinggiCm: v[5], posisiUkur: v[6], isStunted: String(v[8]).toUpperCase() === "TRUE"
      };
    });
  }

  return {
    addRecord: addRecord,
    getRecordByRow: getRecordByRow,
    getRecentRecords: getRecentRecords,
    normalizePhone_: normalizePhone_
  };
})();


