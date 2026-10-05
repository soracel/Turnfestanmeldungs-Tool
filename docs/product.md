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

## Editing and reusable CSV exports

All source cells can be edited from Registrations or Data review, including empty, unknown, and unanalysed values. Save reanalyses all registrations (including duplicate hints), preserves source identities and exclusions, reconciles surviving manual allocations, and clears transfer marks. Cancel discards the draft. The original imported cells remain inspectable during the session.

The explicit CSV download includes every selected registration regardless of search/filter, with corrected cells and explicit category overrides applied. Excluded rows are omitted. Column order, duplicate headings, empty cells, quoting, and embedded newlines survive export and reimport. Explicit rows of empty cells are retained as registrations with validation hints; empty lines are skipped. No export is offered when every row is excluded. On reimport, users confirm discipline-column roles and the multi-select delimiter again. CSV does not save competition-part assignments or transfer marks. Downloads are local and do not modify the source file or Google Sheets.

## Privacy and reproducibility

Use fictional data and `example.com` addresses in demos, tests, screenshots, issues, and documentation. Keep demo data deterministic so manual changes can be compared. Small independent test fixtures should not change when the demonstration dataset changes.

Imported records remain in memory. Do not add persistence, remote logging, external data processing, or automatic clipboard/export actions as part of a refactoring. Public deployment contains application assets and fictional fixtures only.

## Open questions and future work

- Confirm complete form sections, mandatory fields, and selection values.
- Verify the actual Contest input fields and required totals.
- Review the supplied competition PDF, identified locally as `../private-data/wettkampfvorschriften-stf-2027-version-20260924.pdf`. Its rules have not been implemented or verified here.
- Associate future age limits, minimum team sizes, discipline restrictions, and judge requirements with an official source, section, and version.
- Decide whether multiple events or opt-in saved planning sessions are required.
- The repository is `soracel/Turnfestanmeldungs-Tool`, licensed under the [MIT License](../LICENSE), copyright (c) 2026 soracel.

Do not turn an assumed sporting rule into a validation error. User-confirmed category independence is a requirement; official event eligibility remains an open question.
