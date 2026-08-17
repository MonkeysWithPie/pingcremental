@echo off
echo Starting..
:main
rem set up cmds and db
node deploy/dbInit.js
node deploy/deploy.js
rem run
node .
echo ..
echo Restarting..
goto main