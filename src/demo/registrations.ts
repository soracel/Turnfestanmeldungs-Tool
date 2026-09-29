// Exclusively fictional records. Never import real member exports into the bundle.
const initialRows = `"Zeitstempel","Vorname","Nachname","Geburtstag","E-Mail-Adresse","Ich nehme am Einzelwettkampf teil","Geräteturnen","Ich nehme am Vereinswettkampf teil","Kategorie","Ich nehme an folgenden Disziplinen teil:","Ich nehme an folgenden Disziplinen teil:","Ich übernachte am Turnfest:","Ich stelle mich als Kampfrichter zur Verfügung:","Brevet (z.B. LA etc.):"
"2026/09/24 10:00","Mia","Muster","1998-04-12","mia@example.com","Nein","","Ja","Aktive (Alter offen)","Fachtest Allround, Pendelstafette","","Ja","Nein",""
"2026/09/24 10:15","Noah","Beispiel","1995-11-03","noah@example.com","Ja","K5","Ja","Aktive (Alter offen)","Pendelstafette","","Ja","Ja","LA"
"2026/09/24 10:30","Lea","Demo","1981-06-21","lea@example.com","Nein","","Ja","35+","","Fachtest Allround","Nein","Ja",""
"2026/09/24 10:45","Jan","Test","2000-02-30","jan@example.com","Ja","K6","Nein","","","","Nein","Nein",""
"2026/09/25 09:00","Mia","Muster","1998-04-12","mia@example.com","Nein","","Ja","Aktive (Alter offen)","Fachtest Allround","","Ja","Nein",""
"2026/09/25 09:15","Nina","Fiktiv","2002-08-19","nina@example.com","Nein","","Ja","Aktive (Alter offen)","Pendelstafette","","Ja","Nein",""`;

// Stable data makes manual planning and conflict comparisons reproducible.
// These names and example.com addresses do not represent real members.
const firstNames = [
  'Lina',
  'Elias',
  'Emma',
  'Luca',
  'Sofia',
  'Leon',
  'Lara',
  'Finn',
  'Anna',
  'Ben',
  'Clara',
  'Jonas',
  'Elena',
  'Tim',
  'Laura',
  'Paul',
  'Amira',
  'Nico',
  'Luisa',
  'David',
  'Alina',
  'Levin',
  'Mara',
  'Emil',
  'Nora',
  'Felix',
  'Sarah',
  'Robin',
  'Eva',
  'Simon',
  'Julia',
  'Marco',
  'Sandra',
  'Daniel',
  'Petra',
  'Thomas',
  'Monika',
  'Andreas',
  'Karin',
  'Stefan',
  'Ruth',
  'Martin',
  'Ursula',
  'Patrick',
];
const lastNames = ['Spielmann', 'Beispiel', 'Muster', 'Fiktiv', 'Testmann', 'Demann'];
const activeChoices = [
  ['Fachtest Allround', 'Pendelstafette', 'Weitsprung'],
  ['Pendelstafette', 'Kugelstossen'],
  ['Fachtest Allround', 'Schleuderball'],
  ['Weitsprung', 'Kugelstossen', '800-m-Lauf'],
  ['Pendelstafette', '800-m-Lauf'],
  ['Schleuderball', 'Weitsprung'],
  ['Fachtest Allround'],
];
const seniorChoices = [
  ['Fachtest Allround', 'Steinstossen'],
  ['Schleuderball', 'Pendelstafette'],
  ['Fachtest Allround', 'Kugelstossen', 'Schleuderball'],
  ['Steinstossen', 'Pendelstafette'],
  ['Kugelstossen'],
];
const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
const moreRows = firstNames.map((first, i) => {
  const senior = i >= 28;
  const individualOnly = i === 9 || i === 23;
  const individual = individualOnly || (!senior && i % 4 === 0);
  const choices = senior ? seniorChoices : activeChoices;
  // Four wishes for one person intentionally make a conflict unavoidable.
  const disciplines =
    i === 0
      ? ['Fachtest Allround', 'Pendelstafette', 'Weitsprung', 'Kugelstossen']
      : choices[i % choices.length];
  const judge = i % 7 === 0;
  return [
    `2026/09/${String(25 + Math.floor(i / 12)).padStart(2, '0')} ${String(8 + (i % 10)).padStart(2, '0')}:30`,
    first,
    lastNames[i % lastNames.length],
    `${senior ? 1968 + (i % 20) : 1993 + (i % 14)}-${String(1 + (i % 12)).padStart(2, '0')}-${String(1 + (i % 27)).padStart(2, '0')}`,
    i === 12 ? '' : `demo.${String(i + 7).padStart(2, '0')}@example.com`,
    individual ? 'Ja' : 'Nein',
    individual ? (i % 2 ? 'K5' : 'K6') : '',
    individualOnly ? 'Nein' : 'Ja',
    individualOnly || i === 18 ? '' : senior ? '35+' : 'Aktive (Alter offen)',
    !individualOnly && !senior ? disciplines.join(', ') : '',
    senior ? disciplines.join(', ') : '',
    i === 15 ? '' : i % 3 ? 'Ja' : 'Nein',
    judge ? 'Ja' : 'Nein',
    judge ? (i % 2 ? 'LA' : 'GETU') : '',
  ]
    .map(quote)
    .join(',');
});

export const demoCsv = [initialRows, ...moreRows].join('\n');
