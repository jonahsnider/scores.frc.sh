const { withPlausibleProxy } = require('next-plausible');
const dotenv = require('dotenv');
const path = require('node:path');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

/** @type {import('next').NextConfig} */
const nextConfig = withPlausibleProxy()({
	productionBrowserSourceMaps: true,
});

module.exports = nextConfig;
