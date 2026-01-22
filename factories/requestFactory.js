// factories/requestFactory.js
function createRequest(overrides = {}) {
  return {
    body: {
      eligibilityData: {
        age: 30,
        country: "australia",
        education: "bachelors",
        email: "hamid@worldvisaaa.in",
        englishLanguageAbility: "expert",
        fullName: "Hafeez",
        maritalStatus: "married",
        countryCode: "91",
        phoneNumber: "8497048572",
        service: "work",
        spouseEducation: "Bachelors",
        spouseEnglishLanguageAbility: "Fluent",
        spouseWorkExperience: "4",
        workExperience: "4",
        workOverseasExperience: "2",
        ...overrides.eligibilityData
      },
      assessmentReports: {
        australia: {
          eligible: true,
          data: {
            age: { value: "30", eligible: true, message: "Age Requirements: Min. 18 years - Max. 44 years" },
            education: { value: "masters degree", eligible: true, message: "Education Requirements: Min. Diploma/Bachelor's degree" },
            experience: { value: "20", eligible: true, message: "Experience Requirements: Min. 3 years" },
            language: { value: "expert", eligible: true, message: "Language Requirements: Min. Competent level" },
            jobOffer: { value: "", eligible: true, message: "Job Offer is Required for the selected country" }
          }
        },
        canada: {
          eligible: false,
          data: {
            age: { value: "30", eligible: true, message: "Age Requirements: Min. 18 years - Max. 44 years" },
            education: { value: "masters degree", eligible: true, message: "Education Requirements: Min. Diploma/Bachelor's degree" },
            experience: { value: "20", eligible: true, message: "Experience Requirements: Min. 3 years" },
            language: { value: "expert", eligible: true, message: "Language Requirements: Min. Competent level" },
            jobOffer: { value: "", eligible: true, message: "Job Offer is Required for the selected country" }
          }
        }
      },
      ...overrides.assessmentReports
    }
  };
}

module.exports = { createRequest };