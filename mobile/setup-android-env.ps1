# Set environment variables for React Native Android development
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.16.8-hotspot"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\emulator;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\tools;$env:ANDROID_HOME\tools\bin;$env:PATH"

Write-Host "✅ Environment variables set!" -ForegroundColor Green
Write-Host ""
Write-Host "JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Cyan
Write-Host "ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Cyan
Write-Host ""
Write-Host "Testing Java installation..." -ForegroundColor Yellow
java -version
Write-Host ""
Write-Host "Now you can run:" -ForegroundColor Green
Write-Host "  cd C:\Users\USER\Desktop\villa-management-system\mobile" -ForegroundColor White
Write-Host "  npm run android" -ForegroundColor White
Write-Host ""
Write-Host "Make sure your phone is connected with USB debugging enabled!" -ForegroundColor Yellow
