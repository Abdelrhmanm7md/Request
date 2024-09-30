import mongoose from "mongoose";

const documentsSchema = mongoose.Schema(
  {
    document: {
      type: String,
      required: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "task",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      required: true,
    },
    comment: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    tag: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tag",
    },
    model: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "model",
      immutable: true,
      // required: true,
    },
  },
  { timestamps: true }
);
documentsSchema.pre(/^find/, function () {
  this.populate("uploadedBy", "project");
});

export const documentsModel = mongoose.model("document", documentsSchema);
