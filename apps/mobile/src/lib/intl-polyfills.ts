// Hermes ships a partial Intl: no PluralRules (Arabic's six plural forms), NumberFormat
// ignores numbering systems (Arabic-Indic digits) and unit styles, and DateTimeFormat falls
// back to English ("4:52 AM" in Arabic), and DisplayNames is missing. Forcing the FormatJS
// polyfills gives the same ICU behavior on Android and iOS as on the web (SPEC 7).
// Import this module first. A new app language adds its two locale-data lines here.
import '@formatjs/intl-getcanonicallocales/polyfill-force.js';
import '@formatjs/intl-locale/polyfill-force.js';
import '@formatjs/intl-pluralrules/polyfill-force.js';
import '@formatjs/intl-pluralrules/locale-data/ar.js';
import '@formatjs/intl-pluralrules/locale-data/en.js';
import '@formatjs/intl-pluralrules/locale-data/fr.js';
import '@formatjs/intl-numberformat/polyfill-force.js';
import '@formatjs/intl-numberformat/locale-data/ar.js';
import '@formatjs/intl-numberformat/locale-data/en.js';
import '@formatjs/intl-numberformat/locale-data/fr.js';
import '@formatjs/intl-datetimeformat/polyfill-force.js';
import '@formatjs/intl-datetimeformat/locale-data/ar.js';
import '@formatjs/intl-datetimeformat/locale-data/en.js';
import '@formatjs/intl-datetimeformat/locale-data/fr.js';
// Every IANA zone: prayer times are shown in the city's own zone, offline.
import '@formatjs/intl-datetimeformat/add-all-tz.js';
// Country names for the location ("Tunis, Tunisia") in the UI language.
import '@formatjs/intl-displaynames/polyfill-force.js';
import '@formatjs/intl-displaynames/locale-data/ar.js';
import '@formatjs/intl-displaynames/locale-data/en.js';
import '@formatjs/intl-displaynames/locale-data/fr.js';
