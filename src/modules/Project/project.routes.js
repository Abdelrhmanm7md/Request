import express from "express";
import * as projectController from "./project.controller.js";
import {
  fileSizeLimitErrorHandler,
  uploadMixFile,
} from "../../utils/middleWare/fileUploads.js";

const projectRouter = express.Router();

projectRouter.get("/", projectController.getAllProjectByAdmin);
projectRouter.get("/:id", projectController.getProjectById);
projectRouter.get("/docs/:id", projectController.getAllDocsProject);
projectRouter.get(
  "/status/:status",
  projectController.getAllProjectByStatusByAdmin
);
projectRouter.get(
  "/user/status/:id",
  projectController.getAllProjectByStatusByUser
);
projectRouter.post("/", projectController.createProject);
projectRouter.put("/members/:id", projectController.updateProjectMembers);
projectRouter.put("/:id", projectController.updateProject);
projectRouter.delete("/:id", projectController.deleteProject);
// projectRouter.put(
//     "/images/:id",
//     uploadMixFile("documents", [
//       { name: "documents",  },
//     ]),fileSizeLimitErrorHandler,
//     projectController.updateProjectDocs
//   );
export default projectRouter;
