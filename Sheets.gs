/**
 * sheets.gs – Functions that read/write the StuntBot spreadsheet.
 */
var Sheets = (function () {
  /**
   * Buka sheet berdasarkan CONFIG.
   *
   * @return {Sheet}
   */
  function _getSheet() {
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
      throw new Error('Sheet "' + CONFIG.SHEET_NAME + '" not found.');
    }
    return sheet;
  }

  /**
   * Tambahkan satu baris data (dipakai oleh form web).
   *
   * @param {Object} data  Objek dengan properti:
   *   nik, nama, jenis_kelamin, tanggal_lahir, tanggal_ukur,
   *   tinggi_cm, posisi_ukur, hp, isStunted
   */
  function addRecord(data) {
    var sheet = _getSheet();

    var row = [
      data.nik || "",
      data.nama || "",
      data.jenis_kelamin || "",
      data.tanggal_lahir ? new Date(data.tanggal_lahir) : "",
      data.tanggal_ukur ? new Date(data.tanggal_ukur) : "",
      parseFloat(data.tinggi_cm) || "",
      data.posisi_ukur || "",
      (data.hp || "").toString().trim(),
      data.isStunted ? "TRUE" : "FALSE",
    ];

    var nextRow = sheet.getLastRow() + 1;
    sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);
    return true;
  }

  /**
   * Cari baris berdasarkan nomor HP (string, hanya digit).
   *
   * @param {String} hp  Nomor handphone (digits only)
   * @return {Object|null}  Nilai kolom atau null bila tidak ditemukan.
   *   { nik, nama, jenisKelamin, tanggalLahir, tanggalUkur,
   *     tinggi, posisiUkur, hp, isStunted }
   */
  function findByPhone(hp) {
    var sheet = _getSheet();
    var data = sheet.getDataRange().getValues(); // termasuk header baris pertama
    for (var i = 1; i < data.length; i++) {
      // mulai dari baris data
      var row = data[i];
      var hpCell = (row[7] || "").toString().replace(/\D/g, "");
      if (hpCell === hp) {
        return {
          nik: row[0] || "",
          nama: row[1] || "",
          jenisKelamin: row[2] || "",
          tanggalLahir: _formatDate(row[3]),
          tanggalUkur: _formatDate(row[4]),
          tinggi: row[5] || "",
          posisiUkur: row[6] || "",
          hp: hpCell,
          isStunted: (row[8] || "").toString().toUpperCase() === "TRUE",
        };
      }
    }
    return null; // tidak ditemukan
  }

  /**
   * Utility: ubah objek Date menjadi string dd‑MM‑yyyy.
   */
  function _formatDate(dt) {
    if (!dt) return "-";
    var d = new Date(dt);
    var dd = ("0" + d.getDate()).slice(-2);
    var mm = ("0" + (d.getMonth() + 1)).slice(-2);
    var yy = d.getFullYear();
    return dd + "-" + mm + "-" + yy;
  }

  // expose public API
  return {
    addRecord: addRecord,
    findByPhone: findByPhone,
  };
})();
