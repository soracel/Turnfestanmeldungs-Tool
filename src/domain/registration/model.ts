export type RegistrationId = string;
export type ParticipationAnswer = 'yes' | 'no' | 'open';
export type AnswerField = 'individual' | 'club' | 'overnight' | 'judge';
export type IssueCode =
  | 'missing-name'
  | 'invalid-birthday'
  | 'invalid-email'
  | 'unknown-answer'
  | 'missing-category'
  | 'missing-club-discipline'
  | 'missing-individual-details'
  | 'club-without-consent'
  | 'individual-without-consent'
  | 'missing-brevet'
  | 'possible-duplicate';
export interface RegistrationIssue {
  readonly code: IssueCode;
  readonly registrationId: RegistrationId;
  readonly severity: 'warning';
  readonly field?: AnswerField;
}
export interface Registration {
  readonly id: RegistrationId;
  readonly rowNumber: number;
  readonly first: string;
  readonly last: string;
  readonly name: string;
  readonly birth: string;
  readonly email: string;
  readonly individual: ParticipationAnswer;
  readonly club: ParticipationAnswer;
  readonly category: string;
  readonly apparatus: string;
  readonly overnight: ParticipationAnswer;
  readonly judge: ParticipationAnswer;
  readonly brevet: string;
  readonly clubDisciplines: readonly string[];
  readonly individualDisciplines: readonly string[];
  readonly issues: readonly RegistrationIssue[];
}
export interface RegistrationInput {
  readonly id: RegistrationId;
  readonly rowNumber: number;
  readonly first: string;
  readonly last: string;
  readonly birth: string;
  readonly email: string;
  readonly individual: string;
  readonly club: string;
  readonly category: string;
  readonly apparatus: string;
  readonly overnight: string;
  readonly judge: string;
  readonly brevet: string;
  readonly clubDisciplines: readonly string[];
  readonly individualDisciplines: readonly string[];
}
