import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

type CommonKey =
    | 'NODE_ENV'
    | 'DATABASE_URL'
    | 'JWT_SECRET'
    | 'SERVER_PORT'
    | 'JWT_EXPIRES'

export type Environment = 'development' | 'dev' | 'staging' | 'production' | 'ci' | 'test';

class Env {
    constructor() {
        this.configureDefaultAndInit();
    }

    private _requiredKeys = [
        'NODE_ENV', // Used by literally everything.
        'JWT_SECRET', // Only needed for development. Asymmetric signing used in production.
        'DATABASE_URL', //Used by Prisma and db-migrate
    ];

    get requiredKeys() {
        return this._requiredKeys;
    }

    set requiredKeys(requiredKeys: Array<string>) {
        this._requiredKeys = requiredKeys;
    }

    /**
     * This method configures dotenv with the provided .env file
     * @param file - where environment variables should be loaded from
     * @param requiredKeys
     */
    init(file: string, requiredKeys = this.requiredKeys): any {
        dotenv.config({
            path: path.resolve(process.cwd(), file)
        });

        if (!fs.existsSync(file)) {
            console.error(
                `A ${file} file is missing. Please create one and add the following variables: ${this.requiredKeys.toString()}`
            );
            throw new Error(`Please add a ${file} file to your root directory.`);
        } else {
            const missingKeys = requiredKeys.map(key => {
                const variable = this.getVariable(key);

                // 'variable' can be 'false'
                if (variable === undefined || variable === null) {
                    return key;
                }
            }).filter(value => value !== undefined);

            if (missingKeys.length) {
                const message = `The following required env variables are missing:
                ${missingKeys.toString()}. Please add them to your ${file} file`;
                console.error(message);
                throw new Error(message);
            }
        }
    }

    /**
     * Returns the current environment.
     */
    getEnvironment(): Environment {
        let environment = this.getVariable('NODE_ENV')?.toLowerCase();
        if (!environment) console.warn('Warn: No environment set.');

        // @ts-ignore
        return environment;
    }

    getVariable(input: CommonKey | string): string {
        return process.env[input] as string;
    }

    get(input: string | CommonKey) {
        return this.getVariable(input);
    }

    /**
     * Returns true for a test environment, normally set by the test runner
     */
    isTest() {
        return this.getEnvironment() === 'test';
    }

    /**
     * Returns true if on a staging server.
     */
    isStaging() {
        return this.getEnvironment() === 'staging';
    }

    /**
     * Returns true if code is being tested in a CI environment.
     */
    isCi() {
        return this.getEnvironment() === 'ci';
    }

    /**
     * True for development environment
     */
    isDevelopment() {
        return this.getEnvironment() === 'development';
    }

    /**
     * True for production
     */
    isProduction() {
        return this.getEnvironment() === 'production';
    }

    /**
     * This method configures the current environment,
     * letting dotenv know which file to source environment
     * variables from.
     * <br/>
     * It checks for the existence of a .env.default file
     * and, depending on the environment provided there,
     * it loads variables from .env.test or .env.dev
     * <br/>
     * If no .env.default file is found, it attempts to read
     * from .env
     * @protected
     */
    protected configureDefaultAndInit() {
        const file = '.env.default';
        // check if the 'controller' .env file exists
        if (fs.existsSync(file)) {
            // if it does, use it to configure dotenv
            dotenv.config({
                path: path.resolve(process.cwd(), file),
            });

            // and get the environment as defined in the .env* file
            const environment = this.getEnvironment();
            // and the appropriate environment file
            const envFile = this.getDotEnvFile(environment);
            // then init dotenv again with the new env file
            this.init(envFile);
        } else {
            // if it doesn't, just init with the default environment variable file
            this.init('.env');
        }
    }

    protected getDotEnvFile(environment: Environment) {
        let dotEnvFile: string;
        switch (environment) {
            case 'development':
            case 'dev':
                dotEnvFile = '.env.dev';
                return dotEnvFile;
            case 'test':
                dotEnvFile = '.env.test';
                return dotEnvFile;
            case 'production':
            case 'staging':
            case 'ci':
                dotEnvFile = '.env';
                return dotEnvFile;
            default:
                console.log("Warn: No environment provided. Loading 'development' environment")
                dotEnvFile = '.env.default'
                return dotEnvFile;
        }
    }
}

export default Env;
