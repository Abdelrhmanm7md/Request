import express from "express";

const usersRouter = express.Router();

import * as usersController from "./users.controller.js";
import {
  fileFilterHandler,
  fileSizeLimitErrorHandler,
  uploadMixFile,
} from "../../utils/middleWare/fileUploads.js";
import { protectRoutes , allowTo } from "../auth/auth.controller.js";

usersRouter.get("/", usersController.getAllUsersByAdmin);
usersRouter.get("/owners/", usersController.getAllowners);
usersRouter.get("/consultant/", usersController.getAllconsultant);
usersRouter.get("/contractor/", usersController.getAllcontractors);
usersRouter.get("/:id", usersController.getUserById);
usersRouter.get("/tags/:id", usersController.getUserTags);
usersRouter.get("/email/", usersController.getUserByEmail);
usersRouter.get("/sub/:id", usersController.getSubscriptionPeriod);

usersRouter.post("/contactUs/:id", usersController.postMessage);
usersRouter.post("/invite/", usersController.sendInviteToProject);

usersRouter.put("/:id", usersController.updateUser);
usersRouter.put("/pull/:id", usersController.updateUser2);
usersRouter.put(
  "/photo/:id",
  uploadMixFile("profilePic", [{ name: "profilePic" }]),
  fileFilterHandler,
  fileSizeLimitErrorHandler,
  usersController.updateprofilePic
);

usersRouter.put(
  "/company/:id",
  uploadMixFile("company", [{ name: "companyLogo" },{ name: "electronicStamp" }, { name: "signature" }, ]),
  fileSizeLimitErrorHandler,
  usersController.updateCollection
);
usersRouter.delete("/:id", usersController.deleteUser);
export default usersRouter;
