import { Router } from 'express';

import { cancelOrder, createOrder, trackOrder } from '../controllers/order.controller.js';

export const orderRouter = Router();

orderRouter.post('/', createOrder);
orderRouter.get('/:orderId/track', trackOrder);
orderRouter.post('/:orderId/cancel', cancelOrder);
