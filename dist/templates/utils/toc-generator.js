"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCombinedTOC = generateCombinedTOC;
exports.generateSingleCountryTOC = generateSingleCountryTOC;
exports.groupTOCByCountry = groupTOCByCountry;
function generateCombinedTOC(countryConfigs, startPage = 3) {
    const tocSections = [];
    let currentPage = startPage;
    let sectionCounter = 1;
    countryConfigs.forEach((config, countryIndex) => {
        if (countryIndex > 0) {
            currentPage += 1;
        }
        // Add sections for this country
        config.sections.forEach((section) => {
            tocSections.push({
                section: sectionCounter.toString(),
                title: section.title,
                page: currentPage.toString(),
                country: config.name
            });
            const estimatedPagesForSection = estimateSectionPages(section.title);
            currentPage += estimatedPagesForSection;
            sectionCounter++;
        });
    });
    return tocSections;
}
/**
 * Estimates the number of pages a section will take
 * This is a rough heuristic - can be refined based on actual content analysis
 */
function estimateSectionPages(sectionTitle) {
    // Simple heuristic based on common section lengths
    const pageEstimates = {
        'Executive Summary': 2,
        'Professional Profile': 2,
        'Visa Pathways': 3,
        'Skill Demand': 2,
        'Top Employers': 2,
        'Salary Variation': 2,
        'Timeline': 2,
        'Regulatory Advisor': 2,
        'Move Without Job Offer': 3,
        'Move Without Sponsor': 2,
        'Migration Strategy': 2,
        'About WorldVisa': 1,
    };
    // Try to match section title
    for (const [key, pages] of Object.entries(pageEstimates)) {
        if (sectionTitle.includes(key)) {
            return pages;
        }
    }
    // Default: 2 pages per section
    return 2;
}
/**
 * Generates TOC for a single country (backwards compatibility)
 */
function generateSingleCountryTOC(countryCode, sections, startPage = 3) {
    const tocSections = [];
    let currentPage = startPage;
    sections.forEach((section) => {
        tocSections.push({
            section: section.id,
            title: section.title,
            page: currentPage.toString()
        });
        currentPage += estimateSectionPages(section.title);
    });
    return tocSections;
}
/**
 * Groups TOC sections by country for multi-country reports
 */
function groupTOCByCountry(tocSections) {
    return tocSections.reduce((acc, section) => {
        const country = section.country || 'Unknown';
        if (!acc[country]) {
            acc[country] = [];
        }
        acc[country].push(section);
        return acc;
    }, {});
}
