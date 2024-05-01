import PartyfyUser from "@/helpers/PartyfyUser";
import { createContext } from "react";


let x: { user: PartyfyUser } = 
{
    user: undefined
} 

const UserContext = createContext(x);

export default UserContext;
