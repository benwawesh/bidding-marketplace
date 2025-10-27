// Add this to the onError handler (around line 50):

onError: (error) => {
  console.log('=== FULL ERROR ===');
  console.log('Error object:', error);
  console.log('Response:', error.response);
  console.log('Response data:', error.response?.data);
  console.log('Response status:', error.response?.status);
  console.log('===================');
  
  const errorData = error.response?.data || {};
  setErrors(errorData);
  
  // Show detailed error in alert
  const errorMessages = Object.entries(errorData).map(([field, msgs]) => {
    return `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`;
  }).join('\n');
  
  alert('❌ Error creating product:\n\n' + errorMessages);
},
