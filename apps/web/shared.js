/**
 * @returns {string}
 */
function getBaseApiUrl() {
	if (process.env.NEXT_PUBLIC_API_URL) {
		return process.env.NEXT_PUBLIC_API_URL;
	}

	if (process.env.API_URL) {
		return process.env.API_URL;
	}

	throw new TypeError('No API URL found');
}

module.exports = getBaseApiUrl;
