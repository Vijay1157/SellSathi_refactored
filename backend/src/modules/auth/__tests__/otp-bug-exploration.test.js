/**
 * Bug Condition Exploration Test - OTP Network Error Fix
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3**
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * 
 * This test encodes the expected behavior:
 * - sendOtpEmail should successfully send email and return result with messageId
 * - /auth/send-email-otp endpoint should return 200 success response
 * - transporter.verify() should succeed
 * 
 * EXPECTED OUTCOME ON UNFIXED CODE: Test FAILS
 * - sendOtpEmail returns null (authentication/connection failure)
 * - Endpoint returns 500 error
 * - transporter.verify() may fail with authentication error
 * 
 * When this test passes after the fix, it confirms the bug is resolved.
 */

const fc = require('fast-check');
const emailService = require('../../../shared/services/emailService');
const nodemailer = require('nodemailer');

describe('Bug Condition Exploration - OTP Email Sending Failure', () => {
  
  /**
   * Property 1: Fault Condition - OTP Email Successfully Sent
   * 
   * For any valid email address, sendOtpEmail should:
   * 1. Successfully send the email through Gmail SMTP
   * 2. Return a result object with messageId
   * 3. Not return null
   */
  describe('Property 1: sendOtpEmail should successfully send emails', () => {
    
    it('should send OTP email and return result with messageId for valid email addresses', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid email addresses
          fc.emailAddress(),
          // Generate 6-digit OTP codes
          fc.integer({ min: 100000, max: 999999 }).map(n => n.toString()),
          async (email, otpCode) => {
            console.log(`\n📧 Testing OTP email to: ${email} with code: ${otpCode}`);
            
            // Call sendOtpEmail
            const result = await emailService.sendOtpEmail(email, otpCode);
            
            // Log the result for debugging
            if (result) {
              console.log(`✅ Email sent successfully. MessageId: ${result.messageId}`);
            } else {
              console.log(`❌ Email sending failed. Result is null.`);
            }
            
            // EXPECTED BEHAVIOR (will fail on unfixed code):
            // 1. Result should not be null
            expect(result).not.toBeNull();
            
            // 2. Result should have a messageId property
            expect(result).toHaveProperty('messageId');
            
            // 3. MessageId should be a non-empty string
            expect(result.messageId).toBeTruthy();
            expect(typeof result.messageId).toBe('string');
            
            // 4. Result should have accepted array containing the email
            expect(result.accepted).toBeDefined();
            expect(result.accepted).toContain(email);
          }
        ),
        {
          numRuns: 1, // Test with 1 email address for fastest execution
          verbose: true
        }
      );
    });

    it('should send OTP email for specific test cases', async () => {
      const testCases = [
        { email: 'test@example.com', otp: '123456' }
      ];

      for (const testCase of testCases) {
        console.log(`\n📧 Testing specific case: ${testCase.email} with OTP: ${testCase.otp}`);
        
        const result = await emailService.sendOtpEmail(testCase.email, testCase.otp);
        
        if (result) {
          console.log(`✅ Email sent successfully. MessageId: ${result.messageId}`);
        } else {
          console.log(`❌ Email sending failed. Result is null.`);
          console.log(`   This confirms the bug exists - sendOtpEmail returns null on failure`);
        }
        
        // EXPECTED BEHAVIOR (will fail on unfixed code):
        expect(result).not.toBeNull();
        expect(result).toHaveProperty('messageId');
        expect(result.messageId).toBeTruthy();
      }
    });
  });

  /**
   * Test transporter.verify() to check SMTP connection status
   * This helps identify the root cause of the bug
   */
  describe('SMTP Connection Verification', () => {
    
    it('should verify SMTP connection successfully', async () => {
      console.log('\n🔍 Testing SMTP connection with transporter.verify()...');
      
      // Get the transporter from emailService
      // We need to access the transporter directly to test verify()
      const MAILER_CONFIG = {
        user: process.env.MAILER_GOOGLE_USER_EMAIL,
        pass: process.env.MAILER_GOOGLE_USER_PASSWORD,
        service: 'gmail'
      };
      
      const transporter = nodemailer.createTransport({
        service: MAILER_CONFIG.service,
        auth: {
          user: MAILER_CONFIG.user,
          pass: MAILER_CONFIG.pass
        }
      });
      
      try {
        const verifyResult = await transporter.verify();
        console.log('✅ SMTP connection verified successfully:', verifyResult);
        
        // EXPECTED BEHAVIOR (will fail on unfixed code):
        expect(verifyResult).toBe(true);
      } catch (error) {
        console.log('❌ SMTP connection verification failed:');
        console.log('   Error code:', error.code);
        console.log('   Error message:', error.message);
        console.log('   Error response:', error.response);
        console.log('\n🔍 Root Cause Analysis:');
        
        if (error.code === 'EAUTH') {
          console.log('   - Authentication failure detected');
          console.log('   - Likely cause: Invalid App Password or missing Gmail App Password');
          console.log('   - Solution: Generate Gmail App Password from https://myaccount.google.com/apppasswords');
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
          console.log('   - Connection timeout/refused detected');
          console.log('   - Likely cause: Network blocking or firewall');
          console.log('   - Solution: Check firewall rules and network connectivity');
        } else {
          console.log('   - Unknown error type');
          console.log('   - Review error details above for diagnosis');
        }
        
        // Re-throw to fail the test
        throw error;
      }
    });
  });

  /**
   * Test multiple rapid OTP requests to check connection pooling
   */
  describe('Multiple Rapid OTP Requests', () => {
    
    it('should handle multiple rapid OTP requests without connection issues', async () => {
      console.log('\n📧 Testing 2 rapid OTP requests...');
      
      const requests = [
        { email: 'user1@example.com', otp: '111111' },
        { email: 'user2@example.com', otp: '222222' }
      ];
      
      const results = await Promise.all(
        requests.map(async (req, index) => {
          console.log(`   Request ${index + 1}: ${req.email}`);
          const result = await emailService.sendOtpEmail(req.email, req.otp);
          
          if (result) {
            console.log(`   ✅ Request ${index + 1} succeeded: ${result.messageId}`);
          } else {
            console.log(`   ❌ Request ${index + 1} failed: null result`);
          }
          
          return result;
        })
      );
      
      // EXPECTED BEHAVIOR (will fail on unfixed code):
      results.forEach((result, index) => {
        expect(result).not.toBeNull();
        expect(result).toHaveProperty('messageId');
      });
      
      console.log('✅ All rapid requests completed successfully');
    });
  });
});
