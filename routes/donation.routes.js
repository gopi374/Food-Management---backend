import express from 'express';
import { body } from 'express-validator';
import {
    createDonation,
    getDonations,
    getMyDonations,
    requestPickup,
    completeDonation,
    cancelDonation
} from '../controllers/donation.controller.js';
import { authenticate, requireDonor, requireRecipient } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = express.Router();

// Apply auth to all donation routes
router.use(authenticate);

router.post(
    '/',
    requireDonor,
    [
        body('foodType').notEmpty().withMessage('Food type is required'),
        body('category').notEmpty().withMessage('Category is required'),
        body('quantity.value').isNumeric().withMessage('Quantity must be a number'),
        body('quantity.unit').notEmpty().withMessage('Quantity unit is required'),
        body('preparationTime').isISO8601().withMessage('Valid preparation time required'),
        body('expiryTime').isISO8601().withMessage('Valid expiry time required'),
        body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('Valid coordinates required'),
        body('address').notEmpty().withMessage('Address is required'),
        body('contactPhone').notEmpty().withMessage('Contact phone is required'),
        validate
    ],
    createDonation
);

router.get('/', getDonations);
router.get('/my-donations', getMyDonations);

router.post('/:id/request', requireRecipient, requestPickup);
router.post('/:id/complete', completeDonation);
router.delete('/:id', requireDonor, cancelDonation);

export default router;
