// Comprehensive Roman Urdu to Nastaliq Urdu dictionary for building maintenance
const DICTIONARY = {
  // Common building expenses (including typos and variations seen in screenshot)
  'bijli': 'بجلی',
  'buli': 'بجلی',
  'billi': 'بجلی',
  'bil': 'بل',
  'bill': 'بل',
  'ka': 'کا',
  'ki': 'کی',
  'ke': 'کے',
  'ko': 'کو',
  'se': 'سے',
  'par': 'پر',
  'mein': 'میں',
  'mai': 'میں',
  'kam': 'کام',
  'kaam': 'کام',
  'motor': 'موٹر',
  'motar': 'موٹر',
  'operator': 'آپریٹر',
  'jamadar': 'جمعدار',
  'jamadaar': 'جمعدار',
  'gatar': 'گٹر',
  'gutter': 'گٹر',
  'electric': 'الیکٹریشن',
  'electrician': 'الیکٹریشن',
  'plumber': 'پلمبر',
  'bulb': 'بلب',
  'balab': 'بلب',
  'pump': 'پمپ',
  'marammat': 'مرمت',
  'marmat': 'مرمت',
  'tabdeeli': 'تبدیلی',
  'board': 'بورڈ',
  'lights': 'لائٹس',
  'light': 'لائٹ',
  'floor': 'فلور',
  'manzil': 'منزل',
  'chothi': 'چوتھی',
  'tanki': 'ٹینکی',
  'tanker': 'ٹینکر',
  'pani': 'پانی',
  'water': 'پانی',
  'chowkidar': 'چوکیدار',
  'gate': 'گیٹ',
  'tala': 'تالا',
  'lock': 'تالا',
  'rang': 'رنگ',
  'chuna': 'چونا',
  'pipe': 'پائپ',
  'loha': 'لوہا',
  'taar': 'تار',
  'wire': 'تار',
  'sewerage': 'سیوریج',
  'safai': 'صفائی',
  'kachra': 'کچرا',
  'kooda': 'کوڑا',
  'generator': 'جنریٹر',
  'fuel': 'فیول / پیٹرول',
  'petrol': 'پیٹرول',
  'diesel': 'ڈیزل',
  'sweeper': 'جمعدار',
  'repair': 'مرمت',
  'usama': 'اسامہ',
  'nadeem': 'ندیم',
  'anwar': 'انور',
  'iqbal': 'اقبال',
  'kharcha': 'خرچہ',
  'kharch': 'خرچ',
  'bachat': 'بچت',
  'wusool': 'وصول',
  'baqaya': 'بقایا',
  'ghar': 'گھر',
  'band': 'بند',
  'hai': 'ہے',
  'dukandar': 'دکاندار'
};

const PHONETIC_MAP = [
  ['kh', 'خ'], ['gh', 'غ'], ['sh', 'ش'], ['ch', 'چ'], ['th', 'تھ'], ['ph', 'پھ'],
  ['dh', 'دھ'], ['bh', 'بھ'], ['jh', 'جھ'], ['rh', 'ڑھ'], ['aa', 'آ'], ['ee', 'ی'],
  ['oo', 'و'], ['ai', 'ئے'], ['au', 'ئو'],
  ['a', 'ا'], ['b', 'ب'], ['p', 'پ'], ['t', 'ت'], ['T', 'ٹ'], ['j', 'ج'],
  ['d', 'د'], ['D', 'ڈ'], ['r', 'ر'], ['R', 'ڑ'], ['z', 'ز'], ['s', 'س'],
  ['f', 'ف'], ['q', 'ق'], ['k', 'ک'], ['g', 'گ'], ['l', 'ل'], ['m', 'م'],
  ['n', 'ن'], ['w', 'و'], ['v', 'و'], ['h', 'ہ'], ['y', 'ی'], ['i', 'ی'],
  ['o', 'و'], ['u', 'و'], ['e', 'ے']
];

export function romanToUrduWord(word) {
  if (!word) return '';
  const clean = word.toLowerCase().trim().replace(/[^a-z]/g, '');
  if (DICTIONARY[clean]) {
    return DICTIONARY[clean];
  }

  // Multi-word phrase check (e.g. gatar ka kam -> گٹر کا کام)
  let res = '';
  let i = 0;
  while (i < word.length) {
    let matched = false;
    for (const [rom, urd] of PHONETIC_MAP) {
      if (word.substr(i, rom.length).toLowerCase() === rom.toLowerCase()) {
        res += urd;
        i += rom.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      res += word[i];
      i++;
    }
  }
  return res;
}

export function autoConvertRomanToUrdu(text) {
  if (!text) return '';
  // Don't convert if already pure Urdu
  if (/^[\u0600-\u06FF\s0-9.,()+-]+$/.test(text)) {
    return text;
  }

  const tokens = text.split(/(\s+)/);
  return tokens.map(token => {
    if (/^\s+$/.test(token)) return token;
    // Don't convert alphanumeric codes like G-1, 11-SEP, 19-SEP
    if (/^[A-Za-z]-[0-9]+$/.test(token) || /^[0-9]+-[A-Za-z]+$/.test(token)) {
      return token;
    }
    return romanToUrduWord(token);
  }).join('');
}
