import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const mcubeInboundLeadLogSchema = new Schema(
  {
    event: { type: String, required: true },
    callType: { type: String, default: null },
    customerNumber: { type: String, required: true },
    countryCode: { type: String, default: null },
    customerName: { type: String, default: null },
    action: {
      type: String,
      enum: ['created', 'updated', 'logged', 'ignored', 'failed'],
      required: true,
    },
    zohoModule: { type: String, default: null },
    zohoRecordId: { type: String, default: null },
    leadSource: { type: String, default: null },
    updatedFields: { type: [String], default: [] },
    payload: { type: Schema.Types.Mixed, required: true },
    zohoResponse: { type: Schema.Types.Mixed, default: null },
    errorMessage: { type: String, default: null },
  },
  { timestamps: true }
);

mcubeInboundLeadLogSchema.index({ customerNumber: 1, createdAt: -1 });
mcubeInboundLeadLogSchema.index({ zohoRecordId: 1 });
mcubeInboundLeadLogSchema.index({ event: 1, createdAt: -1 });
mcubeInboundLeadLogSchema.index({ action: 1, createdAt: -1 });

export type McubeInboundLeadLogType = InferSchemaType<typeof mcubeInboundLeadLogSchema>;

const MODEL_NAME = 'McubeInboundLeadLog';

const McubeInboundLeadLog =
  (mongoose.models[MODEL_NAME] as mongoose.Model<McubeInboundLeadLogType> | undefined) ??
  mongoose.model<McubeInboundLeadLogType>(MODEL_NAME, mcubeInboundLeadLogSchema);

export default McubeInboundLeadLog;
