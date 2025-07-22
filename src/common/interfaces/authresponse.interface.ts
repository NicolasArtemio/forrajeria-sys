import { UserRole } from "../enums/user-role.enum";

export interface AuthResponse {
  access_token: string;
  user: {
    username: string;
    role: UserRole
  };
}