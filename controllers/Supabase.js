require("dotenv").config();
const supabaseClient = require("@supabase/supabase-js");

const supabaseUrl = "https://ugxqrsjwflalmdnlufsp.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVneHFyc2p3ZmxhbG1kbmx1ZnNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwOTYzNzI5MywiZXhwIjoyMDI1MjEzMjkzfQ.nudbAIYk0HJ0If_PmYXWcdXKNWutFPn9RbMJ5uUXfPU";

const supabase = supabaseClient.createClient(supabaseUrl, supabaseAnonKey);

const uploadFile = async (email, attachment_id, file) => {
  const { data, error } = await supabase.storage
    .from("assessment_reports")
    .upload(`${email}/assesment-report/${attachment_id}.pdf`, file, {
      contentType: "application/pdf",
    });
  if (error) {
    console.error("Upload error", error);
  } else {
    console.log("File uploaded", data);
    return data;
  }
};

const getPublicUrl = async (fullPath) => {
  const { data, error } = supabase.storage
    .from("assessment_reports")
    .getPublicUrl(fullPath);

  if (error) {
    console.error("Unable to generate public link", error);
  } else {
    console.log("Generated Public link", data);
    return data;
  }
};

const deleteFile = async (fullPath) => {
  const { data, error } = supabase.storage
    .from("assessment_reports")
    .remove(fullPath);

  if (error) {
    console.log("Error deleting the file", error);
  } else {
    console.log("Deleted the file");
    return data;
  }
};

module.exports = { uploadFile, getPublicUrl, deleteFile };
