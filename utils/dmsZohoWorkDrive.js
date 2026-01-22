require("dotenv").config();
const axios = require('axios');
const dmsZohoLeadFolder = require('../models/dmsZohoLeadFolder');
const { getAccessToken } = require('../controllers/zohoDms/zohoAuth');

const WORKDRIVE_ROOT_FOLDER_ID = process.env.WORKDRIVE_ROOT_FOLDER_ID;

async function getdmsZohoLeadFolderId(record_id) {
  let leadFolder = await dmsZohoLeadFolder.findOne({ record_id: record_id });



  if (leadFolder) {
    return leadFolder.workdrive_folder_id;
  }

  // If not found, create a new folder in WorkDrive
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Unable to get Zoho access token.');
  }

  try {
    const response = await axios.post(
      `https://www.zohoapis.in/workdrive/api/v1/files`,
      {
        data: {
          attributes: {
            name: record_id,
            parent_id: WORKDRIVE_ROOT_FOLDER_ID,
          },
          type: "files",
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      }
    );

    const newFolderId = response.data.data.id;

    leadFolder = await dmsZohoLeadFolder.create({
      record_id: record_id,
      workdrive_folder_id: newFolderId,
    });
    return newFolderId;
  } catch (error) {
    console.error('Error creating Zoho WorkDrive folder:', error.response ? error.response.data : error.message);
    throw new Error('Failed to create Zoho WorkDrive folder.');
  }
}

async function uploadFileToWorkDrive(folderId, fileName, fileBuffer, mimeType) {
  const timestamp = Date.now();
  const uniqueFileName = `${timestamp}_${fileName}`;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Unable to get Zoho access token.');
  }

  try {
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('content', fileBuffer, { filename: uniqueFileName, contentType: mimeType });
    formData.append('parent_id', folderId);

    const response = await axios.post(
      'https://www.zohoapis.in/workdrive/api/v1/upload',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      }
    );

    return response.data.data[0].attributes.resource_id;
  } catch (error) {
    console.error('Error from Zoho WorkDrive API during file upload:', error.response ? error.response.data : error.message);
  }
}

async function deleteFileFromWorkDrive(fileId) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Unable to get Zoho access token.');
  }

  try {
    await axios.patch(
      `https://www.zohoapis.in/workdrive/api/v1/files/${fileId}`,
      {
        data: {
          attributes: {
            status: "51"
          },
          type: "files"
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      }
    );
    return true;
  } catch (error) {

    throw new Error('Failed to delete file from Zoho WorkDrive.');
  }
}

async function moveFileToSpecificFolder(fileId) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Unable to get Zoho access token.');
  }

  const destinationFolderId = "54vyn8d45d2484286424aa88c78a5ac78cd7a";

  try {
    const response = await axios.patch(
      `https://www.zohoapis.in/workdrive/api/v1/files/${fileId}`,
      {
        data: {
          attributes: {
            parent_id: destinationFolderId
          },
          type: "files"
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error moving file in Zoho WorkDrive:', error.response ? error.response.data : error.message);
    throw new Error('Failed to move file in Zoho WorkDrive.');
  }
}


async function getFilePreviewMetadata(resourceId) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Unable to get Zoho access token.');
  }

  try {
    const response = await axios.get(
      `https://www.zohoapis.in/workdrive/api/v1/files/${resourceId}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching file info from Zoho WorkDrive:', error.response ? error.response.data : error.message);
    throw new Error(`Failed to get file info from Zoho WorkDrive: ${error.response?.data?.errors?.[0]?.message || error.message}`);
  }
}

async function createFileLinks(resourceId) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Unable to get Zoho access token.');
  }

  try {
    const response = await axios.post(
      `https://www.zohoapis.in/workdrive/api/v1/links`,
      {
        data: {
          "type": "links",
          "attributes": {
            "resource_id": resourceId,
            "link_name": "Public Link for World Visa DMS",
            "allow_download": true,
            "role_id": "5", // for public link
            "allow_download": "true",
            "request_user_data": "false"
          }
        }
      },
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching file info from Zoho WorkDrive:', error.response ? error.response.data : error.message);
    throw new Error(`Failed to get file info from Zoho WorkDrive: ${error.response?.data?.errors?.[0]?.message || error.message}`);
  }
}

async function getFileLinks(resourceId) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Unable to get Zoho access token.');
  }

  try {
    const response = await axios.get(
      `https://www.zohoapis.in/workdrive/api/v1/files/${resourceId}/links`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching file info from Zoho WorkDrive:', error.response ? error.response.data : error.message);
    throw new Error(`Failed to get file info from Zoho WorkDrive: ${error.response?.data?.errors?.[0]?.message || error.message}`);
  }
}

async function renameWorkDriveFile(resourceId, newName) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Unable to get Zoho access token.');
  }

  try {
    const response = await axios.patch(
      `https://www.zohoapis.in/workdrive/api/v1/files/${resourceId}`,
      {
        data: {
          attributes: {
            name: newName,
          },
          type: "files",
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error renaming file in Zoho WorkDrive:', error.response ? error.response.data : error.message);
    throw new Error(`Failed to rename file in Zoho WorkDrive: ${error.response?.data?.errors?.[0]?.message || error.message}`);
  }
}

async function downloadAllFilesInZip(resourceId) {
  // resourceId can be a single id or a comma-separated string of ids
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Unable to get Zoho access token.');
  }

  try {
    const response = await axios.post(
      'https://www.zohoapis.in/workdrive/api/v1/multizip',
      {
        data: {
          attributes: {
            resource_id: resourceId
          },
          type: "files"
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error downloading files as ZIP from Zoho WorkDrive:', error.response ? error.response.data : error.message);
    throw new Error(`Failed to download files as ZIP from Zoho WorkDrive: ${error.response?.data?.errors?.[0]?.message || error.message}`);
  }
}


module.exports = {
  getdmsZohoLeadFolderId,
  uploadFileToWorkDrive,
  deleteFileFromWorkDrive,
  getFilePreviewMetadata,
  renameWorkDriveFile,
  getFileLinks,
  createFileLinks,
  downloadAllFilesInZip,
  moveFileToSpecificFolder
};