@echo off
echo ========================================
echo SSGhub Mail - Fix React Apps
echo ========================================

echo Creating basic React package.json files...

echo Creating Admin Portal package.json...
cd ../admin-portal
(
echo {
echo   "name": "ssghub-admin-portal",
echo   "version": "1.0.0",
echo   "private": true,
echo   "dependencies": {
echo     "react": "^18.2.0",
echo     "react-dom": "^18.2.0",
echo     "react-scripts": "5.0.1",
echo     "@mui/material": "^5.14.0",
echo     "@mui/icons-material": "^5.14.0",
echo     "react-router-dom": "^6.8.0"
echo   },
echo   "scripts": {
echo     "start": "react-scripts start",
echo     "build": "react-scripts build"
echo   },
echo   "browserslist": {
echo     "production": [
echo       "^>0.2%%",
echo       "not dead",
echo       "not op_mini all"
echo     ],
echo     "development": [
echo       "last 1 chrome version",
echo       "last 1 firefox version",
echo       "last 1 safari version"
echo     ]
echo   }
echo }
) > package.json

echo.
echo Creating Webmail Client package.json...
cd ../webmail-client
(
echo {
echo   "name": "ssghub-webmail-client",
echo   "version": "1.0.0",
echo   "private": true,
echo   "dependencies": {
echo     "react": "^18.2.0",
echo     "react-dom": "^18.2.0",
echo     "react-scripts": "5.0.1",
echo     "@mui/material": "^5.14.0",
echo     "@mui/icons-material": "^5.14.0",
echo     "react-router-dom": "^6.8.0",
echo     "i18next": "^23.0.0",
echo     "react-i18next": "^13.0.0"
echo   },
echo   "scripts": {
echo     "start": "react-scripts start",
echo     "build": "react-scripts build"
echo   },
echo   "browserslist": {
echo     "production": [
echo       "^>0.2%%",
echo       "not dead",
echo       "not op_mini all"
echo     ],
echo     "development": [
echo       "last 1 chrome version",
echo       "last 1 firefox version",
echo       "last 1 safari version"
echo     ]
echo   }
echo }
) > package.json

cd ../testing
echo.
echo ✅ React app package.json files created!
echo Now run: npm install in both directories
pause