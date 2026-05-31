import { Router } from 'express';

import {
  bulkCreateOrders,
  cancelOrder,
  createOrder,
  trackOrder,
} from '../controllers/order.controller.js';

export const orderRouter = Router();

orderRouter.post('/', createOrder);
orderRouter.post('/bulk', bulkCreateOrders);
orderRouter.get('/:orderId/track', trackOrder);
orderRouter.post('/:orderId/cancel', cancelOrder);
