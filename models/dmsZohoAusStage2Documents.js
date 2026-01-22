const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const dmsZohoAusStage2DocumentSchema = new Schema(
  {
    record_id: {
      type: String,
      required: true,
    },
    workdrive_file_id: {
      type: String,
      required: true,
    },
    workdrive_parent_id: {
      type: String,
      required: true,
    },
    file_name: {
      type: String,
      required: true,
    },
    document_name: {
      type: String,
      required: true,
    },
    document_type: {
      type: String,
      required: true,
    },
    uploaded_by: {
      type: String,
      required: true,
    },
    uploaded_at: {
      type: Date,
      default: Date.now,
    },
    download_url: {
      type: String,
    },
    document_link: {
      type: String,
    },
    type: {
      type: String,
      enum: ['outcome', 'eoi', 'invitation'],
      required: true,
    },
    outcome: {
      type: String,
      default: ""
    },
    outcome_date: {
      type: Date,
      default: ""
    },
    subclass: {
      type: String,
      required: false,
    },
    state: {
      type: String,
      required: false,
    },
    point: {
      type: Number,
      required: false,
    },
    deadline: {
      type: Date,
      required: false,
      default: "",
    },
    date: {
      type: Date,
      default: ""
    },
    skill_assessing_body: {
      type: String,
      required: false,
      default: "",
    }
  },
  { timestamps: true }
);

const dmsZohoAusStage2Documents = mongoose.model("dmsZohoAusStage2DocumentSchema", dmsZohoAusStage2DocumentSchema);
module.exports = dmsZohoAusStage2Documents;
