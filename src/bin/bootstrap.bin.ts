import {UserType} from "@types";
import {passwordHelper} from "@helpers"
import {userDAO} from "@models";

export default class {


    static async createDefaultUser() {

        const existingUser = userDAO.findByUsername("pppupu")

        if (existingUser == null) {

            const defaultUser: Omit<UserType, "id"> = {
                username: "pppupu",
                isVerified: true,
                role: "ROLE_USER",
                hashedPassword: await passwordHelper.hash("super-strong-password-69")
            }

            return userDAO.save(defaultUser)

        }

        return existingUser;
    }
}