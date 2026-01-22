const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const VisaReferenceFormSchema = new Schema({
  personalDetails: {
    generalDetails: {
      givenName: { type: String, required: true },
      familyName: { type: String, required: true },
      dob: { type: Date, required: true },
      gender: { type: String, required: true },
      placeOfBirth: { type: String, required: true },
      state: { type: String, required: true },
      phoneNo: { type: String, required: true },
      emailId: { type: String, required: true },
      citizenOf: { type: String, required: true },
      maritalStatus: { type: String, required: true },
    },
    passportDetails: {
      passportNo: { type: String, required: true },
      placeOfIssue: { type: String, required: true },
      issuingAuthority: { type: String, required: true },
      dateOfIssue: { type: Date, required: true },
      dateOfExpiry: { type: Date, required: true },
      oldPassportNo: { type: String, required: true },
    },
  },
  educationDetails: {
    is: { type: Boolean, required: true },
    data: [
      {
        id: { type: Number, required: true },
        institutionName: { type: String, required: true },
        courseType: { type: String, required: true },
        institutionAddress: { type: String, required: true },
        from: { type: Date, required: true },
        to: { type: Date, required: true },
      },
    ],
  },
  employmentDetails: {
    is: { type: Boolean, required: true },
    data: [
      {
        id: { type: Number, required: true },
        from: { type: Date, required: true },
        to: { type: Date, required: true },
        company: { type: String, required: true },
        designation: { type: String, required: true },
      },
    ],
  },
  address: {
    data: [
      {
        id: { type: Number, required: true },
        address: { type: String, required: true },
        from: { type: Date, required: true },
        to: { type: Date, required: true },
      },
    ],
  },
  relativesAbroadArr: {
    is: { type: Boolean, required: true },
    data: [
      {
        id: { type: Number, required: true },
        firstName: { type: String, required: true },
        familyName: { type: String, required: true },
        dob: { type: Date, required: true },
        placeOfBirth: { type: String, required: true },
        countryLivingIn: { type: String, required: true },
        passportNo: { type: String, required: true },
        visaValidThrough: { type: Date, required: true },
        visaHeld: { type: String, required: true },
      },
    ],
  },
  dependentDetailsArr: {
    is: { type: Boolean, required: true },
    data: [
      {
        id: { type: Number, required: true },
        firstName: { type: String, required: true },
        familyName: { type: String, required: true },
        dob: { type: Date, required: true },
        placeOfBirth: { type: String, required: true },
        state: { type: String, required: true },
        passportNo: { type: String, required: true },
      },
    ],
  },
  spouseDetails: {
    is: { type: Boolean, required: true },
    data: {
      generalDetails: {
        givenName: { type: String, required: true },
        familyName: { type: String, required: true },
        dob: { type: Date, required: true },
        gender: { type: String, required: true },
        placeOfBirth: { type: String, required: true },
        state: { type: String, required: true },
        phoneNo: { type: String, required: true },
        emailId: { type: String, required: true },
        citizenOf: { type: String, required: true },
      },
      passportDetails: {
        passportNo: { type: String, required: true },
        placeOfIssue: { type: String, required: true },
        issuingAuthority: { type: String, required: true },
        dateOfIssue: { type: Date, required: true },
        dateOfExpiry: { type: Date, required: true },
        oldPassportNo: { type: String, required: true },
      },
      educationDetails: {
        is: { type: Boolean, required: true },
        data: [
          {
            id: { type: Number, required: true },
            institutionName: { type: String, required: true },
            courseType: { type: String, required: true },
            institutionAddress: { type: String, required: true },
            from: { type: Date, required: true },
            to: { type: Date, required: true },
          },
        ],
      },
      employmentDetails: {
        is: { type: Boolean, required: true },
        data: [
          {
            id: { type: Number, required: true },
            from: { type: Date, required: true },
            to: { type: Date, required: true },
            company: { type: String, required: true },
            designation: { type: String, required: true },
          },
        ],
      },
      address: {
        data: [
          {
            id: { type: Number, required: true },
            address: { type: String, required: true },
            from: { type: Date, required: true },
            to: { type: Date, required: true },
          },
        ],
      },
      familyHistory: {
        data: [
          {
            id: { type: Number, required: true },
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            dob: { type: Date, required: true },
            placeOfBirth: { type: String, required: true },
            state: { type: String, required: true },
            passportNo: { type: String, required: true },
            placeOfIssue: { type: String, required: true },
            familyStatus: { type: String, required: true },
            relation: { type: String, required: true },
          },
        ],
      },
      travelHistory: {
        is: { type: Boolean, required: true },
        data: [
          {
            id: { type: Number, required: true },
            visaAppliedFor: { type: String, required: true },
            country: { type: String, required: true },
            outcome: { type: String, required: true },
            dateOfEntry: { type: Date, required: true },
            dateOfExit: { type: Date, required: true },
            durationOfStay: { type: String, required: true },
            purposeOfTravel: { type: String, required: true },
            visaValidityFrom: { type: Date, required: true },
            visaValidityTo: { type: Date, required: true },
            applicationVisaRefNo: { type: String, required: true },
            refusalReason: { type: String, required: true },
          },
        ],
      },
    },
  },
  travelHistoryArr: {
    is: { type: Boolean, required: true },
    data: [
      {
        id: { type: Number, required: true },
        visaAppliedFor: { type: String, required: true },
        country: { type: String, required: true },
        outcome: { type: String, required: true },
        dateOfEntry: { type: Date, required: true },
        dateOfExit: { type: Date, required: true },
        durationOfStay: { type: String, required: true },
        purposeOfTravel: { type: String, required: true },
        visaValidityFrom: { type: Date, required: true },
        visaValidityTo: { type: Date, required: true },
        applicationVisaRefNo: { type: String, required: true },
        refusalReason: { type: String, required: true },
      },
    ],
  },
  familyHistory: {
    data: [
      {
        id: { type: Number, required: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        dob: { type: Date, required: true },
        placeOfBirth: { type: String, required: true },
        state: { type: String, required: true },
        passportNo: { type: String, required: true },
        placeOfIssue: { type: String, required: true },
        familyStatus: { type: String, required: true },
        relation: { type: String, required: true },
      },
    ],
  },
});

const VisaReferenceForm = mongoose.model("VisaReferenceForm", VisaReferenceFormSchema);
module.exports = VisaReferenceForm;