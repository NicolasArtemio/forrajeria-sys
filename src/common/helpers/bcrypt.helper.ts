import * as bcrypt from 'bcrypt'
export class BcryptHelper {
    private static readonly SALTS_ROUNDS = 10

    static async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, this.SALTS_ROUNDS);
    }

    static async comparePassword(password: string, hashed: string): Promise<boolean> {
        return await bcrypt.compare(password, hashed);
    }
}