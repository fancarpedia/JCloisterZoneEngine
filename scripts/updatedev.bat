@Echo off

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set ldt=%%I
set builddate=%ldt:~0,4%-%ldt:~4,2%-%ldt:~6,2%

:: Check if parameter is provided
if "%~1"=="" (
    set version=dev
) else (
    set version=%~1
)

echo Build date: %builddate%
echo Version: %version%

call mvn package -Dengine.version=%1 -Dengine.builddate=%builddate%
if errorlevel 1 exit /b 1

call %~dp0\rundev
if errorlevel 1 exit /b 1
