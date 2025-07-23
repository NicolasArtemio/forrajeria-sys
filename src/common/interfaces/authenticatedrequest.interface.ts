import { Request } from "express";
import { UserRole } from "../enums/user-role.enum";

export interface AunthenticatedRequest extends Request {
    user: {
        id:number,
        username:string,
        role:UserRole,
    }
}