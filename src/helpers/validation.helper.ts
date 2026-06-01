import Joi from 'joi';

export type FieldValidationError = {
  field: string;
  message: string;
};

export class RequestValidationError extends Error {
  readonly statusCode = 400;
  readonly code = 'VALIDATION_ERROR';
  readonly details: FieldValidationError[];

  constructor(details: FieldValidationError[]) {
    super('Request validation failed');
    this.name = 'RequestValidationError';
    this.details = details;
  }
}

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().integer().positive().default(3000),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .default('info'),
  DATABASE_URL: Joi.when('NODE_ENV', {
    is: 'test',
    then: Joi.string().optional(),
    otherwise: Joi.string().required(),
  }),
  REDIS_URL: Joi.string().default('redis://localhost:6379'),
  URBANEBOLT_BASE_URL: Joi.string().uri().default('https://uat.urbanebolt.in'),
  URBANEBOLT_USERNAME: Joi.string().allow('').optional(),
  URBANEBOLT_PASSWORD: Joi.string().allow('').optional(),
  URBANEBOLT_CUSTOMER_CODE: Joi.string().allow('').optional(),
}).unknown(true);

const courierPartnerParamSchema = Joi.object({
  courierPartner: Joi.string().trim().lowercase().required().messages({
    'any.required': 'courierPartner is required',
    'string.empty': 'courierPartner is required',
  }),
});

const createOrderSchema = Joi.object({
  order_id: Joi.string().trim().required().messages({
    'any.required': 'order_id is required',
    'string.empty': 'order_id is required',
  }),
  courier_partner: Joi.string().trim().lowercase().required().messages({
    'any.required': 'courier_partner is required',
    'string.empty': 'courier_partner is required',
  }),
  payment_mode: Joi.string().trim().uppercase().valid('COD', 'PREPAID').optional(),
  declared_value: Joi.number().min(0).optional(),
  collectable_value: Joi.number().min(0).optional(),
}).unknown(true);

const bulkCreateOrdersSchema = Joi.object({
  orders: Joi.array().items(createOrderSchema).min(1).max(100).required().messages({
    'any.required': 'orders is required',
    'array.base': 'orders must be an array',
    'array.min': 'orders must contain at least 1 order',
    'array.max': 'orders cannot contain more than 100 orders',
  }),
});

const orderIdParamSchema = Joi.object({
  orderId: Joi.string().trim().required().messages({
    'any.required': 'orderId is required',
    'string.empty': 'orderId is required',
  }),
});

export function validateEnv(source: NodeJS.ProcessEnv) {
  const { value, error } = envSchema.validate(source, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    throw new Error(`Environment validation failed: ${error.message}`);
  }

  return value as {
    NODE_ENV: 'development' | 'test' | 'production';
    PORT: number;
    LOG_LEVEL: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';
    DATABASE_URL?: string;
    REDIS_URL: string;
    URBANEBOLT_BASE_URL: string;
    URBANEBOLT_USERNAME?: string;
    URBANEBOLT_PASSWORD?: string;
    URBANEBOLT_CUSTOMER_CODE?: string;
  };
}

export function validatePayload<T>(schema: Joi.Schema<T>, payload: unknown): T {
  const { value, error } = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    throw new RequestValidationError(formatJoiErrors(error));
  }

  return value;
}

export function validateCourierPartner(courierPartner: unknown, supportedCouriers: string[]) {
  const schema = Joi.string()
    .trim()
    .lowercase()
    .valid(...supportedCouriers)
    .required()
    .messages({
      'any.only': `courier_partner must be one of: ${supportedCouriers.join(', ')}`,
      'any.required': 'courier_partner is required',
      'string.empty': 'courier_partner is required',
    });

  return validatePayload<string>(schema, courierPartner);
}

export function validateCourierPartnerParam(payload: unknown) {
  return validatePayload<{ courierPartner: string }>(courierPartnerParamSchema, payload);
}

export type CreateOrderRequest = {
  order_id: string;
  courier_partner: string;
  payment_mode?: 'COD' | 'PREPAID';
  declared_value?: number;
  collectable_value?: number;
} & Record<string, unknown>;

export type BulkCreateOrdersRequest = {
  orders: CreateOrderRequest[];
};

export function validateCreateOrder(payload: unknown) {
  return validatePayload<CreateOrderRequest>(createOrderSchema, payload);
}

export function validateBulkCreateOrders(payload: unknown) {
  return validatePayload<BulkCreateOrdersRequest>(bulkCreateOrdersSchema, payload);
}

export function validateOrderIdParam(payload: unknown) {
  return validatePayload<{ orderId: string }>(orderIdParamSchema, payload);
}

function formatJoiErrors(error: Joi.ValidationError): FieldValidationError[] {
  return error.details.map((detail) => ({
    field: detail.path.join('.') || 'value',
    message: detail.message.replaceAll('"', ''),
  }));
}
