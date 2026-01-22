const Packages = require("../models/packages");
const ZohoBooksItem = require("../models/zohoBooksItems");
const { validateRequiredFields } = require("../utils/helperFunction");
const allBulkPackagesData = require('../factories/allPackages.json');

/**
 * List all packages with pagination.
 * Populates tiers and addOns
 */
const getAllPackages = async (req, res) => {
  try {
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 10;
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const skip = (page - 1) * limit;
    const { type, country } = req.query;

    const query = {};
    if (type) {
      query.type = { $in: type.split(',') };
    }
    if (country) {
      query.country = country;
    }

    const [packages, total] = await Promise.all([
      Packages.find(query)
        .skip(skip)
        .limit(limit)
        .select('slug title country shortDescription type') // Select only the required fields
        .populate('tiers').populate('addOns'), // Populate tiers
      Packages.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      data: packages,
      pagination: { total, page, limit, totalPages }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch packages", details: err.message });
  }
};

const searchPackagesByQuery = async (req, res) => {
  try {
    const { searchTerm } = req.query;

    if (!searchTerm) {
      return res.status(400).json({ error: "Missing `searchTerm` in query parameters" });
    }

    const packages = await Packages.find({
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { subtitle: { $regex: searchTerm, $options: 'i' } },
      ]
    })
      .select('slug title country shortDescription type') // Select only the required fields

    if (packages.length === 0) {
      return res.status(404).json({ error: "No packages found matching the search term" });
    }

    res.status(200).json({ data: packages });
  } catch (err) {
    res.status(500).json({ error: "Failed to search packages", details: err.message });
  }
};


/**
 * Get a package by ID.
 * Populates tiers and addOns
 */
const getPackageById = async (req, res) => {
  try {
    const packageId = req.params.id;

    if (!packageId) {
      return res.status(400).json({ error: "Missing package ID in request parameters" });
    }

    const foundPackage = await Packages.findById(packageId)
      .populate('tiers')
      .populate('addOns');

    if (!foundPackage) {
      return res.status(404).json({ error: "Package not found" });
    }

    res.status(200).json({ data: foundPackage });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve package", details: err.message });
  }
};

/**
 * Get a package by slug.
 * Populates tiers and addOns
 */
const getPackageBySlug = async (req, res) => {
  try {
    const packageSlug = req.params.slug;

    if (!packageSlug) {
      return res.status(400).json({ error: "Missing package slug in request parameters" });
    }

    const foundPackage = await Packages.findOne({ slug: packageSlug })
      .populate('tiers')
      .populate('addOns');

    if (!foundPackage) {
      return res.status(404).json({ error: "Package not found" });
    }

    res.status(200).json({ data: foundPackage });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve package", details: err.message });
  }
};


/**
 * Create a new package according to the updated schema.
 * The updated schema includes: country, title, subtitle (optional),
 * tags (required, array), shortDescription (optional),
 * longDescription (optional), type (enum, required),
 * tiers (required), addOns (required, array)
 */
const createPackage = async (req, res) => {
  try {
    // Extract fields according to the updated schema
    const {
      country,
      title,
      slug,
      subtitle,
      tags,
      shortDescription,
      longDescription,
      type,
      tiers,
      addOns,
      benefits = [],
      validity
    } = req.body;

    // Validate required fields per model
    const requiredFields = [
      { key: 'country', label: "Field 'country' is required" },
      { key: 'title', label: "Field 'title' is required" },
      { key: 'slug', label: "Field 'slug' is required" },
      { key: 'tags', label: "Field 'tags' is required and should not be empty" },
      { key: 'type', label: "Field 'type' is required" },
      { key: 'tiers', label: "Field 'tiers' is required and should be an array of valid zohoBooksItemIds" },
      { key: 'addOns', label: "Field 'addOns' is required and should be an array of valid zohoBooksItemIds" }
    ];
    const { validated, errorMessage } = validateRequiredFields(requiredFields, req.body);

    if (!validated) {
      return res.status(400).json({ error: errorMessage });
    }

    // Validate tiers structure
    if (
      !Array.isArray(tiers) ||
      tiers.length === 0 ||
      !tiers.every(tier => typeof tier === 'string' && tier.length === 24)
    ) {
      return res.status(400).json({
        error: "Invalid 'tiers' structure. Each tier must be a valid zohoBooksItemId (24-char ObjectId string)."
      });
    }

    // Validate addOns if present
    let normalizedAddOns = [];
    if (addOns && Array.isArray(addOns)) {
      if (!addOns.every(addOn => typeof addOn === 'string' && addOn.length === 24)) {
        return res.status(400).json({
          error: "Invalid 'addOns' structure. Each add-on must be a valid zohoBooksItemId (24-char ObjectId string)."
        });
      }
      normalizedAddOns = addOns;
    }

    if (validity) {
      if (
        !validity.hasOwnProperty('entryType') ||
        !validity.hasOwnProperty('lengthOfStay') ||
        !validity.hasOwnProperty('period')
      ) {
        return res.status(400).json({
          error: "Invalid 'validity' structure. It must include fields: entryType, lengthOfStay, and period."
        });
      }
    }

    // Build package object per schema, keeping undefined for optional fields
    const packageObj = {
      country,
      title,
      slug,
      subtitle,
      tags,
      shortDescription,
      longDescription,
      type,
      tiers,
      addOns: normalizedAddOns,
      benefits,
      validity: validity ? validity : null
    };

    const newPackage = new Packages(packageObj);
    const savedPackage = await newPackage.save();

    // Populate for response
    await savedPackage.populate('tiers');
    await savedPackage.populate('addOns');

    res.status(201).json({ message: "Package created successfully", data: savedPackage });
  } catch (err) {
    res.status(500).json({ error: "Failed to create package", details: err.message });
  }
};

/**
 * Update a package by ID according to the updated schema.
 * Handles all modifiable fields in the schema.
 */
const updatePackageById = async (req, res) => {
  try {
    const packageId = req.params.id;
    const allowedFields = [
      "country", "title", "slug", "subtitle", "tags", "shortDescription", "longDescription",
      "type", "tiers", "addOns", "validity", "benefits"
    ];
    const updatedFields = {};

    // Only extract provided fields
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updatedFields[field] = req.body[field] === null && (field === 'validity' || field === 'benefits') ? null : req.body[field];
      }
    }

    if (Object.keys(updatedFields).length === 0) {
      return res.status(400).json({
        error: "No valid fields provided for update.",
        validFields: allowedFields
      });
    }

    // Required fields validation for update
    const requiredFieldsForUpdate = [];
    if ('country' in updatedFields)
      requiredFieldsForUpdate.push({ key: 'country', label: "Field 'country' is required" });
    if ('title' in updatedFields)
      requiredFieldsForUpdate.push({ key: 'title', label: "Field 'title' is required" });
    if ('slug' in updatedFields)
      requiredFieldsForUpdate.push({ key: 'slug', label: "Field 'slug' is required" });
    if ('tags' in updatedFields)
      requiredFieldsForUpdate.push({ key: 'tags', label: "Field 'tags' is required and should not be empty" });
    if ('type' in updatedFields)
      requiredFieldsForUpdate.push({ key: 'type', label: "Field 'type' is required" });
    if ('tiers' in updatedFields)
      requiredFieldsForUpdate.push({ key: 'tiers', label: "Field 'tiers' is required and should be an array of valid zohoBooksItemIds" });
    if ('addOns' in updatedFields)
      requiredFieldsForUpdate.push({ key: 'addOns', label: "Field 'addOns' is required and should be an array of valid zohoBooksItemIds" });

    if (requiredFieldsForUpdate.length > 0) {
      const { validated, errorMessage } = validateRequiredFields(requiredFieldsForUpdate, updatedFields);
      if (!validated) {
        return res.status(400).json({ error: errorMessage });
      }
    }

    // If updating tiers, validate structure
    if ('tiers' in updatedFields) {
      const tiers = updatedFields.tiers;
      if (
        !Array.isArray(tiers) ||
        tiers.length === 0 ||
        !tiers.every(tier => typeof tier === 'string' && tier.length === 24)
      ) {
        return res.status(400).json({
          error: "Invalid 'tiers' structure. Each tier must be a valid zohoBooksItemId (24-char ObjectId string)."
        });
      }
      updatedFields.tiers = tiers;
    }

    // If updating addOns, validate structure
    if ('addOns' in updatedFields) {
      const addOns = updatedFields.addOns;
      if (addOns && Array.isArray(addOns)) {
        if (!addOns.every(addOn => typeof addOn === 'string' && addOn.length === 24)) {
          return res.status(400).json({
            error: "Invalid 'addOns' structure. Each add-on must be a valid zohoBooksItemId (24-char ObjectId string)."
          });
        }
        updatedFields.addOns = addOns;
      }
    }

    // If updating validity, validate structure
    if ('validity' in updatedFields && updatedFields.validity !== null) {
      const { validity } = updatedFields;
      if (
        typeof validity.period !== 'string' ||
        typeof validity.entryType !== 'string' ||
        validity.entryType.length === 0 ||
        (validity.lengthOfStay && typeof validity.lengthOfStay !== 'string')
      ) {
        return res.status(400).json({
          error: "Invalid 'validity' structure. It must include: period (string), entryType (non-empty string), and optional lengthOfStay (string)."
        });
      }
    }

    // If updating benefits, validate structure
    if ('benefits' in updatedFields && updatedFields.benefits !== null) {
      const benefits = updatedFields.benefits;
      if (!Array.isArray(benefits)) {
        return res.status(400).json({
          error: "Invalid 'benefits' structure. It must be an array of strings."
        });
      }
      updatedFields.benefits = benefits;
    }

    const updatedPackage = await Packages.findByIdAndUpdate(
      packageId,
      updatedFields,
      { new: true, runValidators: true }
    )
      .populate('tiers')
      .populate('addOns');

    if (!updatedPackage) {
      return res.status(404).json({ error: "Package not found" });
    }

    res.status(200).json({ message: "Package updated successfully", data: updatedPackage });
  } catch (err) {
    res.status(500).json({ error: "Failed to update package", details: err.message });
  }
};

