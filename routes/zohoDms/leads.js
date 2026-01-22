const express = require("express");
const { zohoRequest } = require("../../controllers/zohoDms/zohoApi.js");
const { protect } = require("../../controllers/zohoDmsAuthController.js");

const router = express.Router();

// Function to get all leads
async function getAllLeads() {
  const leadsEndpoint = "Leads?fields=Last_Name,First_Name,Email,Phone,Mobile";
  const { data: allLeads } = await zohoRequest(leadsEndpoint);
  return allLeads || [];
}

// Function to get attachments for a single lead
async function getAttachmentsForLead(leadId) {
  try {
    const attachmentsEndpoint = `Leads/${leadId}/Attachments?fields=id,Owner,File_Name,Created_Time,Parent_Id`;
    const { data: attachmentsData } = await zohoRequest(attachmentsEndpoint);

    if (!attachmentsData) {
      return [];
    }

    // Parse the attachments to only include the desired fields
    return attachmentsData.map(att => ({
      id: att.id,
      Owner: att.Owner,
      File_Name: att.File_Name,
      Created_Time: att.Created_Time,
      Parent_Id: att.Parent_Id,
    }));
  } catch (error) {
    console.error(`Failed to fetch attachments for lead ${leadId}:`, error.response?.data || error.message);
    return []; // Return empty array if attachments fail to load
  }
}

// Main function to combine leads with their attachments
async function getLeadsWithAttachments() {
  const allLeads = await getAllLeads();

  if (allLeads.length === 0) {
    return [];
  }

  const leadsWithAttachments = await Promise.all(
    allLeads.map(async (lead) => {
      const attachments = await getAttachmentsForLead(lead.id);
      return {
        ...lead,
        Attachments: attachments,
      };
    })
  );

  return leadsWithAttachments;
}


router.get("/", protect, async (req, res) => {
  try {
    const leadsWithAttachmentsData = await getLeadsWithAttachments();
    res.json({ data: leadsWithAttachmentsData });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Failed to fetch leads");
  }
});

module.exports = router;
