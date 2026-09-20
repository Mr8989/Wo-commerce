import { Router } from 'express';
import products from './products.js';
import categories from './categories.js';
import orders from './orders.js';
import cart from './cart.js';
import admin from './admin.js';

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));

router.use('/products', products);
router.use('/categories', categories);
router.use('/orders', orders);
router.use('/cart', cart);
router.use('/admin', admin);

export default router;
