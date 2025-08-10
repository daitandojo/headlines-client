const countryFlagMap = {
  'Denmark': '🇩🇰',
  'Norway': '🇳🇴',
  'Sweden': '🇸🇪',
  'Finland': '🇫🇮',
  'Netherlands': '🇳🇱',
  'Belgium': '🇧🇪',
  'United States': '🇺🇸',
  'United Kingdom': '🇬🇧',
  // Special categories from your backend
  'Global PE': '🌐',
  'M&A Aggregators': '🤝',
};

const defaultFlag = '🌍'; // Fallback for any country not in the map

/**
 * Returns the flag emoji for a given country name.
 * @param {string} countryName - The name of the country (e.g., "Denmark").
 * @returns {string} The corresponding flag emoji.
 */
export function getCountryFlag(countryName) {
  return countryFlagMap[countryName] || defaultFlag;
}

    