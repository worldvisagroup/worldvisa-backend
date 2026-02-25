const mongoose = require('mongoose');
const Packages = require("../models/packages");
const ZohoBooksItem = require("../models/zohoBooksItems");
const { validateRequiredFields } = require("../utils/helperFunction");
const allBulkPackagesData = require('../factories/allPackages.json');

const VISA_TYPES = ['pr', 'tourist', 'work', 'study'];
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isValidObjectId(id) {
  return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);
}

const listPackages = async (req, res) => {
  try {
    const {
      page: pageParam,
      limit: limitParam,
      search,
      q,
      searchTerm,
      country: countryParam,
      type: typeParam,
      visaType: visaTypeParam,
      addOn: addOnParam,
      addOns: addOnsParam,
      hasAddOn: hasAddOnParam
    } = req.query;

    let page = parseInt(pageParam, 10) || 1;
    let limit = parseInt(limitParam, 10) || DEFAULT_LIMIT;
    if (page < 1) page = 1;
    if (limit < 1) limit = DEFAULT_LIMIT;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    const searchTermValue = search || q || searchTerm;
    const typeValue = typeParam || visaTypeParam;
    const addOnValue = addOnsParam || addOnParam;

    const query = {};

    if (searchTermValue && typeof searchTermValue === 'string' && searchTermValue.trim()) {
      const escaped = escapeRegex(searchTermValue.trim());
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: escaped, $options: 'i' } },
          { subtitle: { $regex: escaped, $options: 'i' } }
        ]
      });
    }

    if (countryParam && typeof countryParam === 'string') {
      const countries = countryParam.split(',').map(c => c.trim()).filter(Boolean);
      if (countries.length === 1) {
        query.country = countries[0];
      } else if (countries.length > 1) {
        query.country = { $in: countries };
      }
    }

    if (typeValue && typeof typeValue === 'string') {
      const types = typeValue.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      const invalid = types.filter(t => !VISA_TYPES.includes(t));
      if (invalid.length > 0) {
        return res.status(400).json({
          error: 'Invalid visa type(s). Allowed: pr, tourist, work, study',
          invalid
        });
      }
      if (types.length > 0) {
        query.type = { $in: types };
      }
    }

    if (addOnValue && typeof addOnValue === 'string') {
      const ids = addOnValue.split(',').map(id => id.trim()).filter(Boolean);
      const invalidIds = ids.filter(id => !isValidObjectId(id));
      if (invalidIds.length > 0) {
        return res.status(400).json({
          error: 'Invalid addOn/addOns: each value must be a 24-character hex ObjectId',
          invalid: invalidIds
        });
      }
      if (ids.length > 0) {
        query.addOns = { $in: ids.map(id => new mongoose.Types.ObjectId(id)) };
      }
    }

    if (hasAddOnParam === 'true' || hasAddOnParam === 'false') {
      const addOnTrueIds = await ZohoBooksItem.find({ addOn: true }).distinct('_id');
      if (hasAddOnParam === 'true') {
        query.tiers = addOnTrueIds.length > 0 ? { $in: addOnTrueIds } : { $in: [] };
      } else {
        if (addOnTrueIds.length > 0) {
          query.tiers = { $nin: addOnTrueIds };
        }
      }
    }

    const skip = (page - 1) * limit;

    const [packages, total] = await Promise.all([
      Packages.find(query)
        .skip(skip)
        .limit(limit)
        .select('slug title country shortDescription type')
        .populate('tiers')
        .populate('addOns'),
      Packages.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      data: packages,
      pagination: { total, page, limit, totalPages }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch packages', details: err.message });
  }
};



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



const createPackage = async (req, res) => {
  try {
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

    if (
      !Array.isArray(tiers) ||
      tiers.length === 0 ||
      !tiers.every(tier => typeof tier === 'string' && tier.length === 24)
    ) {
      return res.status(400).json({
        error: "Invalid 'tiers' structure. Each tier must be a valid zohoBooksItemId (24-char ObjectId string)."
      });
    }

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

    await savedPackage.populate('tiers');
    await savedPackage.populate('addOns');

    res.status(201).json({ message: "Package created successfully", data: savedPackage });
  } catch (err) {
    res.status(500).json({ error: "Failed to create package", details: err.message });
  }
};


const updatePackageById = async (req, res) => {
  try {
    const packageId = req.params.id;
    const allowedFields = [
      "country", "title", "slug", "subtitle", "tags", "shortDescription", "longDescription",
      "type", "tiers", "addOns", "validity", "benefits"
    ];
    const updatedFields = {};

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
  listPackages,
  createPackage,
  getPackageById,
  getPackageBySlug,
  updatePackageById,
  deletePackageById,
  getPackageUrl,
  addBulkPackages,
  deleteAllPackages
};
