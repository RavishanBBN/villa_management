# Gmail App Password Setup Guide

## What is a Gmail App Password?

A Gmail App Password is a **16-character security code** that allows third-party applications (like your Villa Management System) to send emails through your Gmail account without using your actual password.

## Why You Need It

- Gmail requires 2-Factor Authentication for app access
- App passwords are more secure than using your real password
- Your application can send emails on your behalf

---

## Setup Instructions

### Step 1: Enable 2-Factor Authentication (2FA)

1. Open your web browser and go to: **https://myaccount.google.com/security**
2. Sign in to your Google Account if prompted
3. Look for **"2-Step Verification"** section
4. Click **"Get Started"** or **"Turn On"**
5. Follow the prompts:
   - Verify your phone number
   - Choose verification method (SMS or Authenticator app)
   - Complete the setup process

> **Note**: If 2FA is already enabled, you'll see it as "On" - you can skip to Step 2.

---

### Step 2: Generate App Password

1. Go back to: **https://myaccount.google.com/security**
2. Scroll down to **"2-Step Verification"** section
3. Click on **"2-Step Verification"** to expand it
4. Scroll to the bottom and click **"App passwords"**

   > **Can't find "App passwords"?**
   > - Make sure 2-Step Verification is fully enabled
   > - Try refreshing the page
   > - You might need to sign in again

5. You'll see the App Passwords page
6. Under "Select app", choose **"Mail"**
7. Under "Select device", choose **"Other (Custom name)"**
8. Type: **"Villa Management System"**
9. Click **"Generate"**

10. **IMPORTANT**: You'll see a yellow box with a 16-character password like:
    ```
    abcd efgh ijkl mnop
    ```
    **Copy this password immediately!** You won't be able to see it again.

---

### Step 3: Add Credentials to Your Backend

1. Open the file: `backend/.env` in your text editor

2. Find these lines:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   ```

3. Replace with your actual credentials:
   ```env
   EMAIL_USER=yourname@gmail.com
   EMAIL_PASSWORD=abcdefghijklmnop
   ```

   **Example**:
   ```env
   EMAIL_USER=halcyonrest@gmail.com
   EMAIL_PASSWORD=xmpl abcd efgh ijkl
   ```

4. **Save the file**

---

### Step 4: Test Email Functionality

1. **Start your backend server**:
   ```bash
   cd backend
   node src/server.js
   ```

2. **Start your frontend** (in a new terminal):
   ```bash
   cd frontend
   npm start
   ```

3. **Test sending an email**:
   - Login to your application
   - Create a booking/reservation
   - Check if confirmation email is sent
   - Or use the password reset feature

---

## Troubleshooting

### "Invalid credentials" or "Authentication failed"

**Solution**:
- Make sure you're using the **App Password**, NOT your regular Gmail password
- Remove any spaces from the app password (copy exactly as shown)
- Verify EMAIL_USER is your complete Gmail address

### "Less secure app access"

**Solution**:
- This message means 2FA is not enabled
- Go back to Step 1 and enable 2-Factor Authentication
- Then generate an App Password

### "App passwords" option not showing

**Solution**:
- Confirm 2-Step Verification is enabled and working
- Try accessing: **https://myaccount.google.com/apppasswords** directly
- Sign out and sign in again to your Google Account
- Some Google Workspace accounts may have this disabled by admin

### Emails not sending but no errors

**Solution**:
- Check your Gmail account's "Sent" folder
- Check the application logs for errors
- Verify the .env file is in the correct location (`backend/.env`)
- Restart the backend server after changing .env

---

## Security Best Practices

✅ **DO**:
- Keep your app password secret
- Use different app passwords for different applications
- Store the .env file securely (it's already in .gitignore)
- Revoke app passwords you're not using

❌ **DON'T**:
- Share your app password publicly
- Commit the .env file to GitHub
- Use your regular Gmail password in the application
- Reuse the same app password across multiple apps

---

## Revoking an App Password

If you need to revoke the password:

1. Go to: **https://myaccount.google.com/apppasswords**
2. Find "Villa Management System" in the list
3. Click the **trash/delete icon** next to it
4. Generate a new one if needed

---

## Alternative: Using Other Email Providers

If you prefer not to use Gmail, you can configure other providers:

### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

### Yahoo
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password
```

### Custom SMTP Server
```env
EMAIL_HOST=mail.yourdomain.com
EMAIL_PORT=587
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=your-password
```

---

## Quick Reference

- **Google Account Security**: https://myaccount.google.com/security
- **App Passwords Direct Link**: https://myaccount.google.com/apppasswords
- **File to Edit**: `backend/.env`
- **Variables Needed**: `EMAIL_USER` and `EMAIL_PASSWORD`

---

## Need Help?

If you're still having issues:

1. Check the backend console/logs for error messages
2. Verify all steps were followed correctly
3. Make sure the backend server was restarted after editing .env
4. Check that port 587 is not blocked by your firewall

---

## Summary Checklist

- [ ] Enable 2-Factor Authentication on Gmail
- [ ] Generate App Password for "Villa Management System"
- [ ] Copy the 16-character password
- [ ] Edit `backend/.env` file
- [ ] Add EMAIL_USER (your Gmail address)
- [ ] Add EMAIL_PASSWORD (the 16-character app password)
- [ ] Save the file
- [ ] Restart backend server
- [ ] Test email functionality

---

**Last Updated**: 2025-11-03
**Status**: Ready to Configure
