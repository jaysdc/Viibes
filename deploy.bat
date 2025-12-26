@echo off
cd /d "%~dp0"
echo Building app...
call npm run build
echo Deploying to Firebase...
call firebase deploy
echo Done!
pause
