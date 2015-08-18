#!/bin/bash

. ~/.bash_profile
. $PLANT_ENV_PATH/bin/activate
cd $PLANT_APP_PATH
uwsgi --socket :8001 --module plant_app.wsgi --chmod-socket=664
