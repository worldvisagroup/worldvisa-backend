import React from 'react';
import type { ThankYouPageData } from '../types/report-types';

const STATIC_THANK_YOU_DATA: ThankYouPageData = {
  heading: "Your Journey to Global Opportunities Starts Here",
  thankYouMessage: "Congratulations on taking the first step toward your international career! This comprehensive report is designed to empower you with the knowledge and insights needed to make informed decisions about your migration journey. Your future awaits, and we're here to guide you every step of the way.",
  aboutWorldVisa: "WorldVisa is your trusted partner for immigration services, providing expert guidance for skilled professionals seeking opportunities worldwide. With years of experience and a team of MARA-certified advisors, we've helped thousands of clients successfully navigate complex immigration processes.",
  successStats: {
    yearsOfExperience: "21+",
    clientsServed: "150k+",
    successRate: "98%"
  },
  services: [
    "Comprehensive Eligibility Assessment",
    "Expert Skills Assessment Guidance",
    "Strategic Documentation & Case Preparation",
    "End-to-End Application Management",
    "Post-Landing & Settlement Services"
  ],
  contactInfo: {
    email: "contact@worldvisa.com",
    phone: "+91 7022090909",
    website: "https://worldvisagroup.com",
    office: "Manipal Center, Dickenson Rd, Bengaluru, Karnataka 560042"
  },
  socialMedia: ["LinkedIn", "Instagram", "Facebook"],
  ctaButton: {
    text: "Schedule Your Free Consultation",
    link: "/contact"
  },
  footer: {
    companyTagline: "WorldVisa - Your Global Immigration Partner",
    copyright: "\u00A9 2026 WorldVisa. All rights reserved."
  }
};

export function ThankYouPage() {
  const data = STATIC_THANK_YOU_DATA;
  const contactInfo = data.contactInfo;

  const t = {
    dark: '#111827',
    text: '#4B5563',
    muted: '#9CA3AF',
    accent: '#1B2A4A',
    border: '#E5E7EB',
    bg: '#FAFAFA',
    green: '#059669',
  };

  return (
    <div style={{
      minHeight: '297mm',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '14mm 16mm',
      color: t.dark
    }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20pt', marginTop: '10pt' }}>
        <img
          src="https://res.cloudinary.com/djvvz62dw/image/upload/v1765014046/worldvisa/logo_uavsjh.svg"
          alt="WorldVisa"
          style={{ height: '28pt', marginBottom: '16pt' }}
        />
        <h1 style={{ fontSize: '22pt', fontWeight: 700, color: t.dark, marginBottom: '8pt', lineHeight: '1.2' }}>
          {data.heading}
        </h1>
        <p style={{ fontSize: '12pt', lineHeight: '1.6', color: t.text, maxWidth: '420pt', margin: '0 auto' }}>
          {data.thankYouMessage}
        </p>
      </div>

      {data.successStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8pt', marginBottom: '20pt' }}>
          {[
            { label: 'Years of Experience', value: data.successStats.yearsOfExperience },
            { label: 'Clients Served', value: data.successStats.clientsServed },
            { label: 'Success Rate', value: data.successStats.successRate },
          ].map((item, idx) => (
            <div key={idx} style={{ border: `0.5pt solid ${t.border}`, borderRadius: '4pt', padding: '12pt', textAlign: 'center' }}>
              <div style={{ fontSize: '20pt', fontWeight: 700, color: t.accent, marginBottom: '2pt' }}>{item.value}</div>
              <div style={{ fontSize: '10pt', textTransform: 'uppercase', letterSpacing: '0.04em', color: t.muted, fontWeight: 600 }}>{item.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16pt', marginBottom: '16pt' }}>
        <div>
          <h3 style={{ fontSize: '14pt', fontWeight: 700, color: t.dark, marginBottom: '6pt', marginTop: 0, paddingBottom: '4pt', borderBottom: `1px solid ${t.border}` }}>
            About WorldVisa
          </h3>
          <p style={{ fontSize: '12pt', lineHeight: '1.6', color: t.text, marginBottom: '12pt' }}>
            {data.aboutWorldVisa}
          </p>

          <h4 style={{ fontSize: '12pt', fontWeight: 700, color: t.dark, marginBottom: '6pt', marginTop: 0 }}>Our Services</h4>
          {data.services.map((service, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6pt', marginBottom: '4pt' }}>
              <span style={{ color: t.green, fontSize: '12pt', fontWeight: 700 }}>&#10003;</span>
              <span style={{ fontSize: '12pt', color: t.text }}>{service}</span>
            </div>
          ))}
        </div>

        {/* Right: Contact */}
        <div style={{ background: t.bg, border: `0.5pt solid ${t.border}`, borderRadius: '6pt', padding: '14pt' }}>
          <h3 style={{ fontSize: '14pt', fontWeight: 700, color: t.dark, marginBottom: '10pt', marginTop: 0 }}>
            Contact Us
          </h3>

          {contactInfo?.email && (
            <div style={{ marginBottom: '8pt' }}>
              <div style={{ fontSize: '10pt', color: t.muted, marginBottom: '1pt', textTransform: 'uppercase' }}>Email</div>
              <div style={{ fontSize: '12pt', fontWeight: 500, color: t.dark }}>{contactInfo.email}</div>
            </div>
          )}
          {contactInfo?.phone && (
            <div style={{ marginBottom: '8pt' }}>
              <div style={{ fontSize: '10pt', color: t.muted, marginBottom: '1pt', textTransform: 'uppercase' }}>Phone</div>
              <div style={{ fontSize: '12pt', fontWeight: 500, color: t.dark }}>{contactInfo.phone}</div>
            </div>
          )}
          {contactInfo?.website && (
            <div style={{ marginBottom: '8pt' }}>
              <div style={{ fontSize: '10pt', color: t.muted, marginBottom: '1pt', textTransform: 'uppercase' }}>Website</div>
              <div style={{ fontSize: '12pt', fontWeight: 500, color: t.dark }}>{contactInfo.website}</div>
            </div>
          )}
          {contactInfo?.office && (
            <div style={{ marginBottom: '8pt' }}>
              <div style={{ fontSize: '10pt', color: t.muted, marginBottom: '1pt', textTransform: 'uppercase' }}>Office</div>
              <div style={{ fontSize: '12pt', fontWeight: 500, color: t.dark, lineHeight: '1.4' }}>{contactInfo.office}</div>
            </div>
          )}

          {/* <div style={{ marginTop: '12pt', paddingTop: '8pt', borderTop: `0.5pt solid ${t.border}`, textAlign: 'center' }}>
            <p style={{ fontSize: '10pt', color: t.muted, margin: 0 }}>
              Follow us: <strong>{data.socialMedia.join('  |  ')}</strong>
            </p>
          </div> */}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: `0.5pt solid ${t.border}`, paddingTop: '10pt', textAlign: 'center' }}>
        <p style={{ fontSize: '10pt', color: t.muted, margin: 0 }}>
          {data.footer.companyTagline} | {data.footer.copyright}
        </p>
      </div>
    </div>
  );
}
