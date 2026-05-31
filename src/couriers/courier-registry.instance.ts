import { CourierRegistry } from './courier-registry.js';
import { mockCourierAdapter } from './mock-courier/mock-courier.adapter.js';

export const courierRegistry = new CourierRegistry();

courierRegistry.register(mockCourierAdapter);
