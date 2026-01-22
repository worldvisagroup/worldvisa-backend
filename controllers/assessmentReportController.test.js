const assessmentReport = require("./assessmentReportController");
const { createRequest } = require("../factories/requestFactory");

const res = {
  json: jest.fn()
};


test("Invalid Data error", async () => {
  const req = { body: undefined };


  await assessmentReport.sendAssessmentReport(req, res);

  expect(res.json).toHaveBeenCalledWith({ message: "Failed", error: "Invalid Request Data" });
});

test("Invalid Eligibility Data error", async () => {
  const req = { body: { eligibilityData: undefined } };


  await assessmentReport.sendAssessmentReport(req, res);

  expect(res.json).toHaveBeenCalledWith({ message: "Failed", error: "Invalid Request Data" });
});

test("Invalid Assessment Reports Data error", async () => {
  const req = { body: { assessmentReports: undefined } };


  await assessmentReport.sendAssessmentReport(req, res);

  expect(res.json).toHaveBeenCalledWith({ message: "Failed", error: "Invalid Request Data" });
});

test("Sends Work Assessment Report to User's Whatsapp - User Eligible for Australia", async () => {
  const req = createRequest({
    eligibilityData: { age: 35, country: "canada", phoneNumber: "8497048572" },
    assessmentReports: {
      australia: {
        eligible: true,
        data: {
          age: { value: "35", eligible: true, message: "Age Requirements: Min. 18 years - Max. 44 years" }
        }
      }
    }
  });

  await assessmentReport.sendAssessmentReport(req, res);

  expect(res.json).toHaveBeenCalledWith({ message: "Success", leadCreated: "Lead Already Exists", whatsappMessageSent: true });
});

test("Invalid Whatsapp Number should return false on whatsappMessageSent", async () => {
  const req = createRequest({
    eligibilityData: { age: 35, country: "canada", phoneNumber: "849704857" },
    assessmentReports: {
      australia: {
        eligible: true,
        data: {
          age: { value: "35", eligible: true, message: "Age Requirements: Min. 18 years - Max. 44 years" }
        }
      }
    }
  });

  await assessmentReport.sendAssessmentReport(req, res);

  expect(res.json).toHaveBeenCalledWith({ message: "Success", leadCreated: "Lead Already Exists", whatsappMessageSent: false });
});