const express = require("express");
const { validateRequiredFields } = require("../utils/helperFunction");
const openaiService = require('../services/openaiService');

const getTravelBudget = async (req, res) => {
  const { name, country, travelers, numberOfDays, accommodationType, mealsPerDay, activities, travelSeason, budgetCategory } = req.body;

  // New validation for budget categories
  const validBudgetCategories = ['luxury', 'average', 'budget', 'economy'];

  if (!validBudgetCategories.includes(budgetCategory)) {
    return res.status(400).json({ error: `Field 'budgetCategory' must be one of: ${validBudgetCategories.join(', ')}` });
  }

  // Validate required fields using the helper function
  const requiredFields = [
    { key: 'name', label: "Field 'name' is required" },
    { key: 'country', label: "Field 'country' is required" },
    { key: 'travelers', label: "Field 'travelers' is required" },
    { key: 'numberOfDays', label: "Field 'numberOfDays' is required" },
    { key: 'accommodationType', label: "Field 'accommodationType' is required" },
    { key: 'mealsPerDay', label: "Field 'mealsPerDay' is required" },
    { key: 'activities', label: "Field 'activities' is required" },
    { key: 'travelSeason', label: "Field 'travelSeason' is required" },
  ];

  const profile = {
    name,
    country,
    budgetCategory,
    numberOfDays,
    travelers,
    modeOfTravel: "flight",
    accommodationType,
    mealsPerDay,
    activities,
    travelSeason
  };

  const { validated, errorMessage } = validateRequiredFields(requiredFields, req.body);

  if (!Array.isArray(activities) || activities.length === 0) {
    return res.status(400).json({ error: "Field 'activities' is required and should not be empty" });
  }

  // Validate travelers object
  if (typeof travelers !== 'object' || travelers === null) {
    return res.status(400).json({ error: "Field 'travelers' must be an object" });
  }

  const validTravelerKeys = new Set(['adult', 'children', 'infant']);
  for (const key of Object.keys(travelers)) {
    if (!validTravelerKeys.has(key)) {
      return res.status(400).json({ error: `Traveler key '${key}' is not recognized` });
    }
    if (typeof travelers[key] !== 'number' || travelers[key] < 0) {
      return res.status(400).json({ error: `Traveler key '${key}' must be a non-negative number` });
    }
  }

  if (!validated) {
    return res.status(400).json({ error: errorMessage });
  }

  try {
    const aiTravelBudgetResponse = await openaiService.generateTravelBudget(profile);
    return res.status(200).json({ success: true, data: aiTravelBudgetResponse });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }


};

module.exports = { getTravelBudget };

