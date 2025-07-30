import { appConfig } from "@/lib/appConfig";
import { createRobotsHandler } from "@third-ui/lib/server";

export default createRobotsHandler(appConfig.baseUrl);