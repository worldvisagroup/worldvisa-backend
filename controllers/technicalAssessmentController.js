const express = require("express");
const { createPDFWithName } = require("./technicalAssessmentPdf");
const openaiService = require('../services/openaiService');
const { allSectionsData, prPathwayTotalPointsByVisaSubclass } = require("../services/technicalAssessmentMock");




const technicalAssessmentHandler = async (req, res) => {
  // Extract relevant fields from req.body, including educationQualification
  const {
    name,
    dob,
    englishLanguage,
    communityLanguage,
    skillAssessingAuthority,
    educationQualification,
    anzsco,
    overseasWorkExperience,
    maritalStatus,
    currentCompanyName,
    currentDesignation,
    australianWorkExperience,
    australianStudy,
    country,
    nationality,
    leadOwner,
    spouseAge,
    spouseEnglishLanguage,
    spouseEligibleForAssessment,
  } = req.body;

  // Improved validation: Collect missing required fields and give a more precise error message
  const requiredFields = [
    { key: "name", value: name },
    { key: "dob", value: dob },
    { key: "englishLanguage", value: englishLanguage },
    { key: "communityLanguage", value: communityLanguage },
    { key: "skillAssessingAuthority", value: skillAssessingAuthority },
    { key: "educationQualification", value: educationQualification },
    { key: "anzsco", value: anzsco },
    { key: "overseasWorkExperience", value: overseasWorkExperience, mustNotBeNull: true },
    { key: "maritalStatus", value: maritalStatus },
    { key: "currentCompanyName", value: currentCompanyName },
    { key: "currentDesignation", value: currentDesignation },
    { key: "australianWorkExperience", value: australianWorkExperience, mustNotBeNull: true },
    { key: "australianStudy", value: australianStudy, mustNotBeNull: true },
    { key: "country", value: country },
    { key: "nationality", value: nationality },
    { key: "leadOwner", value: leadOwner },
    { key: "spouseAge", value: spouseAge },
    { key: "spouseEnglishLanguage", value: spouseEnglishLanguage },
    { key: "spouseEligibleForAssessment", value: spouseEligibleForAssessment, mustNotBeNull: true },
  ];

  const missingFields = requiredFields.filter(field => {
    if (field.mustNotBeNull) {
      return field.value === undefined || field.value === null;
    }
    return !field.value;
  }).map(field => field.key);

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: `Missing required fields: ${missingFields.join(", ")}.`
    });
  }

  // Build profile, ensuring educationQualification is included and caseOwner alias
  const profile = {
    name,
    dob,
    englishLanguage,
    communityLanguage,
    skillAssessingAuthority,
    educationQualification,
    anzsco,
    overseasWorkExperience,
    maritalStatus,
    currentCompanyName,
    currentDesignation,
    australianWorkExperience,
    australianStudy,
    country,
    nationality,
    caseOwner: leadOwner,
    spouseAge,
    spouseEnglishLanguage,
    spouseEligibleForAssessment
  };

  try {
    // Profile Summary: AI Markdown Table
    // Mock
    // const aiContentProfileSummaryTable = mockAiProfileSummaryTable;
    // AI
    const aiContentProfileSummaryTable = await openaiService.technicalAssessmentAiProfileSummaryTable(profile);

    // Profile Summary: AI Bullet points
    const aiContentProfileSummarySnapshots = await openaiService.technicalAssessmentAiProfileSnapshots(profile, aiContentProfileSummaryTable);

    const contextaiPrPathwayEligibilityTable = aiContentProfileSummaryTable + " " + aiContentProfileSummarySnapshots;
    // Pr Pathway Eligibility Table
    const aiPrPathwayEligibilityTable = await openaiService.technicalAssessmentAiPrPathwayEligibleTable(profile, contextaiPrPathwayEligibilityTable);

    const contextAiPrPathwayTable = aiContentProfileSummaryTable + " " + aiContentProfileSummarySnapshots + aiPrPathwayEligibilityTable;
    // Pr Pathway Table: AI Markdown Table
    const aiPrPathwayTable = await openaiService.technicalAssessmentAiPrPathways(profile, contextAiPrPathwayTable);

    // Pr pathway total points by visa subclass - not using
    const aiPrPathwayTotalPointsByVisaSubclass = prPathwayTotalPointsByVisaSubclass;

    const contextaiPrPathwayInterpretation = aiContentProfileSummaryTable;
    // Pr pathway interpretation
    // const aiPrPathwayInterpretation = await openaiService.technicalAssessmentAiPrPathwayInterpretasionPoints(profile, contextaiPrPathwayInterpretation);
    const aiPrPathwayInterpretation = "";

    const contextaiPrStateNominationTable = aiContentProfileSummaryTable;
    // State Nomination: AI Markdown Table
    const aiPrStateNominationTable = await openaiService.technicalAssessmentAiStateNominationMatrix(profile, contextaiPrStateNominationTable);

    const contextaiPrLabourMarketOutlookByRegion = aiContentProfileSummaryTable;
    // labourMarketOutlookByRegion : AI Markdown Table
    const aiPrLabourMarketOutlookByRegion = await openaiService.technicalAssessmentAiLabourMarketOutlookByRegion(profile, contextaiPrLabourMarketOutlookByRegion);

    const contextaiPrSalaryBenchmarks = aiContentProfileSummaryTable;

    // salaryBenchmarks: AI Markdown Table
    const aiPrSalaryBenchmarks = await openaiService.technicalAssessmentAiSalaryBenchmarks(profile, contextaiPrSalaryBenchmarks);

    const contextaiPrStepByStepPlanAndSla = aiContentProfileSummaryTable;

    const aiPrStepByStepPlanAndSla = await openaiService.technicalAssessmentAiStepByStepPlanAndSla(profile, contextaiPrStepByStepPlanAndSla);

    const contextaiPrRiskRegisterMitigations = aiContentProfileSummaryTable;

    const aiPrRiskRegisterMitigations = await openaiService.technicalAssessmentAiRiskRegisterMitigations(profile, contextaiPrRiskRegisterMitigations);

    const contextaiPrOutcomeForecastBulletPoints = aiContentProfileSummaryTable;

    const aiPrOutcomeForecastBulletPoints = await openaiService.technicalAssessmentOutcomeForecastBulletPoints(profile, contextaiPrOutcomeForecastBulletPoints);

    const aiPrWhyMaraAdvantage = `When your visa shapes your future, trust only those legally authorised to guide it. A MARA-registered agent brings legal precision, accountability, and expertise — not guesswork.`;

    const aiPrLegalAuthorityAccountability = `Only MARA agents can lawfully provide migration advice in Australia. They’re trained in migration law, licensed by the Migration Agents Registration Authority, and answerable under Australian law for every recommendation made.`;

    const aiPrUpToDateExpertiseData = `MARA agents complete mandatory annual training (CPD) to stay current on migration legislation, visa policies, and program updates — ensuring every application meets the latest compliance standards.`;

    const aiPrRiskMitigationData = [
      '- Selecting the right visa subclass',
      '- Ensuring accurate and complete documentation',
      '- Timing applications strategically',
      '- Representing clients when required'
    ];

    const aiPrTimeCostPeaceOfMind = [
      "- Faster processing times",
      "- Higher success rates",
      "- Less stress and uncertainty",
      "- Savings from avoiding costly re-applications"
    ];

    const aiPrMaraSummaryData = `A MARA-registered agent is your licensed legal expert, trusted advisor, and success partner — transforming your migration journey into a compliant, confident, and stress-free experience.`;


    if (aiContentProfileSummaryTable) {
      allSectionsData.profileSummaryTable.content = aiContentProfileSummaryTable;
    }

    if (aiContentProfileSummarySnapshots) {
      allSectionsData.profileSummarySnapshots.content = aiContentProfileSummarySnapshots;
    }

    if (aiPrPathwayTable) {
      allSectionsData.prPathwayTable.content = aiPrPathwayTable;
    }

    if (aiPrPathwayEligibilityTable) {
      allSectionsData.prPathwayEligibilityTable.content = aiPrPathwayEligibilityTable;
    }

    if (aiPrPathwayTotalPointsByVisaSubclass) {
      allSectionsData.prPathwayTotalPointsByVisaSubclass.content = aiPrPathwayTotalPointsByVisaSubclass;
    }

    if (aiPrPathwayInterpretation) {
      allSectionsData.prPathwayInterpretation.content = aiPrPathwayInterpretation;
    }

    if (aiPrStateNominationTable) {
      allSectionsData.crossStateNominationMatrix.content = aiPrStateNominationTable;
    }

    if (aiPrLabourMarketOutlookByRegion) {
      allSectionsData.labourMarketOutlookByRegion.content = aiPrLabourMarketOutlookByRegion;
    }

    if (aiPrSalaryBenchmarks) {
      allSectionsData.salaryBenchmarks.content = aiPrSalaryBenchmarks;
    }

    if (aiPrStepByStepPlanAndSla) {
      allSectionsData.stepByStepPlanAndSLA.content = aiPrStepByStepPlanAndSla;
    }

    if (aiPrRiskRegisterMitigations) {
      allSectionsData.riskRegisterMitigations.content = aiPrRiskRegisterMitigations;
    }

    if (aiPrOutcomeForecastBulletPoints) {
      allSectionsData.outcomeForecast.content = aiPrOutcomeForecastBulletPoints;
    }

    if (aiPrWhyMaraAdvantage) {
      allSectionsData.whyMaraAdvantage.content = aiPrWhyMaraAdvantage;
    }

    if (aiPrLegalAuthorityAccountability) {
      allSectionsData.legalAuthorityAccountability.content = aiPrLegalAuthorityAccountability;
    }

    if (aiPrUpToDateExpertiseData) {
      allSectionsData.upToDateExpertise.content = aiPrUpToDateExpertiseData;
    }

    if (aiPrRiskMitigationData) {
      allSectionsData.riskMitigation.content = aiPrRiskMitigationData;
    }

    if (aiPrTimeCostPeaceOfMind) {
      allSectionsData.timeCostPeaceOfMind.content = aiPrTimeCostPeaceOfMind;
    }

    if (aiPrMaraSummaryData) {
      allSectionsData.maraSummary.content = aiPrMaraSummaryData;
    }

    const technicalAssessmentPdf = await createPDFWithName(name, allSectionsData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="technical-assessment-hafeez.pdf"');
    res.setHeader('Content-Length', technicalAssessmentPdf.length);
    res.send(technicalAssessmentPdf);
  } catch (error) {
    console.log('error: ', error);
    res.status(500).json({
      error: 'Failed to generate PDF',
      message: error.message
    });
  }
};

