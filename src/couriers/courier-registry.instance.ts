import { CourierRegistry } from './courier-registry.js';
import { mockCourierAdapter } from './mock-courier/mock-courier.adapter.js';
import { createUrbaneBoltAdapter } from './urbanebolt/urbanebolt.adapter.js';

export const courierRegistry = new CourierRegistry();

courierRegistry.register(mockCourierAdapter);
courierRegistry.register(createUrbaneBoltAdapter());
