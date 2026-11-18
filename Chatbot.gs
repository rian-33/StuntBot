function processChat_(chatId, text) {
  const input = String(text || '').trim();
  const lower = input.toLowerCase();

  if (lower === '/start' || lower === '/help') {
    const session = getSession_(chatId);
    return session && session.nim
      ? 'Silakan pilih informasi yang ingin dilihat.'
      : 'Selamat datang di Chatbot. Silakan masukkan NIM Anda terlebih dahulu.';
  }

  if (lower === '/reset' || lower === '/logout' || lower === 'ganti nim') {
    clearSession_(chatId);
    return 'Sesi telah dihapus. Silakan masukkan NIM Anda.';
  }

  let session = getSession_(chatId);
  if (!session || !session.nim) {
    if (/^\d{5,20}$/.test(input)) {
      const student = findStudentByNim_(input);
      if (!student) return 'NIM tidak ditemukan. Periksa kembali NIM Anda.';

      session = saveSession_(chatId, {
        nim: input,
        pendingIntent: session && session.pendingIntent || null
      });

      const greeting = 'Halo ' + student.Nama + '. NIM tersimpan untuk chat ini.';
      if (session.pendingIntent) {
        const answer = answerIntent_(student, session.pendingIntent);
        saveSession_(chatId, { pendingIntent: null });
        return greeting + '\n\n' + answer;
      }
      return greeting + '\nSilakan pilih menu yang tersedia.';
    }

    const pendingIntent = detectIntent_(lower);
    if (pendingIntent) saveSession_(chatId, { pendingIntent: pendingIntent });
    return 'Silakan masukkan NIM Anda terlebih dahulu.';
  }

  const intent = detectIntent_(lower);
  if (!intent) {
    return 'Saya belum memahami pesan itu. Silakan pilih menu nilai atau kehadiran.';
  }

  const student = findStudentByNim_(session.nim);
  if (!student) {
    clearSession_(chatId);
    return 'Data NIM pada sesi tidak ditemukan lagi. Silakan masukkan NIM kembali.';
  }

  saveSession_(chatId, {});
  return answerIntent_(student, intent);
}

function detectIntent_(text) {
  if (/\b(tugas)\b/.test(text)) return 'Tugas';
  if (/\b(quiz|kuis)\b/.test(text)) return 'Quiz';
  if (/\b(mid|uts|tengah semester)\b/.test(text)) return 'MID';
  if (/\b(uas|akhir semester)\b/.test(text)) return 'UAS';
  if (/\b(absen|absensi|hadir|kehadiran|izin|sakit|alfa|tidak hadir)\b/.test(text)) {
    return 'Kehadiran';
  }
  return null;
}

function answerIntent_(student, intent) {
  if (intent === 'Kehadiran') {
    const attendance = attendanceSummary_(student);
    if (!attendance.total) return 'Data kehadiran belum tersedia.';

    return 'Kehadiran Anda: hadir ' + attendance.hadir +
      ', izin ' + attendance.izin +
      ', sakit ' + attendance.sakit +
      ', alfa ' + attendance.alfa +
      '. Persentase hadir ' + attendance.percentage +
      '% dari ' + attendance.total + ' pertemuan.';
  }

  const value = student[intent];
  return value === ''
    ? 'Nilai ' + intent + ' belum tersedia.'
    : 'Nilai ' + intent + ' Anda adalah ' + value + '.';
}
