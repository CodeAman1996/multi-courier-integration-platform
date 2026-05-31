import { Router } from 'express';

import { createOrder } from '../controllers/order.controller.js';

export const orderRouter = Router();

orderRouter.post('/', createOrder);
