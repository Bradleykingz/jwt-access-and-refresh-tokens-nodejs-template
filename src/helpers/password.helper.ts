import bcrypt from "bcrypt"

export default class PasswordHelper {

    async isPasswordCorrect({passwordToVerify, bcryptPasswordHash}: {
        passwordToVerify: string,
        bcryptPasswordHash: string
    }): Promise<boolean> {

        return bcrypt.compare(passwordToVerify, bcryptPasswordHash);
    }

    hash(password: string) {
        const salt = 10
        return bcrypt.hash(password, salt)
    }
}