@echo off
echo Starting..
:main
rem set up cmds and db
node dbInit.js
node deploy.js
rem run
node .
echo ..
echo Restarting..
goto main