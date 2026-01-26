import User from '../models/User.js';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Array} coord1 - [longitude, latitude]
 * @param {Array} coord2 - [longitude, latitude]
 * @returns {Number} Distance in kilometers
 */
export const calculateDistance = (coord1, coord2) => {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;

    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal
};

const toRad = (degrees) => {
    return degrees * (Math.PI / 180);
};

/**
 * Find nearby recipients within a radius
 * @param {Array} coordinates - [longitude, latitude]
 * @param {Number} maxDistance - Maximum distance in meters (default 10km)
 * @returns {Array} Array of nearby recipients with distance
 */
export const findNearbyRecipients = async (coordinates, maxDistance = 10000) => {
    try {
        const recipients = await User.find({
            userType: 'recipient',
            isAvailable: true,
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: coordinates,
                    },
                    $maxDistance: maxDistance,
                },
            },
        }).limit(10);

        // Calculate exact distances
        const recipientsWithDistance = recipients.map(recipient => ({
            recipient: recipient,
            distance: calculateDistance(coordinates, recipient.location.coordinates),
        }));

        return recipientsWithDistance;
    } catch (error) {
        console.error('Error finding nearby recipients:', error);
        throw error;
    }
};

/**
 * Find nearby donations for a recipient
 * @param {Array} coordinates - [longitude, latitude]
 * @param {Number} maxDistance - Maximum distance in meters
 * @returns {Array} Array of nearby donations
 */
export const findNearbyDonations = async (coordinates, maxDistance = 10000) => {
    try {
        const donations = await User.aggregate([
            {
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: coordinates,
                    },
                    distanceField: 'distance',
                    maxDistance: maxDistance,
                    spherical: true,
                },
            },
        ]);

        return donations;
    } catch (error) {
        console.error('Error finding nearby donations:', error);
        throw error;
    }
};

/**
 * Auto-match donation with nearby recipients
 * @param {Object} donation - Donation object
 * @returns {Array} Matched recipients sorted by distance
 */
export const autoMatchDonation = async (donation) => {
    try {
        const nearbyRecipients = await findNearbyRecipients(
            donation.location.coordinates,
            10000 // 10km default radius
        );

        // Sort by distance and take top 3
        const topMatches = nearbyRecipients
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3)
            .map(match => ({
                recipient: match.recipient._id,
                distance: match.distance,
            }));

        return topMatches;
    } catch (error) {
        console.error('Error auto-matching donation:', error);
        throw error;
    }
};
