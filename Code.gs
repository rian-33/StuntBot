/**
 * Web‑App entry point – menerima JSON dari website
 *
 * Expected JSON fields (sesuai PRD):
 *   nik, nama, jenis_kelamin, tanggal_lahir,
 *   tanggal_ukur, tinggi_cm, posisi_ukur, hp, isStunted
 *
 * Spreadsheet layout (asumsi):
 *   A: NIK
 *   B: Nama Lengkap
 *   C: Jenis Kelamin
 *   D: Tanggal Lahir
 *   E: Tanggal Ukur
 *   F: Tinggi (cm)
 *   G: Posisi Pengukuran
 *   H: Nomor HP
 *   I: Stunted? (TRUE / FALSE)
 */
function doPost(e) {
  // ---- 1️⃣ CONFIGURATION ----
  const SPREADSHEET_ID = '17jQbCJkfOG68SGicnFonP_9EZclxfHQryldIBIf8KNI'; // <-- ganti bila berbeda
  const SHEET_NAME    = 'HasilPendataan';                               // <-- nama sheet

  try {
    // ---- 2️⃣ READ & VALIDATE INPUT ----
    if (!e.postData || !e.postData.contents) {
      throw new Error('No POST body');
    }
    const data = JSON.parse(e.postData.contents);
    Logger.log('Received payload: %s', JSON.stringify(data));

    // (Optional) simple validation
    if (!data.nik || data.nik.length !== 16) {
      throw new Error('NIK must be 16 digits');
    }
    if (!data.tinggi_cm) {
      throw new Error('tinggi_cm is required');
    }
    if (!data.hp) {
      throw new Error('Nomor HP (hp) is required');
    }

    // ---- 3️⃣ PREPARE ROW DATA (exact column order) ----
    const hpValue = (data.hp || '').toString().trim(); // ensure plain‑text string
    const row = [
      data.nik               || '',
      data.nama              || '',
      data.jenis_kelamin     || '',
      data.tanggal_lahir ? new Date(data.tanggal_lahir) : '',
      data.tanggal_ukur  ? new Date(data.tanggal_ukur)  : '',
      parseFloat(data.tinggi_cm) || '',
      data.posisi_ukur       || '',
      hpValue,                               // Nomor HP column (H)
      data.isStunted ? 'TRUE' : 'FALSE'      // Stunted column (I)
    ];
    Logger.log('Row to write: %s', JSON.stringify(row));

    // ---- 4️⃣ WRITE TO SHEET ----
    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error(`Sheet "${SHEET_NAME}" not found`);
    }
    const nextRow = sheet.getLastRow() + 1;
    sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);

    // ---- 5️⃣ RETURN SUCCESS (JSON) ----
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', hp: hpValue }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log('Error: %s', err.message);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * GET endpoint – used by view.html untuk menampilkan 10 data terbaru.
 * Jika dipanggil tanpa query, hanya mengembalikan teks sederhana.
 */
function doGet(e) {
  if (e && e.parameter && e.parameter.view === '1') {
    const SPREADSHEET_ID = '17jQbCJkfOG68SGicnFonP_9EZclxfHQryldIBIf8KNI';
    const SHEET_NAME = 'HasilPendataan';
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: 'Sheet not found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const lastRow = sheet.getLastRow();
    const firstRow = Math.max(2, lastRow - 9);
    const data = lastRow < 2 ? [] : sheet.getRange(firstRow, 1, lastRow - firstRow + 1, 9).getDisplayValues()
      .reverse()
      .map(function (row) {
        return {
          nama: row[1],
          jenisKelamin: row[2],
          tanggalLahir: row[3],
          tanggalUkur: row[4],
          tinggiCm: row[5],
          posisiUkur: row[6],
          isStunted: String(row[8]).toUpperCase() === 'TRUE'
        };
      });
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', data: data }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  // Jika tidak ada parameter, beri respons teks (bisa di‑redirect ke login page di server)
  return ContentService
    .createTextOutput('StuntBot Web Service – GET endpoint')
    .setMimeType(ContentService.MimeType.TEXT);
}
