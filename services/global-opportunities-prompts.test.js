const { COUNTRY_SECTIONS } = require('./global-opportunities-prompts');

function sectionSchema(country, key) {
  return COUNTRY_SECTIONS[country].find((section) => section.key === key).schema;
}

describe('Australia topEmployers schema', () => {
  test('nests activelyHiring/sponsorMigrants/etc. under whyTheseCompanies, matching the PDF template shape', () => {
    const schema = sectionSchema('australia', 'topEmployers');

    expect(schema.required).toEqual(expect.arrayContaining(['whyTheseCompanies']));
    expect(schema.properties.whyTheseCompanies.type).toBe('object');
    expect(Object.keys(schema.properties.whyTheseCompanies.properties)).toEqual([
      'activelyHiring',
      'sponsorMigrants',
      'growthTrajectory',
      'yourFit',
      'learningOpportunity',
    ]);
    expect(schema.properties.whyTheseCompanies.required).toEqual(
      expect.arrayContaining(['activelyHiring', 'sponsorMigrants', 'growthTrajectory', 'yourFit', 'learningOpportunity'])
    );
    // The old, broken flat shape must not resurface as top-level siblings.
    expect(schema.properties).not.toHaveProperty('whyActivelyHiring');
  });
});
