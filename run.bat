@echo off
echo Starting..
:main
rem set up cmds
node deploy.js
rem run
node .
echo ..
echo Restarting..
goto main