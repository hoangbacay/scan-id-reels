@echo off
pushd "%~dp0" || exit /b 1
call npm run review
set "REVIEW_EXIT=%ERRORLEVEL%"
popd
exit /b %REVIEW_EXIT%
