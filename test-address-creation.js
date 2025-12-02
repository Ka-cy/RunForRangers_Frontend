// Test script to verify OrderAddress creation API
// Run this in the browser console on the checkout page

async function testAddressCreation() {
    console.log('Testing OrderAddress creation...');
    
    // Get token from localStorage (user should be logged in)
    const userToken = localStorage.getItem('currentUserLoggedIn');
    if (!userToken) {
        console.error('User not logged in - please log in first');
        return;
    }
    
    const token = JSON.parse(userToken).token;
    
    // Test address data
    const testAddress = {
        orderId: 0, // Temporary - backend will handle this
        streetAddress: "123 Test Street",
        suburb: "Test Suburb",
        postalCode: "12345",
        cityId: 1, // Assuming valid city ID
        provinceId: 1, // Assuming valid province ID  
        countryId: 160 // South Africa
    };
    
    try {
        const response = await fetch('https://localhost:7158/api/OnlineStore/OrderAddresses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(testAddress)
        });
        
        console.log('Response status:', response.status);
        
        const responseData = await response.text();
        console.log('Response data:', responseData);
        
        if (response.ok) {
            console.log('✅ Address creation SUCCESSFUL!');
            const data = JSON.parse(responseData);
            console.log('Created address ID:', data.orderAddressId);
        } else {
            console.log('❌ Address creation FAILED!');
            console.log('Error details:', responseData);
        }
        
    } catch (error) {
        console.error('❌ Network/fetch error:', error);
    }
}

// Run the test
testAddressCreation();
