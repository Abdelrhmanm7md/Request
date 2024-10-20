import { tagsModel } from "../../../database/models/tags.model.js";
import { userModel } from "../../../database/models/user.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import AppError from "../../utils/appError.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createTags = catchAsync(async (req, res, next) => {
  req.body.model = "66e5570f78313d16a73caa9a";
  req.body.createdBy = req.params.id;
  const newData = new tagsModel(req.body);
  const savedData = await newData.save();

  res.status(201).json({
    message: "Tags created successfully!",
    savedData,
  });
});

const getAllTagsByAdmin = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(tagsModel.find(), req.query).search();
  let results = await ApiFeat.mongooseQuery;
  results = JSON.stringify(results);
  results = JSON.parse(results);
  if (!ApiFeat || !results) {
    return res.status(404).json({
      message: "No Tags was found!",
    });
  }
  res.json({
    message: "Done",
    results,
  });
});
const getAllTagsByUser = catchAsync(async (req, res, next) => {
  let { id } = req.params;
  let userResults = await userModel.findById(id);
  if (userResults) {
    let results = await tagsModel.find({ createdBy: id });
    !results && next(new AppError(`not found `, 404));
    results && res.json({ message: "Done", results });
  } else {
    res.json({ message: " User Id Not Found" });
  }
});

const updateTags = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const updateeTags = await tagsModel.findByIdAndUpdate(id, req.body, {
    new: true,
  });
  if (!updateeTags) {
    return res.status(404).json({ message: "Tags not found!" });
  }
  res.status(200).json({
    message: "Tag Updated successfully!",
    updateeTags,
  });
});
const deleteTags = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const deleteTags = await tagsModel.findByIdAndDelete(id);
  if (!deleteTags) {
    return res.status(404).json({ message: "Tags not found!" });
  }
  res.status(200).json({
    message: "Tags Deleted successfully!",
    deleteTags,
  });
});

export {
  createTags,
  getAllTagsByAdmin,
  getAllTagsByUser,
  updateTags,
  deleteTags,
};
