import { describe, expect, it } from 'vitest';
import { analyse, parseCsv, transferText, validDate } from './helpers';
import { groupByLabels as groups } from '../src/domain/registration/grouping';
import { initialConfig, mappingErrors } from '../src/application/imports/prepare';
import { parseCsv as parseResult } from '../src/infrastructure/csv/papa-parser';
import { fixtureCsv as demoCsv } from './fixture';

function fixture() {
  const csv = parseCsv(demoCsv),
    config = { ...initialConfig(csv), mapping: { ...initialConfig(csv).mapping } };
  config.disciplines = { 9: 'club', 10: 'club' };
  config.separator = ',';
  return { csv, config };
}
describe('CSV import', () => {
  it('preserves duplicate headers, quoted delimiters, escaped quotes, multiline cells and BOM', () => {
    const csv = parseCsv(
      '\uFEFFName,Disziplin,Disziplin\r\n"Mia ""Test""","A, B","Zeile 1\nZeile 2"',
    );
    expect(csv.headers).toEqual(['Name', 'Disziplin', 'Disziplin']);
    expect(csv.rows).toEqual([['Mia "Test"', 'A, B', 'Zeile 1\nZeile 2']]);
  });
  it('accepts semicolon-delimited files and skips blank rows', () => {
    expect(parseCsv('A;B\r\n1;2\r\n;\r\n').rows).toEqual([['1', '2']]);
  });
  it('rejects missing records, broken quoting, and unequal column counts', () => {
    expect(parseResult('A,B\n')).toMatchObject({ ok: false, code: 'empty' });
    expect(parseResult('A,B\n"unfinished,b')).toMatchObject({ ok: false, code: 'malformed' });
    expect(parseResult('A,B\n1,2,3')).toMatchObject({ ok: false, code: 'row-width' });
  });
  it('requires explicit discipline mapping and reports missing or reused fields', () => {
    const { csv, config } = fixture();
    expect(mappingErrors(initialConfig(csv), csv.headers.length)).toHaveLength(1);
    config.mapping.last = config.mapping.first;
    config.mapping.email = -1;
    expect(mappingErrors(config, csv.headers.length).map((issue) => issue.code)).toContain(
      'duplicate-mapping',
    );
    expect(mappingErrors(config, csv.headers.length).map((issue) => issue.code)).toContain(
      'missing-column',
    );
  });
});
describe('Analysis', () => {
  it('rejects impossible dates and accepts both supported formats', () => {
    expect(validDate('2000-02-30')).toBe(false);
    expect(validDate('2000-02-29')).toBe(true);
    expect(validDate('29.02.2000')).toBe(true);
    expect(validDate('29.02.2001')).toBe(false);
    expect(validDate('2099-01-01')).toBe(false);
  });
  it('keeps all records and flags both sides of possible duplicates', () => {
    const { csv, config } = fixture(),
      result = analyse(csv, config);
    expect(result).toHaveLength(6);
    expect(result[0].issues.map((issue) => issue.code)).toContain('possible-duplicate');
    expect(result[4].issues.map((issue) => issue.code)).toContain('possible-duplicate');
    expect(result[3].issues.map((issue) => issue.code)).toContain('invalid-birthday');
    expect(result[1].issues).toEqual([]);
    expect(result[2].issues.map((issue) => issue.code)).toContain('missing-brevet');
  });
  it('retains raw values, distinguishes unknown and no, and does not flag skipped apparatus', () => {
    const { csv, config } = fixture();
    csv.rows[0][11] = '';
    csv.rows[0][12] = 'Vielleicht';
    const m = analyse(csv, config)[0];
    expect(m.overnight).toBe('open');
    expect(m.judge).toBe('open');
    expect(m.individual).toBe('no');
    expect(csv.rows[0][12]).toBe('Vielleicht');
    expect(m.issues.map((issue) => issue.code)).not.toContain('missing-individual-details');
  });
  it('only splits on the chosen separator and counts each person once per discipline', () => {
    const { csv, config } = fixture();
    csv.rows[0][10] = 'Fachtest Allround';
    let result = analyse(csv, config);
    expect(result[0].clubDisciplines).toEqual(['Fachtest Allround', 'Pendelstafette']);
    const selected = result.filter((m) => m.id !== 'test:5');
    expect(
      groups(
        selected.filter((m) => m.club === 'yes'),
        (m) => m.clubDisciplines,
      ).map(([name, list]) => [name, list.length]),
    ).toEqual([
      ['Fachtest Allround', 2],
      ['Pendelstafette', 3],
    ]);
    config.separator = '';
    result = analyse(csv, config);
    expect(result[0].clubDisciplines[0]).toBe('Fachtest Allround, Pendelstafette');
  });
  it('does not count unconfirmed participation as a yes and flags conflicting answers', () => {
    const { csv, config } = fixture();
    csv.rows[0][7] = 'no';
    const members = analyse(csv, config);
    expect(members[0].issues.map((issue) => issue.code)).toContain('club-without-consent');
    expect(members.filter((m) => m.club === 'yes')).toHaveLength(4);
  });
  it('includes open issues in transfer text and uses only selected records', () => {
    const { csv, config } = fixture();
    const selected = analyse(csv, config).filter((m) => m.id !== 'test:5');
    const text = transferText(selected);
    expect(text).toContain('5 ausgewählte Anmeldungen');
    expect(text).toContain('Vereinswettkampf: 4 | Einzelwettkampf: 2');
    expect(text).toContain('Prüfen:');
    expect(text).toContain('Brevet: LA');
  });
});
