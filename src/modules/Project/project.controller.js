import mongoose from "mongoose";
import { projectModel } from "../../../database/models/project.model.js";
import { userModel } from "../../../database/models/user.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import AppError from "../../utils/appError.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";
import { taskModel } from "../../../database/models/tasks.model.js";

const createProject = catchAsync(async (req, res, next) => {
  req.body.model = "66ba015a73f994dd94dbc1e9";
  
  // Check if budget is valid
  if (req.body.budget < 0) {
    return res.status(404).json({ message: "Budget must be greater than 0" });
  }

  let newProject = new projectModel(req.body);
  
  newProject.members.push(newProject.createdBy);
  // newProject.members.push(newProject.contractor);
  // newProject.members.push(newProject.owner);
  // newProject.members.push(newProject.consultant);

  newProject.members = newProject.members.filter(
    (item, index) => newProject.members.indexOf(item) === index
  );

  await newProject.save();
  let populatedProject = await projectModel
    .findById(newProject._id)
    .populate({
      path: 'members',
      select: '_id name email profilePic', // Add any other fields you want to include
    });
  res.status(201).json({
    message: " Project has been created successfully!",
    addedProject: populatedProject,
  });
});

const getProjectById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let results = await projectModel
    .findById(id)
    .populate("contractor")
    .populate("consultant")
    .populate("members")
    .populate("tags")
    .populate({
      path: "team",
      select:
        "members",
      populate: {
        path: "members",
        model: "user",
        select: "_id name profilePic",
      },
    })
    .populate("owner");
  !results && next(new AppError(`not found `, 404));
  results && res.json({ message: "Done", results });
  if (!ApiFeat || !results) {
    return res.status(404).json({
      message: " Project Not found!",
    });
  }
  res.json({
    message: "Done",
    results,
  });
});
////////////////////////////////// admin \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

const getAllProjectByAdmin = catchAsync(async (req, res, next) => {
  let ApiFeat = null;
  if (req.query.status == "all") {
    ApiFeat = new ApiFeature(
      projectModel
        .find()
        .sort({ $natural: -1 })
        .populate("contractor")
        .populate("consultant")
        .populate("createdBy")
        // .populate("team")
        .populate("members")
        .populate("owner"),
      req.query
    ).search();
  } else {
    ApiFeat = new ApiFeature(
      projectModel
        .find({ status: req.query.status })
        .sort({ $natural: -1 })
        .populate("contractor")
        .populate("consultant")
        .populate("createdBy")
        .populate("members")
        .populate("owner"),
      req.query
    ).search();
  }

  let results = await ApiFeat.mongooseQuery;
  results = JSON.stringify(results);
  results = JSON.parse(results);

  if (!ApiFeat || !results) {
    return res.status(404).json({
      message: "No Project was found!",
    });
  }

  let { filterType, filterValue } = req.query;
  if (filterType && filterValue) {
    results = results.filter(function (item) {
      if (filterType == "name") {
        return item.name.toLowerCase().includes(filterValue.toLowerCase());
      }
      if (filterType == "status") {
        return item.status.toLowerCase().includes(filterValue.toLowerCase());
      }
      if (filterType == "description") {
        return item.description
          .toLowerCase()
          .includes(filterValue.toLowerCase());
      }
      if (filterType == "createdBy") {
        return item.createdBy.name
          .toLowerCase()
          .includes(filterValue.toLowerCase());
      }
    });
  }

  results = results.map((project) => {
    return {
      ...project,
      documentsCount: project.documents ? project.documents.length : 0,
      notesCount: project.notes ? project.notes.length : 0,};
  });

  res.json({
    message: "Done",
    count: await projectModel.countDocuments(),
    results,
  });
});

