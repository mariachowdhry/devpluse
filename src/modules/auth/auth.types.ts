import type { UserRole } from "../../types/models";


export interface SignupRequestBody {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}
