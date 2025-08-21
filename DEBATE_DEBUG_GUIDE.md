# Debate Integration Debug Guide

This guide will help you test and debug the debate integration in Cursor.

## 🚀 Quick Start

### 1. Access the Debug Tools

You now have three ways to test the debate integration:

1. **Debate Interface** (`/debate-interface`) - Main debate UI with integrated debug panel
2. **Debate Test Page** (`/debate-test`) - Comprehensive test suite
3. **Browser Console** - Direct access to test functions

### 2. Environment Setup

First, ensure your environment variables are configured:

```bash
# Copy the template
cp env.template .env

# Edit with your actual values
VITE_SUPABASE_URL=your_actual_supabase_url
VITE_SUPABASE_ANON_KEY=your_actual_supabase_key
VITE_N8N_BASE_URL=http://localhost:5678
VITE_N8N_USERNAME=debate_user
VITE_N8N_PASSWORD=debate_pass
```

## 🔧 Testing Methods

### Method 1: Debate Interface Debug Panel

1. Navigate to `/debate-interface`
2. Look for the bug icon (🐛) in the bottom-right corner
3. Click to open the debug panel
4. Use "Quick Test" or "Full Test" buttons

### Method 2: Dedicated Test Page

1. Navigate to `/debate-test`
2. Use the comprehensive test suite
3. Run individual tests or all tests at once
4. View detailed results and logs

### Method 3: Browser Console

Open browser console and use these commands:

```javascript
// Quick health check
window.debateTest.quickHealthCheck()

// Run all tests
window.debateTest.runAllTests()

// Individual tests
window.debateTest.testEnvironmentVariables()
window.debateTest.testSupabaseConnection()
window.debateTest.testN8nWebhook()
window.debateTest.testDatabaseOperations()
```

## 🧪 Test Categories

### 1. Environment Variables Test
- Checks if all required VITE_ environment variables are set
- Validates configuration completeness

### 2. Supabase Connection Test
- Tests connection to Supabase database
- Verifies API key and URL validity
- Checks if `debate_history` table exists

### 3. N8n Webhook Test
- Tests connection to n8n instance
- Validates webhook endpoint `/webhook/debate`
- Checks authentication credentials

### 4. Database Operations Test
- Tests reading from `debate_history` table
- Validates user statistics functionality
- Checks search capabilities

### 5. Manual Debate Test
- Sends a real debate request
- Tests the complete integration flow
- Validates response handling

## 🔍 Troubleshooting Common Issues

### Issue 1: "process is not defined" Error

**Cause**: Using Node.js `process.env` instead of Vite's `import.meta.env`

**Solution**: ✅ Already fixed - environment variables now use `import.meta.env.VITE_*`

### Issue 2: Supabase Connection Failed

**Possible Causes**:
- Invalid Supabase URL or API key
- Missing `debate_history` table
- Network connectivity issues

**Solutions**:
1. Verify your Supabase credentials in `.env`
2. Run the SQL schema from `N8N_INTEGRATION_SETUP.md`
3. Check network connectivity

### Issue 3: N8n Webhook Failed

**Possible Causes**:
- n8n not running
- Incorrect webhook URL
- Authentication issues
- Missing webhook endpoint

**Solutions**:
1. Ensure n8n is running on the configured URL
2. Verify webhook endpoint `/webhook/debate` exists
3. Check authentication credentials
4. Review n8n workflow logs

### Issue 4: Database Operations Failed

**Possible Causes**:
- Missing RLS policies
- Incorrect table structure
- Permission issues

**Solutions**:
1. Run the complete SQL schema
2. Verify RLS policies are enabled
3. Check table structure matches expected schema

## 📊 Understanding Test Results

### Status Indicators

- ✅ **PASSED** - Test completed successfully
- ❌ **FAILED** - Test encountered an error
- 🔄 **RUNNING** - Test is currently executing
- ℹ️ **PENDING** - Test hasn't been run yet

### Log Types

- **INFO** - General information and successful operations
- **ERROR** - Errors that prevent functionality
- **WARN** - Warnings that may indicate issues
- **SUCCESS** - Successful operations

## 🛠️ Advanced Debugging

### 1. Network Tab Analysis

Open browser DevTools → Network tab to see:
- HTTP requests to Supabase
- Webhook calls to n8n
- Response status codes and data

### 2. Console Logging

All integration functions include detailed logging:
```javascript
// Enable verbose logging
localStorage.setItem('debug', 'debate-integration:*');
```

### 3. N8n Workflow Debugging

Check n8n workflow logs for:
- Webhook trigger events
- Node execution status
- Error messages and stack traces

### 4. Supabase Dashboard

Use Supabase dashboard to:
- Monitor real-time logs
- Check table data
- Verify RLS policies
- Test queries directly

## 🎯 Debugging Workflow

### Step 1: Environment Check
```javascript
window.debateTest.testEnvironmentVariables()
```

### Step 2: Database Connection
```javascript
window.debateTest.testSupabaseConnection()
```

### Step 3: N8n Integration
```javascript
window.debateTest.testN8nWebhook()
```

### Step 4: Full Integration Test
```javascript
window.debateTest.runAllTests()
```

### Step 5: Manual Testing
1. Navigate to `/debate-interface`
2. Fill in test data
3. Submit a debate request
4. Check response and history

## 📝 Debug Checklist

- [ ] Environment variables configured
- [ ] Supabase project set up
- [ ] Database tables created
- [ ] RLS policies configured
- [ ] n8n instance running
- [ ] Webhook endpoint created
- [ ] Authentication working
- [ ] Network connectivity verified
- [ ] Console logs reviewed
- [ ] Test results analyzed

## 🆘 Getting Help

If you encounter issues:

1. **Check the logs** - Use the debug panel or console
2. **Review test results** - Identify which component is failing
3. **Verify configuration** - Double-check all settings
4. **Test incrementally** - Run tests one by one to isolate issues
5. **Check documentation** - Refer to `N8N_INTEGRATION_SETUP.md`

## 🎉 Success Indicators

Your debate integration is working when:

- ✅ All tests pass
- ✅ Debate requests return responses
- ✅ History is stored and retrieved
- ✅ Audio responses play correctly
- ✅ Search functionality works
- ✅ Statistics are calculated

---

**Happy Debugging! 🐛✨**