const getAllProjectByUser = catchAsync(async (req, res, next) => {
  let ApiFeat = null;

  if (
    req.user.role._id == "66d33a4b4ad80e468f231f83" ||
    req.user.role._id == "66d33e7a4ad80e468f231f8d" ||
    req.user.role._id == "66d33ec44ad80e468f231f91"
  ) {
    ApiFeat = new ApiFeature(
      projectModel
        .find({ members: { $in: req.params.id } })
        .sort({ $natural: -1 })
        .select("tasks name")
        .populate({
          path: "tasks",
          select:
            "title taskPriority taskStatus assignees documents startDate dueDate notes",
          populate: {
            path: "assignees",
            model: "user",
            select: "_id name profilePic",
          },
        }),
      req.query
    )
      .sort()
      .search();
  } else {
    ApiFeat = new ApiFeature(
      projectModel
        .find({ members: { $in: req.params.id } })
        .sort({ $natural: -1 })
        .select("tasks name")
        .populate({
          path: "tasks",
          select:
            "title taskPriority taskStatus assignees documents startDate dueDate notes",
          match: { assignees: { $in: req.params.id } }, // Filter tasks with the assignee matching req.params.id
          populate: {
            path: "assignees",
            model: "user",
            select: "_id name profilePic",
          },
        }),
      req.query
    )
      .sort()
      .search();
  }

  let results = await ApiFeat.mongooseQuery;
  results = JSON.stringify(results);
  results = JSON.parse(results);
  if (!ApiFeat || !results) {
    return res.status(404).json({
      message: "No Project was found!",
    });
  }
  
  results.forEach((project) => {
    project.taskCount = project.tasks.length;
    project.tasks.forEach((task) => {
      task.documentsLength = task.documents.length;
      task.notesLength = task.notes.length;
      delete task.notes;
      delete task.updatedAt;
      delete task.isDelayed;
      delete task.documents;
    });
  });
  let { filterType, filterValue } = req.query;
  if (filterType && filterValue) {
    results = results.filter(function (item) {
      if (filterType == "name") {
        return item.name.toLowerCase().includes(filterValue.toLowerCase());
      }
      if (filterType == "status") {
        return item.status.toLowerCase().includes(filterValue.toLowerCase());
      }
      if (filterType == "description") {
        return item.description
          .toLowerCase()
          .includes(filterValue.toLowerCase());
      }
    });
  }
  res.json({
    message: "Done",
    results,
  });
});

const getAllAnalyticsByUser = catchAsync(async (req, res, next) => {
  res.json({
    message: "Done",
    countProjects: await projectModel.countDocuments({
      members: { $in: req.params.id },
    }),
    totalTasks: await taskModel.countDocuments({
      assignees: { $in: req.params.id },
    }),
    delayedTasks: await taskModel.countDocuments({
      $and: [{ assignees: { $in: req.params.id } }, { isDelayed: true }],
    }),
    inProgressTasks: await taskModel.countDocuments({
      $and: [{ assignees: { $in: req.params.id } }, { taskStatus: "working" }],
    }),
    completedTasks: await taskModel.countDocuments({
      $and: [
        { assignees: { $in: req.params.id } },
        { taskStatus: "completed" },
      ],
    }),
  });
});

const getAllProjectByStatusByUser = catchAsync(async (req, res, next) => {
  let foundUser = await userModel.findById(req.params.id);
  if (!foundUser) {
    return res.status(404).json({ message: "User not found!" });
  }
  let ApiFeat = null;
  if (req.query.status == "all" ) {
    ApiFeat = new ApiFeature(
      projectModel
        .find({ members: { $in: req.params.id } })
        .populate("contractor")
        .populate("consultant")
        .populate("members")
        .populate("owner"),
      req.query
    )
      .sort()
      .search();
  } else {
    ApiFeat = new ApiFeature(
      projectModel
        .find({
          $and: [
            { members: { $in: req.params.id } },
            { status: req.query.status },
          ],
        })
        .populate("contractor")
        .populate("consultant")
        .populate("members")
        .populate("owner"),
      req.query
    )
      .sort()
      .search();
  }
  let results = await ApiFeat.mongooseQuery;
  results = JSON.stringify(results);
  results = JSON.parse(results);
  if (!ApiFeat || !results) {
    return res.status(404).json({
      message: "No Project was found!",
    });
  }

  let { filterType, filterValue } = req.query;
  if (filterType && filterValue) {
    results = results.filter(function (item) {
      if (filterType == "name") {
        return item.name.toLowerCase().includes(filterValue.toLowerCase());
      }
      if (filterType == "description") {
        return item.description
          .toLowerCase()
          .includes(filterValue.toLowerCase());
      }
      if (filterType == "createdBy") {
        return item.createdBy.toLowerCase().includes(filterValue.toLowerCase());
      }
      // if (filterType == "members") {
      //   if (item.members[0]) {
      //     return item.members[0].name
      //       .toLowerCase()
      //       .includes(filterValue.toLowerCase());
      //   }
      // }
    });
  }

  res.json({
    message: "Done",
    count: await projectModel.countDocuments({
      members: { $in: req.params.id },
    }),
    results,
  });
});
const getAllDocsProject = catchAsync(async (req, res, next) => {
  let results = await projectModel.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(req.params.id) }, // Match the specific project by its ID
    },
    {
      $lookup: {
        from: "tasks",
        localField: "_id", 
        foreignField: "project", 
        as: "tasks", 
      },
    },
    {
      $project: {
        name: 1, 
        tasks: {
          _id: 1,
          title: 1,
          documents: 1,
          tags: 1,
        }, 
      },
    },
  ]);

  // Populate tasks.tags with their names
  results = await projectModel.populate(results, {
    path: "tasks.tags", // Correct path for the nested populate
    model: "tag",
    select: "name colorCode", 
  });

  // Populate tasks.documents with their document field
  results = await projectModel.populate(results, {
    path: "tasks.documents", // Correct path for the nested populate
    model: "document",
    select: "document", // Ensure you're using the correct field
  });

  res.json({
    message: "Done",
    results,
  });
});

