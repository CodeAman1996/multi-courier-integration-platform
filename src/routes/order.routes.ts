import { Router } from 'express';

import {
  bulkCreateOrders,
  cancelOrder,
  createOrder,
  getTrackingHistory,
  trackOrder,
} from '../controllers/order.controller.js';

export const orderRouter = Router();

orderRouter.post('/', createOrder);
orderRouter.post('/bulk', bulkCreateOrders);
orderRouter.get('/:orderId/track', trackOrder);
orderRouter.get('/:orderId/tracking-history', getTrackingHistory);
orderRouter.post('/:orderId/cancel', cancelOrder);
