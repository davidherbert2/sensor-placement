/**
 * @module Utilities
 */

Object.assign(String.prototype, {

    /**
     * Additional utility methods added to the String object prototype
     */

    /**
     * Generate a UUID4 - https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
     * @return {string}
     */
    uuid4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
   
    /**
     * Replace urls in text with HTML anchors
     * @param {string} target
     * @return {string}
     */
    linkify(target = "_blank") {
        return this.replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, url => {
            return `<a href="${url}" target="${target}">${url}</a>`;
        });
    },

    /**
     * Hex to rgba - https://stackoverflow.com/questions/21646738/convert-hex-to-rgba
     * @param {string} hex - RGB triplet 
     * @param {float} [opacity=1.0] - desired opacity 
     * @return {string}
     */
    toRgba(alpha = 1) {
        const [r, g, b] = this.match(/\w\w/g).map(x => parseInt(x, 16));
        return `rgba(${r},${g},${b},${alpha})`;
    }

});