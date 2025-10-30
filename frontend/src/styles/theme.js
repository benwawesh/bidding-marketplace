// Consistent color theme extracted from HomePage
export const theme = {
  // Primary colors - Orange theme
  primary: {
    50: '#fff7ed',   // Very light orange
    100: '#ffedd5',  // Light orange
    200: '#fed7aa',  // Lighter orange
    300: '#fdba74',  // Light-medium orange
    400: '#fb923c',  // Medium orange
    500: '#f97316',  // Base orange
    600: '#ea580c',  // Dark orange
    700: '#c2410c',  // Darker orange
    800: '#9a3412',  // Very dark orange
    900: '#7c2d12',  // Deepest orange
  },

  // Background colors
  bg: {
    base: 'bg-white',
    light: 'bg-orange-50',
    gradient: 'bg-gradient-to-r from-orange-500 to-orange-600',
    hover: 'hover:bg-orange-100',
  },

  // Text colors
  text: {
    primary: 'text-gray-900',
    secondary: 'text-gray-600',
    tertiary: 'text-gray-500',
    orange: 'text-orange-600',
    white: 'text-white',
  },

  // Button styles
  button: {
    primary: 'bg-orange-500 text-white hover:bg-orange-600 transition',
    secondary: 'bg-white text-orange-600 border-2 border-orange-500 hover:bg-orange-50 transition',
    outline: 'border border-gray-300 hover:border-orange-500 transition',
  },

  // Border colors
  border: {
    light: 'border-gray-200',
    medium: 'border-gray-300',
    orange: 'border-orange-500',
  },
};

// Tailwind utility classes for consistent styling
export const commonClasses = {
  container: 'max-w-7xl mx-auto px-4',
  card: 'bg-white rounded-lg shadow-sm',
  input: 'w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-orange-500',
  heading: {
    h1: 'text-3xl md:text-4xl font-bold text-gray-900',
    h2: 'text-2xl md:text-3xl font-bold text-orange-600',
    h3: 'text-xl md:text-2xl font-bold text-gray-900',
  },
};
