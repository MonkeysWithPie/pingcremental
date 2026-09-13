echo "Starting.."
while true
do
    node dbInit.js
    node deploy.js

    node .
    echo ".."
    echo "Restarting.."
done