const getAllMembersProject = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(
    projectModel.findById(req.params.id).populate("members"),
    req.query
  )
    .sort()
    .search();

  let results = await ApiFeat.mongooseQuery;

  if (!ApiFeat || !results) {
    return res.status(404).json({
      message: "No Project was found!",
    });
  }
  let members = [];
  if (results.members) {
    members = results.members.map(member => ({
      _id: member._id,
      name: member.name,
      profilePic: member.profilePic,
      role: member.role ? member.role.jobTitle : "None", 
      vocation: member.vocation,
      email: member.email,
      phone: member.phone,
    }));
  }
  
  let roles = ["owner", "consultant", "contractor"];
  const groupAdmins = roles.reduce((acc, role) => {
    acc[role] = null;
    return acc;
  }, {});
  
  members.forEach(member => {
    if (roles.includes(member.role)) {
      groupAdmins[member.role] = member;
    }
  });
  let groupedMembers = []
  groupedMembers = members.reduce((acc, member) => {
    if (!roles.includes(member.role)) {      
      groupedMembers.push(member);
    }
    return groupedMembers;
  }, []);

  res.json({
    message: "Done",
    count: members.length,
    admins: groupAdmins,
    members: groupedMembers,
  });
});

const getAllProjectsFilesByAdmin = catchAsync(async (req, res, next) => {
  let results = await projectModel.aggregate([
      {
        $lookup: {
          from: "tasks", // Join with the tasks collection
          localField: "_id", // Project _id
          foreignField: "project", // Field in Task model that references the project
          as: "tasks", // Store related tasks in `tasks`
        },
      },
      {
        $unwind: "$tasks", // Unwind tasks to access each task individually
      },
      {
        $lookup: {
          from: "tags", // Join with the tags collection
          localField: "tasks.tags", // The field in Task model that references the tag
          foreignField: "_id", // Field in Tag model
          as: "taskTags", // Store the related tag info in `taskTags`
        },
      },
      {
        $unwind: "$taskTags", // Unwind taskTags to handle each tag individually
      },
      {
        $group: {
          _id: "$_id", // Group by project ID
          projectName: { $first: "$name" }, // Keep the project name
          tags: {
            $addToSet: {
              _id: "$taskTags._id", // Tag ID
              name: "$taskTags.name", // Tag name
              colorCode: "$taskTags.colorCode", // Tag color code
              createdBy: "$taskTags.createdBy", // Who created the tag
            },
          },
        },
      },
      {
        $project: {
          _id: 1, // Include project ID
          projectName: 1, // Include project name
          tags: 1, // Include only tags (no tasks)
        },
      },
      {
        $sort: { projectName: 1 }, // Sort the projects by name
      },
    ]);
    
  res.json({
    message: "Done",
    results,
  });
});

