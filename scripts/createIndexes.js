const mongoose = require('mongoose');
const dmsZohoDocument = require('../models/dmsZohoDocument');
require('dotenv').config();

/**
 * Migration script to create indexes on existing dmsZohoDocument collection
 * Run this script during low-traffic periods
 * 
 * Usage: node scripts/createIndexes.js
 */

async function createIndexes() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_CONNECTION_STRING;
    if (!mongoUri) {
      throw new Error('MONGODB_CONNECTION_STRING environment variable is required');
    }

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');
    console.log('Creating indexes on dmsZohoDocument collection...');
    console.log('This may take a while for large collections. Indexes are created in the background.');

    const collection = mongoose.connection.collection('dmsZohodocuments'); // MongoDB collection name (lowercase, pluralized)

    // Create indexes with background option to avoid blocking operations
    const indexes = [
      // Index on record_id - used in almost every query
      { key: { record_id: 1 }, name: 'record_id_1', background: true },
      
      // Indexes for requested_reviews queries
      { key: { 'requested_reviews.requested_to': 1 }, name: 'requested_reviews.requested_to_1', background: true },
      { key: { 'requested_reviews.requested_by': 1 }, name: 'requested_reviews.requested_by_1', background: true },
      
      // Index on status - used in listDocuments and filtering
      { key: { status: 1 }, name: 'status_1', background: true },
      
      // Text index for document_name and document_category search
      { key: { document_name: 'text', document_category: 'text' }, name: 'document_name_text_document_category_text', background: true },
      
      // Compound index for common query pattern: record_id + status
      { key: { record_id: 1, status: 1 }, name: 'record_id_1_status_1', background: true },
      
      // Compound indexes for review queries with status filtering
      { key: { 'requested_reviews.requested_to': 1, 'requested_reviews.status': 1 }, name: 'requested_reviews.requested_to_1_requested_reviews.status_1', background: true },
      { key: { 'requested_reviews.requested_by': 1, 'requested_reviews.status': 1 }, name: 'requested_reviews.requested_by_1_requested_reviews.status_1', background: true },
    ];

    // Check existing indexes first
    const existingIndexes = await collection.indexes();
    console.log('\nExisting indexes:');
    existingIndexes.forEach(idx => console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`));

    // Create indexes
    console.log('\nCreating new indexes...');
    for (const indexSpec of indexes) {
      try {
        // Check if index already exists
        const indexExists = existingIndexes.some(idx => idx.name === indexSpec.name);
        
        if (indexExists) {
          console.log(`  ✓ Index '${indexSpec.name}' already exists, skipping...`);
        } else {
          await collection.createIndex(indexSpec.key, {
            name: indexSpec.name,
            background: indexSpec.background || true
          });
          console.log(`  ✓ Created index: ${indexSpec.name}`);
        }
      } catch (error) {
        console.error(`  ✗ Failed to create index ${indexSpec.name}:`, error.message);
      }
    }

    // Verify indexes were created
    console.log('\nVerifying indexes...');
    const finalIndexes = await collection.indexes();
    console.log(`Total indexes: ${finalIndexes.length}`);
    finalIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\n✓ Index creation completed!');
    console.log('Note: Background index creation may still be in progress. Monitor your MongoDB logs.');

  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
    process.exit(0);
  }
}

// Run the migration
createIndexes();
