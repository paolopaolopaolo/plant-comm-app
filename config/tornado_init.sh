#!/bin/bash

. ~/.bash_profile
. $PLANT_ENV_PATH/bin/activate
cd $PLANT_APP_PATH
python ./plant_app/tornado_app.py
