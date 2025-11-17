// Financial calculation utilities

/**
 * Calculate tax amount based on subtotal and tax rate
 * @param {number} subtotal - The subtotal amount
 * @param {number} taxRate - The tax rate as a percentage
 * @returns {string} The calculated tax amount with 2 decimal places
 */
export const calculateTax = (subtotal, taxRate) => {
  return (subtotal * (taxRate / 100)).toFixed(2);
};

/**
 * Calculate total amount including tax
 * @param {number} subtotal - The subtotal amount
 * @param {number} taxRate - The tax rate as a percentage
 * @returns {string} The total amount with 2 decimal places
 */
export const calculateTotal = (subtotal, taxRate) => {
  const tax = calculateTax(subtotal, taxRate);
  return (Number(subtotal) + Number(tax)).toFixed(2);
};

/**
 * Calculate subtotal from breakdown
 * @param {Object} breakdown - The breakdown object containing costs
 * @returns {number} The subtotal amount
 */
export const calculateSubtotal = (breakdown) => {
  const { laborCosts, materialCosts, additionalFees } = breakdown;
  return Number(laborCosts) + Number(materialCosts) + Number(additionalFees || 0);
};

/**
 * Format currency amount
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  return `$${Number(amount).toFixed(2)}`;
}; 