/**
 * Delete a package by its ID.
 */
const deletePackageById = async (req, res) => {
  try {
    const packageId = req.params.id;
    if (!packageId) {
      return res.status(400).json({ error: "Package ID is required" });
    }

    const deletedPackage = await Packages.findByIdAndDelete(packageId);

    if (!deletedPackage) {
      return res.status(404).json({ error: "Package not found" });
    }

    res.status(200).json({ message: "Package deleted successfully", data: deletedPackage });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete package", details: err.message });
  }
};

/**
 * Constructs a package URL based on the provided itemId and the
 * current query parameters.
 */
const getPackageUrl = async (req, res) => {
  const itemId = req.params.itemId;
  const baseUrl = process.env.WORLDVISA_FRONTEND_URL;

  if (!itemId) {
    return res.status(400).json({ error: "Missing item ID in request parameters" });
  }

  try {
    const foundItem = await ZohoBooksItem.findOne({ itemId });

    if (!foundItem) {
      return res.status(404).json({ error: "Item not found with the given item ID" });
    }

    const foundPackage = await Packages.findOne({ tiers: foundItem._id }).populate('tiers');

    if (!foundPackage) {
      return res.status(404).json({ error: "Package not found with the given item ID in tiers" });
    }

    const { slug, country } = foundPackage;

    if (!slug) {
      return res.status(404).json({ error: "Slug not found for the package" });
    }

    if (!country) {
      return res.status(400).json({ error: "Country is required in the search params" });
    }

    const queryString = req.query ? new URLSearchParams(req.query).toString() : '';
    const packageUrl = `${baseUrl}/packages/${country}/${slug}/checkout${queryString ? `?${queryString}` : ''}`;

    return res.status(200).json({ url: packageUrl });
  } catch (err) {
    res.status(500).json({ error: "Failed to construct package URL", details: err.message });
  }
};

const addBulkPackages = async (req, res) => {
  try {
    const bulkPackages = allBulkPackagesData.map(async (packageData) => {
      const newPackage = new Packages(packageData);
      await newPackage.save();
    });

    await Promise.all(bulkPackages);
    res.status(201).json({ message: "Bulk packages added successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to add bulk packages", details: err.message });
  }
};

const deleteAllPackages = async (req, res) => {
  try {
    const result = await Packages.deleteMany({});
    res.status(200).json({ message: `${result.deletedCount} packages deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete packages", details: err.message });
  }
};




module.exports = {
  getAllPackages,
  createPackage,
  getPackageById,
  getPackageBySlug,
  updatePackageById,
  deletePackageById,
  getPackageUrl,
  addBulkPackages,
  deleteAllPackages,
  searchPackagesByQuery
};