const getAllProjectsFilesByUser = catchAsync(async (req, res, next) => {
  const memberId = new mongoose.Types.ObjectId(req.params.id);
  
  let results = await projectModel.aggregate(
    [
      {
        $match: { members: memberId },
      },
      {
        $lookup: {
          from: "tasks", // Join with the tasks collection
          localField: "_id", // Project _id
          foreignField: "project", // Field in Task model that references the project
          as: "tasks", // Store related tasks in `tasks`
        },
      },
      {
        $unwind: "$tasks", // Unwind tasks to access each task individually
      },
      {
        $lookup: {
          from: "tags", // Join with the tags collection
          localField: "tasks.tags", // The field in Task model that references the tag
          foreignField: "_id", // Field in Tag model
          as: "taskTags", // Store the related tag info in `taskTags`
        },
      },
      {
        $unwind: "$taskTags", // Unwind taskTags to handle each tag individually
      },
      {
        $group: {
          _id: "$_id", // Group by project ID
          projectName: { $first: "$name" }, // Keep the project name
          tags: {
            $addToSet: {
              _id: "$taskTags._id", // Tag ID
              name: "$taskTags.name", // Tag name
              colorCode: "$taskTags.colorCode", // Tag color code
              createdBy: "$taskTags.createdBy", // Who created the tag
            },
          },
        },
      },
      {
        $project: {
          _id: 1, // Include project ID
          projectName: 1, // Include project name
          tags: 1, // Include only tags (no tasks)
        },
      },
      {
        $sort: { projectName: 1 }, // Sort the projects by name
      },
    ]);

  res.json({
    message: "Done",
    results,
  });
});
const getFilesByTags = catchAsync(async (req, res, next) => {
  const tagId = new mongoose.Types.ObjectId(req.params.id);

  let results = await projectModel.aggregate(
    [
      {
        $lookup: {
          from: "tasks", // Assuming the tasks collection is named "tasks"
          localField: "_id", // Project _id
          foreignField: "project", // The field in Task model that references the project
          as: "tasks", // The field to store the related tasks
        },
      },
      {
        $unwind: "$tasks", // Unwind tasks to access each task individually
      },
      {
        $lookup: {
          from: "tags", // Assuming the tags collection is named "tags"
          localField: "tasks.tags", // The field in Task model that references the tag
          foreignField: "_id", // The field in Tag model
          as: "taskTags", // Store the related tag info in `taskTags`
        },
      },
      {
        $unwind: "$taskTags", // Unwind taskTags to handle each tag individually
      },
      {
        $match: {
          "taskTags._id": tagId, // Filter by the tag ID you want to search for
        },
      },
      {
        $group: {
          _id: "$taskTags._id", // Group by the tag ID
          tagName: { $first: "$taskTags.name" }, // Keep the tag name
          tagColor: { $first: "$taskTags.colorCode" }, // Keep the tag name
          tasks: {
            $push: {
              _id: "$tasks._id", // Task ID
              title: "$tasks.title", // Task title
              documents: "$tasks.documents", // Task documents
            },
          },
        },
      },
      {
        $project: {
          _id: 1, // Include tag ID
          tagName: 1, // Include tag name
          tagColor: 1, // Include tag name
          tasks: 1, // Include tasks with task name and documents
        },
      },
    ]
    );

    results = await projectModel.populate(results, {
      path: "tasks.documents", // Correct path for the nested populate
      model: "document",
      select: "document", // Ensure you're using the correct field
    });
    results = results[0]
    res.json({
    message: "Done",
    results,
  });
});
const getFilesForDownload = catchAsync(async (req, res, next) => {
  const tagId = new mongoose.Types.ObjectId(req.params.tagId); 
  // const projectId = new mongoose.Types.ObjectId(req.params.id); 
  
  let results = await projectModel.aggregate([
    {
      $lookup: {
        from: "tasks",
        localField: "_id",
        foreignField: "project",
        as: "tasks",
      },
    },
    {
      $unwind: "$tasks",
    },
    {
      $lookup: {
        from: "tags",
        localField: "tasks.tags",
        foreignField: "_id",
        as: "taskTags",
      },
    },
    {
      $unwind: "$taskTags",
    },
    {
      $match: {
        "taskTags._id": tagId,
        // "_id": projectId,
      },
    },
    {
      $group: {
        _id: "$taskTags._id",
        tagName: { $first: "$taskTags.name" },
        tagColor: { $first: "$taskTags.colorCode" },
        tasks: {
          $push: {
            documents: "$tasks.documents",
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        tagName: 1,
        tagColor: 1,
        tasks: 1,
      },
    },
  ]);

    results = await projectModel.populate(results, {
      path: "tasks.documents", // Correct path for the nested populate
      model: "document",
      select: "document", // Ensure you're using the correct field
    });
    if (results.length == 0) {
      results = []   
    }else{
      let allDocuments = [];
      results = results[0]
      results.tasks = results.tasks.map((task) => task.documents)
      .reduce((acc, val) => acc.concat(val), []);
      results.tasks = results.tasks.map((task) => {
        allDocuments.push(task.document)
      })
      results.tasks = allDocuments
    }
    res.json({
    message: "Done",
    results,
  });
});
const getTagsByProject = catchAsync(async (req, res, next) => {
  const projectId = new mongoose.Types.ObjectId(req.params.id);

  let results = await projectModel.aggregate(
    [
      {
        $match: {
          _id: projectId, 
        }
      },
      {
        $lookup: {
          from: "tasks",
          localField: "_id", 
          foreignField: "project", 
          as: "tasks", 
        },
      },
      {
        $unwind: "$tasks", 
      },
      {
        $lookup: {
          from: "tags", 
          localField: "tasks.tags", 
          foreignField: "_id", 
          as: "taskTags", 
        },
      },
      {
        $unwind: "$taskTags", 
      },
      {
        $group: {
          _id: "$_id", 
          projectName: { $first: "$name" }, 
          tags: {
            $addToSet: {
              _id: "$taskTags._id", 
              name: "$taskTags.name", 
              colorCode: "$taskTags.colorCode", 
              createdBy: "$taskTags.createdBy", 
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          projectName: 1, 
          tags: 1,
        },
      }
    ]
    
    );
    if (results.length == 0) {
      results = { tags: [] }   
    }else{
      results = results[0];
    }
    res.json({
    message: "Done",
    results,
  });
    
});

const updateProject = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (req.body.budget < 0) {
    return res.status(404).json({ message: "Budget must be greater than 0" });
  }
  let {
    name,
    description,
    status,
    sDate,
    dueDate,
    requestForInspectionForm,
    tableOfQuantities,
    approvalOfSchemes,
    workRequest,
    requestForApprovalOfMaterials,
    requestForDocumentSubmittalApproval,
    isAproved,
    documents,
    tasks,
    members,
    contractor,
    consultant,
    owner,
    team,
    budget,
    tags,
    notes,
  } = req.body;
  const updatedProject = await projectModel.findByIdAndUpdate(
    id,
    {
      name,
      description,
      status,
      sDate,
      dueDate,
      requestForInspectionForm,
      tableOfQuantities,
      approvalOfSchemes,
      workRequest,
      requestForApprovalOfMaterials,
      requestForDocumentSubmittalApproval,
      isAproved,
      $push: {
        documents,
        tasks,
        members,
        tags,
        notes
      },
      contractor,
      consultant,
      owner,
      team,
      budget,
    },
    { new: true }
  );
  const membersToUpdate = { consultant, contractor, owner };

  for (const [role, member] of Object.entries(membersToUpdate)) {
      if (member) {
          await projectModel.findByIdAndUpdate(
              id,
              {
                  $push: {
                      members: member
                  }
              }
          );
      }
  }
  
  if (!updatedProject) {
    return res.status(404).json({ message: "Project not found!" });
  }
  res.status(200).json({
    message: "project updated successfully!",
    updatedProject,
  });
});
const updateProject2 = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  let {
    documents,
    tasks,
    members,
    contractor,
    consultant,
    team,
    tags,
    notes,
  } = req.body;
  const updatedProject = await projectModel.findByIdAndUpdate(
    id,
    {
      $pull: {
        documents,
        tasks,
        members,
        contractor,
        consultant,
        tags,
        notes
      },
      team,
      budget,
    },
    { new: true }
  );

  if (!updatedProject) {
    return res.status(404).json({ message: "Project not found!" });
  }
  res.status(200).json({
    message: "project updated successfully!",
    updatedProject,
  });
});

const deleteProject = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const deletedProject = await projectModel.deleteOne({ _id: id })
  if (!deletedProject) {
    return res.status(404).json({ message: "Project not found!" });
  }
  res.status(200).json({ message: "project deleted successfully!" });
});

export {
  deleteProject,
  updateProject,
  getAllProjectByAdmin,
  createProject,
  getProjectById,
  getAllDocsProject,
  getFilesByTags,
  getAllProjectByStatusByUser,
  getAllProjectsFilesByUser,
  getAllProjectByUser,
  getAllProjectsFilesByAdmin,
  getAllAnalyticsByUser,
  getAllMembersProject,
  updateProject2,
  getTagsByProject,
  getFilesForDownload,
};
