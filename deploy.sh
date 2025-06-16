#!/bin/bash
# Registry : mariemzribipfe.azurecr.io
# Username : mariemzribipfe
# Password : cze8uEMdvT0s8SdcrJtafvHLsNAqhS0ISbcOx+a/oK+ACRBMWYn9

docker build -t mariemzribipfe.azurecr.io/front .

docker tag front mariemzribipfe.azurecr.io/front
docker push mariemzribipfe.azurecr.io/front