const express = require('express');
const router = express.Router();
const { getAllPackages, createPackage, getPackageById, updatePackageById, deletePackageById, getPackageBySlug, getPackageUrl, addBulkPackages, deleteAllPackages, searchPackagesByQuery, updatePackageByItemId } = require('../controllers/packagesController');
const { getAllZohoBooksItems, createZohoBooksItem, getZohoBooksItemById, deleteZohoBooksItemById, updateZohoBooksItem, bulkImportZohoBooksItems, deleteAllZohoBooksItems, updateZohoBooksByItemId } = require('../controllers/zohoBooksItems');

// Zoho books items
router.get('/items', getAllZohoBooksItems);

router.get('/items/bulk-items', bulkImportZohoBooksItems);

router.get('/items/:id', getZohoBooksItemById);

router.put("/items/update-by-item-id/:itemId", updateZohoBooksByItemId);

router.put('/items/:id', updateZohoBooksItem);

router.post('/items', createZohoBooksItem);

router.delete('/items', deleteAllZohoBooksItems);

router.delete('/items/:id', deleteZohoBooksItemById);



// Packages
router.get('/', getAllPackages);

router.get('/package-url/:itemId', getPackageUrl);

router.get('/packages-bulk', addBulkPackages);

router.get('/search', searchPackagesByQuery)

router.get('/:slug', getPackageBySlug);

router.put('/:id', updatePackageById);

router.post('/', createPackage);

router.delete('/:id', deletePackageById);

router.delete('/', deleteAllPackages);

module.exports = router;
