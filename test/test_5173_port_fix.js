const axios = require('axios');
const colors = require('colors');

async function test5173PortFix() {
    console.log('🔄 Testing 5173 Port Configuration...'.cyan.bold);
    console.log('====================================='.cyan);
    
    let passed = 0;
    let failed = 0;
    
    // Test 1: Wrong credentials on 5173 should return 401
    try {
        console.log('\n❌ Test 1: Wrong credentials on port 5173'.yellow);
        const response = await axios.post('http://localhost:5173/api/admin/login', {
            username: 'wrong@example.com',
            password: 'wrongpassword'
        }, { validateStatus: () => true });
        
        if (response.status === 401) {
            console.log('✅ Port 5173 working correctly - 401 response'.green);
            console.log(`   Error message: ${response.data.error}`.gray);
            passed++;
        } else if (response.status === 500) {
            console.log('❌ Still getting 500 error on port 5173!'.red);
            failed++;
        } else {
            console.log(`❌ Unexpected status on 5173: ${response.status}`.red);
            failed++;
        }
    } catch (error) {
        console.log('❌ Port 5173 request failed'.red);
        console.log(`   Error: ${error.message}`.red);
        failed++;
    }
    
    // Test 2: Register and login on 5173
    try {
        console.log('\n✅ Test 2: Complete flow on port 5173'.yellow);
        
        const testUser = {
            name: 'Port 5173 Test User',
            email: `port5173test${Date.now()}@example.com`,
            password: 'port5173test123',
            companyName: 'Port 5173 Company'
        };
        
        // Register on 5173
        const registerResponse = await axios.post('http://localhost:5173/api/admin/register', testUser, {
            validateStatus: () => true
        });
        
        if (registerResponse.status === 201 && registerResponse.data.success) {
            console.log('   ✓ Registration successful on 5173'.gray);
            
            // Login on 5173
            const loginResponse = await axios.post('http://localhost:5173/api/admin/login', {
                username: testUser.email,
                password: testUser.password
            }, { validateStatus: () => true });
            
            if (loginResponse.status === 200 && loginResponse.data.success) {
                console.log('✅ Login successful on port 5173'.green);
                console.log(`   User: ${loginResponse.data.user.name}`.gray);
                passed++;
                
                // Profile test on 5173
                const token = loginResponse.data.token;
                const profileResponse = await axios.get('http://localhost:5173/api/admin/profile', {
                    headers: { 'Authorization': `Bearer ${token}` },
                    validateStatus: () => true
                });
                
                if (profileResponse.status === 200 && profileResponse.data.user) {
                    const profile = profileResponse.data.user;
                    if (profile.name === testUser.name && profile.email === testUser.email) {
                        console.log('✅ Profile correct on port 5173'.green);
                        console.log(`   Name: ${profile.name}`.gray);
                        console.log(`   Email: ${profile.email}`.gray);
                        passed++;
                    } else {
                        console.log('❌ Profile data incorrect on 5173'.red);
                        failed++;
                    }
                } else {
                    console.log('❌ Profile loading failed on 5173'.red);
                    failed++;
                }
            } else {
                console.log('❌ Login failed on 5173'.red);
                failed++;
            }
        } else {
            console.log('❌ Registration failed on 5173'.red);
            failed++;
        }
    } catch (error) {
        console.log('❌ Complete flow test failed on 5173'.red);
        console.log(`   Error: ${error.message}`.red);
        failed++;
    }
    
    // Summary
    console.log('\n🎯 Port 5173 Test Results'.cyan.bold);
    console.log('========================='.cyan);
    console.log(`✅ Passed: ${passed}`.green);
    console.log(`❌ Failed: ${failed}`.red);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`.cyan);
    
    if (failed === 0) {
        console.log('\n🎉 Port 5173 working perfectly!'.green.bold);
        console.log('\n📋 Confirmed on port 5173:'.green);
        console.log('   ✅ No 500 errors'.green);
        console.log('   ✅ Wrong credentials return 401'.green);
        console.log('   ✅ Registration works'.green);
        console.log('   ✅ Login works'.green);
        console.log('   ✅ Profile displays correct info'.green);
    } else {
        console.log('\n⚠️  Some issues remain on port 5173.'.yellow.bold);
    }
    
    console.log('\n🌐 Browser Access:'.cyan.bold);
    console.log('=================='.cyan);
    console.log('Frontend URL: http://localhost:5173'.gray);
    console.log('Login Page:   http://localhost:5173/admin/login'.gray);
    console.log('Register Page: http://localhost:5173/admin/register'.gray);
    
    return { passed, failed };
}

if (require.main === module) {
    test5173PortFix().catch(console.error);
}