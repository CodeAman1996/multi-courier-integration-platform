import 'dotenv/config';

import { validateEnv } from '../helpers/validation.helper.js';

export const env = validateEnv(process.env);

export type AppEnv = typeof env;
