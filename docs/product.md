# Product and domain

## Purpose and scope

Help a club's registration coordinator turn Google Forms responses into a reviewable preparation list for STV Contest. The coordinator remains responsible for the final entry. A local “transferred” checkbox does not confirm acceptance by Contest.

The current workflow is: select CSV, confirm mappings, inspect problems, select records, review summaries, allocate club disciplines, then copy or print the preparation list. Registrations can be edited in the application and the selected, corrected source rows can be downloaded as CSV for a later import.

## Input contract

The supplied export has 14 columns: timestamp, first name, last name, birthday, email, individual competition participation, apparatus gymnastics, club competition participation, category, two discipline columns, overnight stay, judge availability, and brevet.

Both discipline columns have the exact heading `Ich nehme an folgenden Disziplinen teil:`. Preserve column positions and raw values. Never parse this table into an object keyed solely by headings. Users explicitly assign each discipline column to a competition or choose not to analyse it. Split multi-select values only using the confirmed delimiter.

The full Google Forms branching and option catalogue have not been verified. A skipped conditional field is not automatically a negative answer. The current importer requires mappings for all expected fields; changing that policy is a separate product change.

## Terminology

| Term                  | Meaning                                                                             |
| --------------------- | ----------------------------------------------------------------------------------- |
| Registration          | One imported response, identified within an import; not necessarily a unique person |
| Selected registration | A response included in summaries and planning                                       |
| Possible duplicate    | Matching name or email; a review hint, never an automatic merge                     |
| Category              | `Aktive` or `35+`, based on the answer or explicit override, not inferred from age  |
| Discipline            | One activity allocated as a whole within a category                                 |
| Part                  | One of the three club competition parts; currently 0–2 internally and 1–3 in the UI |
| Conflict              | A registration assigned to multiple disciplines within the same category and part   |
| Brevet                | The judge qualification supplied in the form; not a verified eligibility decision   |

## Behaviour to preserve during refactoring

1. Only selected records with a positive club-participation answer enter club planning.
2. Aktive and 35+ have independent starts and independent allocations. Identical discipline names in different categories do not share an allocation.
3. Unknown categories require an explicit mapping. Missing disciplines are reported as unplanned.
4. Each discipline belongs to exactly one part in its category. Fewer than three disciplines can leave parts empty; do not invent activities or split a discipline.
5. Conflict cost is the sum of `k * (k - 1) / 2` over registrations in each part, where `k` is that registration's number of disciplines in that part. Report both pair cost and affected registrations; these are different counts.
6. Optimisation first minimises conflict cost, then the sum of squared discipline counts per part. This secondary objective balances discipline counts, not roster sizes or timings.
7. Current optimisation uses deterministic greedy/local search, plus symmetry-reduced search for up to 12 disciplines with a 100,000-node budget. A zero-conflict result proves the primary minimum. Otherwise claim an optimum only after completing exact search. It does not prove compliance with event rules.
8. Manual moves update conflicts immediately. Explicit optimisation replaces only the selected category's allocation.
9. Selection changes preserve assignments for surviving disciplines, remove absent disciplines, and allocate new ones. Manual allocations survive navigation.
10. Selection, allocation, and category-mapping changes clear transfer checkmarks. A successful new import, remapping, reset, or reload clears the relevant planning state. Failed imports must not replace an existing valid session.
11. Raw answers remain inspectable. Missing, invalid, negative, and not-applicable answers must not be silently conflated. The current normalised participation model is yes/no/open; richer missing reasons are a target improvement.
12. Counts are registration-based until the user resolves duplicates. Name and email are not authoritative identity keys.

## Club discipline selection

Coordinators can exclude and restore entire disciplines independently for Aktive and 35+.
Exclusions remain in session across navigation, optimisation, registration selection, edits,
and category mapping. Surviving disciplines retain their manual allocations. Changes clear
transfer marks. New imports, remapping, and reset clear discipline exclusions.
Excluded disciplines do not contribute to allocations, conflicts, planned participant counts,
or club discipline lists in Contest preparation, clipboard output, and printing. Registrations
without any remaining discipline are reported as unplanned. Original registration answers,
overview registration totals, and reusable CSV exports remain unchanged.

## Editing and reusable CSV exports

All source cells can be edited from Registrations or Data review, including empty, unknown, and unanalysed values. Save reanalyses all registrations (including duplicate hints), preserves source identities and exclusions, reconciles surviving manual allocations, and clears transfer marks. Cancel discards the draft. The original imported cells remain inspectable during the session.

The explicit CSV download includes every selected registration regardless of search/filter, with corrected cells and explicit category overrides applied. Excluded rows are omitted. Column order, duplicate headings, empty cells, quoting, and embedded newlines survive export and reimport. Explicit rows of empty cells are retained as registrations with validation hints; empty lines are skipped. No export is offered when every row is excluded. On reimport, users confirm discipline-column roles and the multi-select delimiter again. CSV does not save competition-part assignments or transfer marks. Downloads are local and do not modify the source file or Google Sheets.

## Privacy and reproducibility

Use fictional data and `example.com` addresses in demos, tests, screenshots, issues, and documentation. Keep demo data deterministic so manual changes can be compared. Small independent test fixtures should not change when the demonstration dataset changes.

Imported records remain in memory. Do not add persistence, remote logging, external data processing, or automatic clipboard/export actions as part of a refactoring. Public deployment contains application assets and fictional fixtures only.

## Excel review export

The overview and Contest preparation views offer an explicit local `.xlsx` download.
The export is a snapshot and never changes selections, allocations or transfer marks.
It contains six worksheets in order:

