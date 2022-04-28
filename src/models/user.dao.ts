import {UserType} from "@types";
import {PrismaClient} from "@generated"

const prisma = new PrismaClient()

export default class UserDAO {

    async findByUsername(username: string): Promise<UserType | null> {


        return prisma.user.findUnique({
            where: {
                username: username
            }
        })
    }

    async save(user: Omit<UserType, "id">): Promise<UserType> {
        return prisma.user.create({
            data: user
        })
    }
}