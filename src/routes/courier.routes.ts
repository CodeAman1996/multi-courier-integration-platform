import { Router } from 'express';

import { getCourier, listCouriers } from '../controllers/courier.controller.js';

export const courierRouter = Router();

courierRouter.get('/', listCouriers);
courierRouter.get('/:courierPartner', getCourier);
