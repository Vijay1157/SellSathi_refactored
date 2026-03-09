/**
 * Quick test to check if OTP email can be sent
 * Tests sending to joybor157157@gmail.com
 */

require('dotenv').config();
const emailService = require('./src/shared/services/emailService');

async function testOtpSend() {
    console.log('🧪 Testing OTP Email Send...\n');
    
    const testEmail = 'joybor157157@gmail.com';
    const testOtp = '123456';
    
    console.log(`📧 Attempting to send OTP to: ${testEmail}`);
    console.log(`🔢 OTP Code: ${testOtp}\n`);
    
    try {
        const result = await emailService.sendOtpEmail(testEmail, testOtp);
        
        if (result && result.messageId) {
            console.log('✅ SUCCESS! OTP email sent successfully!');
            console.log(`📬 Message ID: ${result.messageId}`);
            console.log(`📨 Accepted: ${result.accepted.join(', ')}`);
            console.log('\n✨ Check the inbox at joybor157157@gmail.com');
            process.exit(0);
        } else {
            console.log('❌ FAILED! Email sending returned null');
            console.log('🔍 This confirms the bug exists - authentication failure');
            process.exit(1);
        }
    } catch (error) {
        console.log('❌ ERROR! Exception thrown during email send');
        console.log(`Error: ${error.message}`);
        console.log(`Code: ${error.code}`);
        process.exit(1);
    }
}

testOtpSend();
