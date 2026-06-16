import { Team } from "@/models";
import { resourceHandlers, teamSchema } from "@/lib/crud";

export const { GET, POST, PATCH, DELETE } = resourceHandlers(Team, teamSchema);
