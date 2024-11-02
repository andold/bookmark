@REM
@REM
@REM profile n100
@REM
SET PROFILE=n100
SET INSTALL_SCRIPT_FILE_NAME=install-%PROFILE%.bat
SET DEPLOY_SCRIPT_FILE_NAME=deploy.bat
SET SOURCE_DIR=C:\src\github\bookmark
SET DEPLOY_DIR=C:\deploy\bookmark
SET APACHE_TOMCAT=tomcat10
SET LC_ALL=ko_KR.UTF-8
@REM
@REM
@REM start
@REM
DATE /t
TIME /t
ECHO %PROFILE% %INSTALL_SCRIPT_FILE_NAME% %DEPLOY_SCRIPT_FILE_NAME% %SOURCE_DIR% %DEPLOY_DIR% %APACHE_TOMCAT%
@REM
@REM
@REM clean
@REM
CD %SOURCE_DIR%
git clean -f
@REM CALL gradlew.bat clean -Pprofile=%PROFILE% -x test
@REM
@REM
@REM react npm install
@REM
cd %SOURCE_DIR%\src\main\frontend
CALL npm install
CALL npm audit fix --force
CALL npm install react-scripts@latest --save
@REM
@REM
@REM build
@REM
CD %SOURCE_DIR%
CALL gradlew.bat build -Pprofile=%PROFILE% -x test
@REM
@REM
@REM stop tomcat
@REM
NET stop %APACHE_TOMCAT%
TIMEOUT 4
@REM
@REM
@REM build
@REM
CD  %DEPLOY_DIR%\doc_base
DEL  /F /S /Q * > nul
jar  -xf %SOURCE_DIR%\build\libs\bookmark-0.0.1-SNAPSHOT.war
@REM
@REM
@REM build
@REM
COPY /Y %SOURCE_DIR%\src\main\resources-%PROFILE%\%INSTALL_SCRIPT_FILE_NAME% %DEPLOY_DIR%
@REM
@REM
@REM start tomcat
@REM
NET  start %APACHE_TOMCAT%
@REM
@REM
@REM goto start directory
@REM
CD %DEPLOY_DIR%
