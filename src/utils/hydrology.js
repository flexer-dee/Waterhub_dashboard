/**
 * Calculates direct surface runoff (Q) in millimeters based on the SCS Curve Number method.
 * @param {number} precipitation_mm - Total rainfall (P) in mm from the API.
 * @param {number} curveNumber - The CN value for the local soil/catchment area (e.g., 85 for clay).
 * @returns {number} The depth of direct runoff in mm.
 */
export function calculateRunoff(precipitation_mm, curveNumber) {
    if (!precipitation_mm || precipitation_mm <= 0) return 0;

    // Calculate Maximum Retention (S) in metric SI units (mm)
    const S = (25400 / curveNumber) - 254;
    
    // Calculate Initial Abstraction (Ia)
    const Ia = 0.2 * S;

    // If precipitation is less than the initial abstraction, no runoff occurs
    if (precipitation_mm <= Ia) {
        return 0;
    }

    // Runoff calculation: Q = (P - 0.2S)^2 / (P + 0.8S)
    return Math.pow(precipitation_mm - Ia, 2) / (precipitation_mm + 0.8 * S);
}

/**
 * Calculates the "Days of Reserve" metric based on the water balance equation.
 * @param {number} currentVolumeLiters - Live reading from the IoT tank sensor.
 * @param {number} forecastedRunoffLiters - Calculated incoming water from rain.
 * @param {number} averageDailyConsumption - Expected daily water usage in liters.
 * @returns {number} Estimated days of water remaining.
 */
export function calculateDaysOfReserve(currentVolumeLiters, forecastedRunoffLiters, averageDailyConsumption) {
    if (averageDailyConsumption <= 0) return Infinity; // Prevent division by zero
    
    const totalAvailableWater = currentVolumeLiters + forecastedRunoffLiters;
    return Math.floor(totalAvailableWater / averageDailyConsumption);
}