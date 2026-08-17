echo "Starting.."
while true
do
    node deploy/dbInit.js
    node deploy/deploy.js

    node .
    echo ".."
    echo "Restarting.."
done