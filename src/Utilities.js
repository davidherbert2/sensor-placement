/**
 * @module Utilities
 */

/**
 * Hex to rgba - https://stackoverflow.com/questions/21646738/convert-hex-to-rgba
 * @param {string} hex - RGB triplet 
 * @param {float} [opacity=1.0] - desired opacity 
 */
export const HEX2RGBA = (hex, alpha = 1) => {
	const [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
	return `rgba(${r},${g},${b},${alpha})`;
};

/**
 * Generate a UUID4 - https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
 */
export const UUID4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}