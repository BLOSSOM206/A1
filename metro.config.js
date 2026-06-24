const { getDefaultConfig } = require('expo/metro-config');

let exclusionList;
try {
	exclusionList = require('metro-config/src/defaults/exclusionList');
} catch (e) {
	// metro-config may not export the internal helper on some versions.
	// Fallback to an identity function that returns the passed array so
	// we can still assign regex patterns to `blockList`.
	exclusionList = (arr) => arr;
}

const config = getDefaultConfig(__dirname);

// Exclude Android/Gradle build outputs from Metro file watching on Windows.
// These generated paths can contain malformed segments that crash FallbackWatcher.
config.resolver.blockList = exclusionList([
	/android[\\/]app[\\/]build[\\/].*/,
	/android[\\/]build[\\/].*/,
	/android[\\/]\\.gradle[\\/].*/,
]);

module.exports = config;