1. **Alle Anmeldungen**: all imported registrations, including excluded records with an explicit selection status, source row, original category, resolved category and review hints.
2. **Einzelwettkampf**: selected positive individual responses, with discipline/apparatus counts and registration details.
3. **Vereinswettkampf Aktive** and **Vereinswettkampf 35+**: independent side-by-side discipline rosters, grouped under the current competition parts. Each discipline has first-name and surname columns, sorted by surname and first name, followed by a total and a blank yellow responsibility field. Lists start at the same row and have a shared height. Empty parts retain a placeholder. Conflicting starts are red; source rows and review hints are cell notes. Duplicate registrations remain separate. Missing-discipline and unresolved-category notices appear below the lists. No filter is applied because rows across disciplines are independent. The two header rows stay frozen. Times and Tu/Ti are not available and are not inferred.
4. **Richter**: selected positive judge responses and a separate clarification section for open answers or a brevet with a negative answer. Qualifications are source statements, not verified eligibility.

5. **Festkarten**: selected registrations with their current card, manual/suggested status, cost and review hints. The adjacent order summary lists A/B/C quantities, unit prices, subtotals, the grand total and separate pending/no-card/review counts. Amounts use numeric CHF formatting; pending costs are blank. Base prices exclude surcharges and extras. Source/version and order deadline are included.

Selected club registrations with an unresolved category remain on **Alle Anmeldungen** with an explicit warning; each category sheet reports their count and refers to that sheet. No category, timetable or eligibility rule is inferred from a reference workbook.

The individual and judge summary sections sit beside their detail tables. Each sheet includes source and export time, wrapped text and a landscape print setup fitting one page wide. Valid birthdays are Excel dates; invalid values stay visible as text. Imported strings are literal cell values, never formulas. Workbook edits do not update the application.

## Open questions and future work

- Confirm complete form sections, mandatory fields, and selection values.
- Verify the actual Contest input fields and required totals.
- Competition rules beyond the festival-card subset below remain unimplemented and unverified.
- Associate future age limits, minimum team sizes, discipline restrictions, and judge requirements with an official source, section, and version.
- Decide whether multiple events or opt-in saved planning sessions are required.
- The repository is `soracel/Turnfestanmeldungs-Tool`, licensed under the [MIT License](../LICENSE), copyright (c) 2026 soracel.

Do not turn an assumed sporting rule into a validation error. User-confirmed category independence is a requirement; official event eligibility remains an open question.

## Festival-card order preparation

The Festkarten view prepares quantities and base costs for types A (CHF 98), B (CHF 45),
and C (CHF 48) only, as requested by the club. Source: _Wettkampfvorschriften,
Seeländisches Turnfest / Fête de gymnastique Biel/Bienne 2027_, version
24 September 2026, section 8.5, page 30; judge provision in 2.4.1, page 8;
deadlines in 1.7, page 7. The source PDF is supplied locally, not bundled in public assets.

Only selected registrations count. One registration has at most one card: A/B also
cover EGT participation. Duplicate hints remain visible and do not merge records.
Quantities, subtotals and the total are derived from current choices. Pending and
no-card choices are counted separately. Print includes the summary, assignments,
review notices and source/version. No order is submitted.

Suggestions are deliberately conservative, not eligibility decisions. A positive
judge answer plus competition participation suggests A, regardless of age. Judge
answers indicate availability rather than a verified appointment; functionary roles
are absent from the import and require manual review. Explicit negative answers to
both competitions suggest no card. Open participation or judge answers need review.
For valid birth years, 2010 and younger receive B, including individual-only
participation, because B covers EGT as well. The user confirmed that the source's
“bis Jahrgang 2010” includes that year and all younger cohorts. Birth years before
2010 receive A for club participation or C for individual-only participation with
apparatus details and no other individual disciplines. Invalid or missing birthdays
stay pending. Unclear individual events in older cohorts also stay pending.
C assumes no A/B has been ordered elsewhere. Competing judges still receive A
regardless of birth year; explicit manual choices continue to take precedence.

Users may select A, B, C, pending or no card, or restore the suggestion. Explicit
choices take precedence, with warnings for C with club participation, competing
judges without A, and participants without a card. These warnings do not silently
remove assigned cards from the total. Choices survive navigation and exclusion/
reinclusion. Editing a source registration clears its choice for fresh review;
new imports, remapping and reset clear all choices. Choices are session-only and
are included in the Excel review workbook but not in the source CSV. Card changes
clear transfer marks. All processing remains local.

The summarised order deadline is 15 November 2026. Late purchase after 28 February
through 15 April 2027 adds CHF 10 per card; later purchase is only at the festival.
Displayed totals are base costs and exclude late fees, control surcharges, overnight
stays and extra services. No surcharge is applied from the computer's date.

The card assignment list supports combined name/source-row search and filters for
A/B/C, pending, no card, review hints and manual choices. Filters only affect the
on-screen assignment list. Order totals, Excel export and printing always include
all selected registrations. Printing shows all assignments, including rows hidden
by on-screen filters. The filter controls and filtered count are not printed.

## Birthday plausibility

A valid calendar date is separately reviewed against the injected current date:
completed ages on the local calendar date below 3 or above 100 receive an `implausible-birthday` warning.
These are data-review thresholds, not official minimum/maximum participation ages.
The warning covers accidental current-year birthdays and appears in data review,
registration details and Excel review hints. Original values remain unchanged;
valid but implausible dates remain typed dates in Excel. Invalid/future/missing dates
retain the existing invalid-date warning instead of a second plausibility warning.
Competing registrations with implausible birthdays receive no automatic festival
card, including judges. A manual choice is allowed but keeps the birthday review
warning. Editing the birthday reanalyses the registration and card suggestion.
