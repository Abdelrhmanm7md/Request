import messageRouter from "./Message/message.routes.js";
import notiticationRouter from "./Notification/notification.routes.js";
import taskRouter from "./Tasks/tasks.routes.js";
import authRouter from "./auth/auth.routes.js";
import usersRouter from "./users/users.routes.js";
import projectRouter from "./Project/project.routes.js";
import complaintRouter from "./Complaints/complaint.routes.js";
import privacyRouter from "./Privacy/privacy.routes.js";
import docsRouter from "./Documents/docs.routes.js";
import newsRouter from "./News/news.routes.js";
import logRouter from "./Project Log/projectLog.routes.js";


export function init(app) {
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/notification", notiticationRouter);
  app.use("/api/v1/message", messageRouter);
  app.use("/api/v1/project", projectRouter);
  app.use("/api/v1/task", taskRouter);
  app.use("/api/v1/complaint", complaintRouter);
  app.use("/api/v1/privacy", privacyRouter);
  app.use("/api/v1/docs", docsRouter);
  app.use("/api/v1/news", newsRouter);
  app.use("/api/v1/log", logRouter);
  
  app.use("/", (req, res, next) => {
    // res.send("Hello World");
    next(res.status(404).json({ message: "Page Not Found" }));
  });

  app.all("*", (req, res, next) => {
    next(res.status(404).json({ message: "Not found" }));
  });

}
