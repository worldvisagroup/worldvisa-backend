const { validateRequiredFields } = require("../utils/helperFunction");
const ZohoBooksItem = require('../models/zohoBooksItems');

// GET /api/zoho-books-items
// Returns paginated list of ZohoBooksItems
const getAllZohoBooksItems = async (req, res) => {
  try {
    // Parse pagination params, or use defaults
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    // Optionally handle filters for country and service
    const { country, service } = req.query;

    const filter = {};
    if (country) {
      filter.country = country;
    }
    if (service) {
      filter.service = service;
    }

    const [items, total] = await Promise.all([
      ZohoBooksItem.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ZohoBooksItem.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.toString() });
  }
};

// GET /api/zoho-books-items/:id
// Returns a single ZohoBooksItem by its MongoDB _id
const getZohoBooksItemById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== "string" || id.length !== 24) {
      return res.status(400).json({ success: false, message: "Invalid or missing ZohoBooksItem ID" });
    }
    const item = await ZohoBooksItem.findById(id).lean();
    if (!item) {
      return res.status(404).json({ success: false, message: "ZohoBooksItem not found" });
    }
    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.toString() });
  }
};


// Creates a new ZohoBooksItem
const createZohoBooksItem = async (req, res) => {
  try {
    const { itemName, itemDescription, itemId, amount, country, service, addOn } = req.body;

    // Validate each required field
    const requiredFields = [
      { key: 'itemName', label: "Field 'itemName' is required" },
      { key: 'itemDescription', label: "Field 'itemDescription' is required" },
      { key: 'itemId', label: "Field 'itemId' is required" },
      { key: 'amount', label: "Field 'amount' is required" },
      { key: 'country', label: "Field 'country' is required" },
      { key: 'service', label: "Field 'service' is required" }
    ];

    const { validated, errorMessage } = validateRequiredFields(requiredFields, req.body);

    if (!validated) {
      return res.status(400).json({ success: false, message: errorMessage });
    }

    // Check duplicate itemId
    const existing = await ZohoBooksItem.findOne({ itemId });
    if (existing) {
      return res.status(409).json({ success: false, message: 'ZohoBooksItem with this itemId already exists' });
    }

    const zohoBooksItem = await ZohoBooksItem.create({
      itemName,
      itemDescription,
      itemId,
      amount,
      country,
      service,
      addOn: typeof addOn === 'boolean' ? addOn : false
    });

    res.status(201).json({
      success: true,
      data: zohoBooksItem
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.toString() });
  }
};

const updateZohoBooksItem = async (req, res) => {
  try {
    const zohoBooksItemId = req.params.id;

    if (!zohoBooksItemId) {
      return res.status(400).json({ success: false, message: "Missing ZohoBooksItem ID in request parameters" });
    }

    const allowedUpdates = ['itemName', 'itemDescription', 'itemId', 'amount', 'country', 'service', 'addOn'];
    const updatedFields = {};

    // Only extract provided fields
    for (const field of allowedUpdates) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updatedFields[field] = req.body[field];
      }
    }

    // Validate that at least one field is being updated
    if (Object.keys(updatedFields).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields provided for update." });
    }

    // Check for duplicates if updating itemId
    if ('itemId' in updatedFields) {
      const existing = await ZohoBooksItem.findOne({ itemId: updatedFields.itemId });
      if (existing && existing._id.toString() !== zohoBooksItemId) {
        return res.status(409).json({ success: false, message: 'ZohoBooksItem with this itemId already exists' });
      }
    }

    const updatedItem = await ZohoBooksItem.findByIdAndUpdate(zohoBooksItemId, updatedFields, { new: true, runValidators: true });

    if (!updatedItem) {
      return res.status(404).json({ success: false, message: "ZohoBooksItem not found" });
    }

    res.status(200).json({ success: true, data: updatedItem });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.toString() });
  }
};

const updateZohoBooksByItemId = async (req, res) => {
  try {
    const itemId = req.params.itemId;

    if (!itemId) {
      return res.status(400).json({ success: false, message: "Missing item ID in request parameters" });
    }

    const allowedUpdates = ['itemName', 'itemDescription', 'amount', 'country', 'service', 'addOn'];
    const updatedFields = {};

    // Only extract provided fields
    for (const field of allowedUpdates) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updatedFields[field] = req.body[field];
      }
    }

    // Validate that at least one field is being updated
    if (Object.keys(updatedFields).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields provided for update." });
    }

    const updatedItem = await ZohoBooksItem.findOneAndUpdate({ itemId: itemId }, updatedFields, { new: true, runValidators: true });

    if (!updatedItem) {
      return res.status(404).json({ success: false, message: "ZohoBooksItem not found" });
    }

    res.status(200).json({ success: true, data: updatedItem });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.toString() });
  }
};


const deleteZohoBooksItemById = async (req, res) => {
  try {
    const zohoBooksItemId = req.params.id;

    if (!zohoBooksItemId) {
      return res.status(400).json({ success: false, message: "Missing ZohoBooksItem ID in request parameters" });
    }

    const deletedItem = await ZohoBooksItem.findByIdAndDelete(zohoBooksItemId);

    if (!deletedItem) {
      return res.status(404).json({ success: false, message: "ZohoBooksItem not found" });
    }

    res.status(200).json({ success: true, message: "ZohoBooksItem deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.toString() });
  }
};

const allItemsJson = require("../factories/zohoBooksPackagesItems.json");


const bulkImportZohoBooksItems = async (req, res) => {
  try {
    const results = [];
    for (const item of allItemsJson) {
      const createdItem = await ZohoBooksItem.create(item);
      results.push(createdItem);
    }

    return res.status(201).json({ success: true, message: 'Bulk Import Success', data: results });
  } catch (error) {
    console.error('Bulk Import Error:', error);
    return res.status(500).json({ success: false, message: 'Bulk Import Error', error: error.toString() });
  }
};

const deleteAllZohoBooksItems = async (req, res) => {
  try {
    const result = await ZohoBooksItem.deleteMany({});
    res.status(200).json({ success: true, message: "All ZohoBooksItems deleted successfully", count: result.deletedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.toString() });
  }
};




module.exports = {
  getAllZohoBooksItems,
  createZohoBooksItem,
  updateZohoBooksItem,
  updateZohoBooksByItemId,
  getZohoBooksItemById,
  deleteZohoBooksItemById,
  bulkImportZohoBooksItems,
  deleteAllZohoBooksItems
};
