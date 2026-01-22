const { escapeString } = require('./querySanitizer');


/**
 * Query builder for COQL (Zoho CRM Query Language) queries
 * Provides a fluent interface for building safe, parameterized queries
 * Automatically escapes values to prevent injection attacks
 * 
 * @example
 * const builder = new CoqlQueryBuilder('Visa_Applications');
 * builder.select(['Name', 'Email'])
 *   .where('Application_State', '=', 'Active')
 *   .whereIn('Application_Stage', ['Stage 1', 'Stage 2'])
 *   .dateRange('Created_Time', '2024-01-01', '2024-12-31')
 *   .orderBy('Created_Time', 'desc')
 *   .paginate(1, 10);
 * const query = builder.build();
 */
class CoqlQueryBuilder {
  /**
   * Create a new COQL query builder instance
   * 
   * @param {string} tableName - Name of the Zoho CRM module/table
   */
  constructor(tableName) {
    this.tableName = tableName;
    this.selectFields = [];
    this.whereConditions = [];
    this.orderByField = null;
    this.orderByDirection = 'desc';
    this.limitValue = null;
    this.offsetValue = null;
  }


  /**
   * Set the fields to select in the query
   * 
   * @param {string|Array<string>} fields - Field name(s) to select
   * @returns {CoqlQueryBuilder} - Returns self for method chaining
   */
  select(fields) {
    this.selectFields = Array.isArray(fields) ? fields : [fields];
    return this;
  }


  /**
   * Add a WHERE condition to the query
   * Supports: =, !=, >, <, >=, <=, like, in
   * Values are automatically escaped for safety
   * 
   * @param {string} field - Field name to filter on
   * @param {string} operator - Comparison operator (=, !=, >, <, >=, <=, like, in)
   * @param {*} value - Value to compare (will be escaped)
   * @returns {CoqlQueryBuilder} - Returns self for method chaining
   */
  where(field, operator, value) {
    if (!field || !operator || value === undefined || value === null) {
      return this;
    }

    const escapedValue = Array.isArray(value)
      ? value.map(v => `'${escapeString(String(v))}'`).join(', ')
      : `'${escapeString(String(value))}'`;

    let condition = '';
    switch (operator.toLowerCase()) {
      case '=':
      case '!=':
      case '>':
      case '<':
      case '>=':
      case '<=':
        condition = `${field} ${operator} ${escapedValue}`;
        break;
      case 'like':
        condition = `${field} like '${escapeString(String(value))}'`;
        break;
      case 'in':
        if (Array.isArray(value)) {
          condition = `${field} in (${escapedValue})`;
        } else {
          condition = `${field} in (${escapedValue})`;
        }
        break;
      default:
        return this;
    }

    this.whereConditions.push(condition);
    return this;
  }


  /**
   * Add a WHERE IN condition for multiple values
   * 
   * @param {string} field - Field name to filter on
   * @param {Array} values - Array of values to match (will be escaped)
   * @returns {CoqlQueryBuilder} - Returns self for method chaining
   */
  whereIn(field, values) {
    if (!field || !Array.isArray(values) || values.length === 0) {
      return this;
    }

    const escapedValues = values.map(v => `'${escapeString(String(v))}'`).join(', ');
    this.whereConditions.push(`${field} in (${escapedValues})`);
    return this;
  }


  /**
   * Add a raw WHERE condition (use with caution - no escaping applied)
   * Only use when you need complex conditions not supported by other methods
   * 
   * @param {string} condition - Raw SQL condition string
   * @returns {CoqlQueryBuilder} - Returns self for method chaining
   */
  whereRaw(condition) {
    if (condition && typeof condition === 'string') {
      this.whereConditions.push(condition);
    }
    return this;
  }


  /**
   * Add a date range filter (inclusive)
   * Automatically formats dates with time components for Zoho CRM
   * 
   * @param {string} field - Date field name
   * @param {string} startDate - Start date (YYYY-MM-DD), optional
   * @param {string} endDate - End date (YYYY-MM-DD), optional
   * @returns {CoqlQueryBuilder} - Returns self for method chaining
   */
  dateRange(field, startDate, endDate) {
    if (startDate && endDate) {
      const startStr = `${startDate}T00:00:00+00:00`;
      const endStr = `${endDate}T23:59:59+00:00`;
      this.whereConditions.push(`(${field} >= '${startStr}' and ${field} <= '${endStr}')`);
    } else if (startDate) {
      const startStr = `${startDate}T00:00:00+00:00`;
      this.whereConditions.push(`(${field} >= '${startStr}')`);
    } else if (endDate) {
      const endStr = `${endDate}T23:59:59+00:00`;
      this.whereConditions.push(`${field} <= '${endStr}'`);
    }
    return this;
  }


  /**
   * Set the ORDER BY clause
   * 
   * @param {string} field - Field name to sort by
   * @param {string} direction - Sort direction ('asc' or 'desc', default: 'desc')
   * @returns {CoqlQueryBuilder} - Returns self for method chaining
   */
  orderBy(field, direction = 'desc') {
    this.orderByField = field;
    this.orderByDirection = direction.toLowerCase() === 'asc' ? 'asc' : 'desc';
    return this;
  }


  /**
   * Set pagination parameters (LIMIT and OFFSET)
   * 
   * @param {number} page - Page number (1-indexed)
   * @param {number} limit - Number of records per page
   * @returns {CoqlQueryBuilder} - Returns self for method chaining
   */
  paginate(page, limit) {
    if (page && limit) {
      this.offsetValue = (page - 1) * limit;
      this.limitValue = limit;
    }
    return this;
  }

  /**
   * Build the final COQL SELECT query string
   * 
   * @returns {string} - Complete COQL query string
   */
  build() {
    let query = 'select ';

    // SELECT fields
    if (this.selectFields.length > 0) {
      query += this.selectFields.join(', ');
    } else {
      query += '*';
    }

    // FROM table
    query += ` from ${this.tableName}`;

    // WHERE clause
    if (this.whereConditions.length > 0) {
      query += ` where ${this.whereConditions.join(' and ')}`;
    }

    // ORDER BY
    if (this.orderByField) {
      query += ` order by ${this.orderByField} ${this.orderByDirection}`;
    }

    // LIMIT and OFFSET
    if (this.limitValue !== null) {
      query += ` limit ${this.limitValue}`;
      if (this.offsetValue !== null) {
        query += ` offset ${this.offsetValue}`;
      }
    }

    return query;
  }

  /**
   * Build a COUNT query using the same WHERE conditions
   * Returns query in format: SELECT COUNT(id) as total FROM table WHERE ...
   * 
   * @returns {string} - COQL COUNT query string
   */
  buildCountQuery() {
    let query = `select COUNT(id) as total from ${this.tableName}`;

    // WHERE clause (same as main query)
    if (this.whereConditions.length > 0) {
      query += ` where ${this.whereConditions.join(' and ')}`;
    }

    return query;
  }
}

module.exports = CoqlQueryBuilder;
