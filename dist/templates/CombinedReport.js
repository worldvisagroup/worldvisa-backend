"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CombinedReport = CombinedReport;
const react_1 = __importDefault(require("react"));
const styles_1 = require("./shared/styles");
const CoverPage_1 = require("./shared/CoverPage");
const TableOfContents_1 = require("./shared/TableOfContents");
const CountryIntroPage_1 = require("./shared/CountryIntroPage");
const ThankYouPage_1 = require("./shared/ThankYouPage");
const country_registry_1 = require("./utils/country-registry");
const toc_generator_1 = require("./utils/toc-generator");
function CombinedReport({ countries, reportData, userName }) {
    // Get configurations for selected countries
    const countryConfigs = (0, country_registry_1.getCountriesConfig)(countries);
    // Validate we have valid countries
    if (countryConfigs.length === 0) {
        return (react_1.default.createElement("html", { lang: "en" },
            react_1.default.createElement("head", null,
                react_1.default.createElement("meta", { charSet: "utf-8" }),
                react_1.default.createElement("title", null, "Error - No Valid Countries")),
            react_1.default.createElement("body", null,
                react_1.default.createElement("div", { style: { padding: '40pt', textAlign: 'center' } },
                    react_1.default.createElement("h1", null, "Error: No valid countries selected"),
                    react_1.default.createElement("p", null,
                        "Selected: ",
                        countries.join(', '))))));
    }
    // Generate dynamic TOC
    const tocSections = (0, toc_generator_1.generateCombinedTOC)(countryConfigs);
    // Get first country's data for cover/thank you (or use first available)
    const firstCountryData = reportData[countryConfigs[0]?.dataKey];
    return (react_1.default.createElement("html", { lang: "en" },
        react_1.default.createElement("head", null,
            react_1.default.createElement("meta", { charSet: "utf-8" }),
            react_1.default.createElement("title", null,
                "WorldVisa Multi-Country Report - ",
                userName),
            react_1.default.createElement("style", { dangerouslySetInnerHTML: { __html: styles_1.pdfStyles } })),
        react_1.default.createElement("body", null,
            react_1.default.createElement(CoverPage_1.CoverPage, { data: firstCountryData?.coverPage || { title: 'Global Immigration Report', subtitle: 'Multi-Country Assessment' }, meta: {
                    userName,
                    generatedDate: new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }),
                    reportVersion: '2.0',
                    country: countryConfigs.map(c => c.name).join(' & ')
                }, countries: countryConfigs.map(c => c.name) }),
            react_1.default.createElement(TableOfContents_1.TableOfContents, { sections: tocSections, countries: countryConfigs.map(c => c.name) }),
            react_1.default.createElement("div", { className: "page-break" }),
            countryConfigs.map((countryConfig, countryIndex) => {
                const countryData = reportData[countryConfig.dataKey];
                if (!countryData) {
                    // Skip if no data for this country
                    console.warn(`No data found for country: ${countryConfig.name}`);
                    return null;
                }
                return (react_1.default.createElement(react_1.default.Fragment, { key: countryConfig.code },
                    react_1.default.createElement(CountryIntroPage_1.CountryIntroPage, { countryName: countryConfig.name, flagImagePath: countryConfig.flagPath, usps: countryConfig.usps, colors: countryConfig.colors }),
                    react_1.default.createElement("div", { className: "page-break" }),
                    react_1.default.createElement("div", null, countryConfig.sections.map((section, sectionIndex) => {
                        const SectionComponent = section.component;
                        const sectionData = countryData[section.dataKey];
                        // Render component with data if available (dynamic sections),
                        // or without data prop if static (static sections like AboutWorldVisa, Timeline)
                        return (react_1.default.createElement(react_1.default.Fragment, { key: `${countryConfig.code}-${section.id}` },
                            sectionData ? (react_1.default.createElement(SectionComponent, { data: sectionData })) : (react_1.default.createElement(SectionComponent, null)),
                            sectionIndex < countryConfig.sections.length - 1 && (react_1.default.createElement("div", null))));
                    })),
                    countryIndex < countryConfigs.length - 1 && (react_1.default.createElement("div", { className: "page-break" }))));
            }),
            react_1.default.createElement("div", { className: "page-break" }),
            react_1.default.createElement(ThankYouPage_1.ThankYouPage, null))));
}