const technicalAssessmentHandlerNew = async (req, res) => {
  // Extract relevant fields from req.body, including educationQualification
  const {
    name,
    dob,
    englishLanguage,
    communityLanguage,
    skillAssessingAuthority,
    educationQualification,
    anzsco,
    overseasWorkExperience,
    maritalStatus,
    currentCompanyName,
    currentDesignation,
    australianWorkExperience,
    australianStudy,
    country,
    nationality,
    leadOwner,
    spouseAge,
    spouseEnglishLanguage,
    spouseEligibleForAssessment,
  } = req.body;

  // Improved validation: Collect missing required fields and give a more precise error message
  const requiredFields = [
    { key: "name", value: name },
    { key: "dob", value: dob },
    { key: "englishLanguage", value: englishLanguage },
    { key: "communityLanguage", value: communityLanguage },
    { key: "skillAssessingAuthority", value: skillAssessingAuthority },
    { key: "educationQualification", value: educationQualification },
    { key: "anzsco", value: anzsco },
    { key: "overseasWorkExperience", value: overseasWorkExperience, mustNotBeNull: true },
    { key: "maritalStatus", value: maritalStatus },
    { key: "currentCompanyName", value: currentCompanyName },
    { key: "currentDesignation", value: currentDesignation },
    { key: "australianWorkExperience", value: australianWorkExperience, mustNotBeNull: true },
    { key: "australianStudy", value: australianStudy, mustNotBeNull: true },
    { key: "country", value: country },
    { key: "nationality", value: nationality },
    { key: "leadOwner", value: leadOwner },
    { key: "spouseAge", value: spouseAge },
    { key: "spouseEnglishLanguage", value: spouseEnglishLanguage },
    { key: "spouseEligibleForAssessment", value: spouseEligibleForAssessment, mustNotBeNull: true },
  ];

  const missingFields = requiredFields.filter(field => {
    if (field.mustNotBeNull) {
      return field.value === undefined || field.value === null;
    }
    return !field.value;
  }).map(field => field.key);

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: `Missing required fields: ${missingFields.join(", ")}.`
    });
  }

  // Build profile, ensuring educationQualification is included and caseOwner alias
  const profile = {
    name,
    dob,
    englishLanguage,
    communityLanguage,
    skillAssessingAuthority,
    educationQualification,
    anzsco,
    overseasWorkExperience,
    maritalStatus,
    currentCompanyName,
    currentDesignation,
    australianWorkExperience: australianWorkExperience ?? 0,
    australianStudy,
    country,
    nationality,
    caseOwner: leadOwner,
    spouseAge,
    spouseEnglishLanguage,
    spouseEligibleForAssessment
  };

  try {
    const technicalAssementAiResult = await openaiService.generateTechnicalAssessment(profile);

    let sanitizedNamed = name.replace(/[<>:"/\\|?*]+/g, '').replace(/\s+/g, ' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const technicalAssessmentPdf = await createPDFWithName(sanitizedNamed, technicalAssementAiResult);

    res.setHeader('Content-Type', 'application/pdf');
    const sanitizedName = sanitizedNamed
      ? sanitizedNamed
      : 'report';

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="technical-assessment-${sanitizedName}.pdf"`
    );
    res.setHeader('Content-Length', technicalAssessmentPdf.length);
    res.send(technicalAssessmentPdf);

  } catch (error) {
    console.log("error: ", error);
    res.status(500).json({
      error: 'Failed to generate PDF',
      message: error.message
    });
  }
};

const technicalAssessmentWithSeedHandler = async (req, res) => {
  try {
    const {
      name,
      dob,
      englishLanguage,
      communityLanguage,
      skillAssessingAuthority,
      educationQualification,
      anzsco,
      overseasWorkExperience,
      maritalStatus,
      currentCompanyName,
      currentDesignation,
      australianWorkExperience,
      australianStudy,
      country,
      nationality,
      leadOwner,
      spouseAge,
      spouseEnglishLanguage,
      spouseEligibleForAssessment,
    } = req.body;

    // Validation
    const requiredFields = [
      { key: "name", value: name },
      { key: "dob", value: dob },
      { key: "englishLanguage", value: englishLanguage },
      { key: "communityLanguage", value: communityLanguage },
      { key: "skillAssessingAuthority", value: skillAssessingAuthority },
      { key: "educationQualification", value: educationQualification },
      { key: "anzsco", value: anzsco },
      { key: "overseasWorkExperience", value: overseasWorkExperience, mustNotBeNull: true },
      { key: "maritalStatus", value: maritalStatus },
      { key: "currentCompanyName", value: currentCompanyName },
      { key: "currentDesignation", value: currentDesignation },
      { key: "australianWorkExperience", value: australianWorkExperience, mustNotBeNull: true },
      { key: "australianStudy", value: australianStudy, mustNotBeNull: true },
      { key: "country", value: country },
      { key: "nationality", value: nationality },
      { key: "leadOwner", value: leadOwner },
    ];

    const missingFields = requiredFields.filter(field => {
      if (field.mustNotBeNull) {
        return field.value === null || field.value === undefined;
      }
      return !field.value;
    });

    if (missingFields.length > 0) {
      const missingFieldNames = missingFields.map(field => field.key).join(", ");
      return res.status(400).json({
        error: "Missing required fields",
        missingFields: missingFieldNames,
        message: `The following fields are required: ${missingFieldNames}`
      });
    }

    // Create profile object
    const profile = {
      name,
      dob,
      englishLanguage,
      communityLanguage,
      skillAssessingAuthority,
      educationQualification,
      anzsco,
      overseasWorkExperience,
      maritalStatus,
      currentCompanyName,
      currentDesignation,
      australianWorkExperience,
      australianStudy,
      country,
      nationality,
      leadOwner,
      spouseAge,
      spouseEnglishLanguage,
      spouseEligibleForAssessment,
    };

    // Generate technical assessment using seed
    const result = await openaiService.generateTechnicalAssessmentWithSeed(
      profile,
      "Information unavailable",
      "Information unavailable"
    );

    if (result.success) {
      // create pdf from data and stream as response
      const pdfBuffer = await createPDFWithName(name, result.data);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="technical-assessment-${name || 'candidate'}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.send(pdfBuffer);
    } else {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: result.message
      });
    }

  } catch (error) {
    console.error("Error in technicalAssessmentWithSeedHandler:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Internal server error"
    });
  }
};

module.exports = {
  technicalAssessmentHandler,
  technicalAssessmentHandlerNew,
  technicalAssessmentWithSeedHandler
};


