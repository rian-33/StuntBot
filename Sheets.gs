function findStudentByNim_(nim) {
  const spreadsheetId = getConfig_().spreadsheetId;
  if (!spreadsheetId) throw new Error('SPREADSHEET_ID belum dikonfigurasi.');

  const sheet = SpreadsheetApp.openById(spreadsheetId)
    .getSheetByName(CHATBOT.SHEET_NAME);
  if (!sheet) throw new Error('Tab NilaiAbsensi tidak ditemukan.');

  const values = sheet.getDataRange().getDisplayValues();
  if (!values.length) throw new Error('Sheet NilaiAbsensi masih kosong.');

  const headers = values[0].map(function (value) {
    return String(value).trim();
  });
  const missing = CHATBOT.REQUIRED_HEADERS.filter(function (header) {
    return headers.indexOf(header) < 0;
  });
  if (missing.length) {
    throw new Error('Kolom wajib tidak ditemukan: ' + missing.join(', '));
  }

  const nimIndex = headers.indexOf('NIM');
  const row = values.slice(1).find(function (item) {
    return String(item[nimIndex]).trim() === String(nim).trim();
  });
  if (!row) return null;

  const student = {};
  headers.forEach(function (header, index) {
    student[header] = row[index];
  });
  return student;
}

function attendanceSummary_(student) {
  const hadir = numberOrZero_(student.Hadir);
  const izin = numberOrZero_(student.Izin);
  const sakit = numberOrZero_(student.Sakit);
  const alfa = numberOrZero_(student.Alfa);
  const total = hadir + izin + sakit + alfa;

  return {
    hadir: hadir,
    izin: izin,
    sakit: sakit,
    alfa: alfa,
    total: total,
    percentage: total ? (hadir / total * 100).toFixed(1) : null
  };
}

function numberOrZero_(value) {
  const number = Number(value);
  return value === '' || !isFinite(number) ? 0 : number;
}
