/**
 * Allow list for the Zoho `Visa_Applications` module, grouped by layout section (D24).
 * Each map is `output name -> Zoho API name`. Zoho reuses API names across sections, so the
 * output names follow the layout label the staff see, never the API name.
 * Left out on purpose: email, reminder, automation, system and portal fields (`DMS_Portal_Account`).
 */
export const SKILL_ASSESSMENT = {
  name: 'Stage_1_Name',
  anzsco: 'ANZSCO_NOC',
  assessingAuthority: 'Assessing_Authority',
  noc: 'NOC_S',
  governmentFee: 'Fee_Paid',
  suggestedAnzsco: 'Suggested_ANZSCO1',
  educationRecognized: 'Education_Recognized',
  fileNo: 'Reference_No',
  dateOfFiling: 'Lodgement_Date',
} as const;

export const SA_OUTCOME = {
  outcomeDate: 'Date_of_Skill_Assessment',
  validUpto: 'Deadline_for_Next_Step',
  experienceConsidered: 'Experience_Consider',
  nominatedOccupations: 'Nominated_Occupations',
  warningExpiryDate: 'Warning_Expiry_Date_for_Skill_Assessment',
} as const;

export const EOI = {
  name: 'Stage_2_Name',
  statesAppliedFor: 'States_Applied_For',
  language: 'Language',
  points189: 'Points_for_Subclass_189',
  points190: 'Points_for_SubClass_190',
  points491: 'Points_for_Subclass_491',
  pointsActMatrix: 'Points_for_ACT_Metrix',
  dateOfFiling: 'Date_of_filing_Stage_2',
  validUpto: 'Dead_line_of_filing_Stage_2',
  filingDeadline: 'Test_Taken_Date',
} as const;

// One entry per ROI round; the three rounds share one shape. Only round 1 carries points.
export const ROI_ROUNDS = [
  {
    date: 'DATE',
    statesLodge: 'Outcome_Stage_2',
    points: 'Points_PNP',
    pnpDate: 'Validity_Stage_4_Negative_Outcome',
    expiryDate: 'Expiry_Date',
    expressEntryNumber: 'Express_Entry_no',
  },
  {
    date: 'ROI_2_Date',
    statesLodge: 'ROI_2_States_Lodge',
    points: null,
    pnpDate: 'Date_of_Invitation_Notification_Received',
    expiryDate: 'Validity_Stage_1_Negative_Outcome',
    expressEntryNumber: 'Express_Entry_number1',
  },
  {
    date: 'ROI_3_Date',
    statesLodge: 'ROI_3_States_Lodge',
    points: null,
    pnpDate: 'Date_of_Visa_Application_Received',
    expiryDate: 'PNP_application_Date',
    expressEntryNumber: 'Express_Entry_PNP_31',
  },
] as const;

export const INVITATION = {
  dateReceived: 'Date_of_filing_Stage_3',
  invitationType: 'Invitation_Type',
  invitationTypeIta1: 'Invitation_type_ITA_1',
  invitedBy: 'INVITIED_BY',
  statesInvited: 'FEES_ITA_3',
  pointsInvited: 'POINTS_INVITED_ON_ITA_1',
  validUpto: 'Dead_line_of_filing_ITA_1',
  stageDeadline: 'ITA_VALID_UPTO',
  assessingAuthority: 'Assessing_Authority_Stage_3',
} as const;

export const ITA_FILED = {
  fileNo: 'Selected_Visa_Type',
  filedDate: 'Validity_Stage_3',
  expiryDate: 'Validity_Stage_3_Negative_Outcome',
  anzsco: 'ANZSCO_ITA_2',
  state: 'State_ITA2',
  pointsInvited: 'Points_Invited_ITA_2',
  invitedBy: 'Outcome',
  invitationType: 'Outcome_Stage_6',
  fees: 'Visa_Outcome',
  fee: 'Fee',
  fundsAvailable: 'Funds_Avalliable',
  notes: 'Stage_5_Name',
} as const;

export const ITA_FINAL = {
  fileNo: 'File_No_ITA_31',
  finalDate: 'Validity_Stage_5',
  expiryDate: 'Validity_Stage_6',
  anzsco: 'ANZSCO_ITA_3',
  state: 'States_ITA_3',
  invitedBy: 'Invited_by_ITA_3',
  invitationType: 'Invitation_Type_ITA_3',
  pointsInvited: 'Points_Invited_ITA_3',
  pointsInvitedFinal: 'Points_Invited_final',
} as const;

export const LODGE = {
  dateOfFiling: 'LODGE_DATE_OF_FILING',
  fileNo: 'LODGE_FILE_NO1',
  subclass: 'LODGE_SubClass1',
  state: 'LODGE_STATE',
  feesPaid: 'FEEZ1',
  numberOfApplicants: 'NO_OF_APPLICANTS',
  pointsAtLodge: 'POINTS_AT_TIME_OF_LODGE',
  maritalStatus: 'Marital_Status',
  medical: 'Medical',
  validityDate: 'Date_of_filing_Stage_6',
} as const;

export const MEDICALS = {
  hapId: 'HAP_Id',
  subclass: 'LODGE_SubClass',
  date: 'MEDICAL_DATE',
  validUpto: 'MEDICALS_VALID_UPTO',
} as const;

export const VISA_GRANT = {
  fileNo: 'File_No_Stage_4',
  grantDate: 'Date_of_filing_Stage_4',
  validity: 'Date_of_Invitation_Approval_Received',
  subclass: 'VISA_GRAND_SUBCLASS',
  state: 'Visa_Grant_State',
  firstEntryDate: 'Date_of_filing_Stage_5',
} as const;

// Only the five tests the new DMS can store (ielts, pte, toefl, celpip, oet). Zoho reuses API names, so the
// outcome dates and the two PTE validity fields follow the layout labels. CAE and PTE Core are recognised
// from `testTaken` alone; scores are not exported.
export const LANGUAGE = {
  testTaken: 'Test_Taken',
} as const;

export const LANGUAGE_TESTS = {
  ielts: { outcomeDate: 'IELTS_OutCome_Date', validUpto: 'IELTS_Validity_Upto' },
  pte: { outcomeDate: 'Visa_Approved', validUpto: 'PTE_Validity_Upt' },
  toefl: { outcomeDate: 'Result_Date', validUpto: 'TOEFL_Validity_Upto' },
  celpip: { outcomeDate: 'EOI_Date', validUpto: 'CELPI_Validity_Upto' },
  oet: { outcomeDate: 'Last_Date_for_Submission_of_Documents', validUpto: 'OET_Validity_Upto' },
} as const;

export const OTHER = {
  suggestedAnzsco: 'Suggested_Anzsco',
  applicationType: 'Application_Type',
  paymentType: 'Payment_Type',
  deadlineForLodgment: 'Deadline_For_Lodgment',
  qualifiedCountry: 'Qualified_Country',
  serviceType: 'Service_Type',
} as const;

const apiNames = (...maps: readonly Record<string, string | null>[]): string[] =>
  maps.flatMap((map) => Object.values(map).filter((name): name is string => name !== null));

export const VISA_APPLICATION_FIELDS: readonly string[] = [
  ...new Set(
    apiNames(SKILL_ASSESSMENT, SA_OUTCOME, EOI, INVITATION, ITA_FILED, ITA_FINAL, LODGE, MEDICALS, VISA_GRANT, LANGUAGE, ...Object.values(LANGUAGE_TESTS), OTHER, ...ROI_ROUNDS)
  ),
];
