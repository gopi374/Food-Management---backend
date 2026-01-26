import express from 'express';
import Donation from '../models/Donation.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/dashboard', async (req, res, next) => {
    try {
        const userId = req.user._id;
        const stats = {};

        if (req.user.userType === 'donor') {
            const donations = await Donation.find({ donor: userId });

            stats.totalDonations = donations.length;
            stats.completedDonations = donations.filter(d => d.status === 'completed').length;
            stats.pendingDonations = donations.filter(d => d.status === 'pending').length;

            // Calculate total weight (assuming 'kg' unit or similar conversion)
            stats.totalQuantityKg = donations
                .filter(d => d.status === 'completed')
                .reduce((sum, d) => {
                    // Simple conversion logic for demo purposes
                    const val = d.quantity.value;
                    if (d.quantity.unit === 'kg') return sum + val;
                    if (d.quantity.unit === 'servings') return sum + (val * 0.25);
                    if (d.quantity.unit === 'plates') return sum + (val * 0.4);
                    return sum + val;
                }, 0);

            stats.estimatedMeals = Math.round(stats.totalQuantityKg * 4);
            stats.impactScore = stats.completedDonations * 10;
        } else {
            const pickups = await Donation.find({ recipient: userId });

            stats.totalPickups = pickups.length;
            stats.completedPickups = pickups.filter(p => p.status === 'completed').length;
            stats.activePickups = pickups.filter(p => p.status === 'accepted').length;

            stats.totalQuantityKg = pickups
                .filter(p => p.status === 'completed')
                .reduce((sum, p) => {
                    const val = p.quantity.value;
                    if (p.quantity.unit === 'kg') return sum + val;
                    if (p.quantity.unit === 'servings') return sum + (val * 0.25);
                    if (p.quantity.unit === 'plates') return sum + (val * 0.4);
                    return sum + val;
                }, 0);

            stats.peopleFed = Math.round(stats.totalQuantityKg * 4);
        }

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        next(error);
    }
});

export default router;
