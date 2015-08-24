#!/bin/bash

sed 's $PLANT_APP_PATH '$PLANT_APP_PATH' g' supervisord.conf.d/tornado0.conf.default > supervisord.conf.d/tornado0.conf
sed 's $PLANT_APP_PATH '$PLANT_APP_PATH' g' supervisord.conf.d/tornado1.conf.default > supervisord.conf.d/tornado1.conf
sed 's $PLANT_APP_PATH '$PLANT_APP_PATH' g' supervisord.conf.d/tornado2.conf.default > supervisord.conf.d/tornado2.conf
sed 's $PLANT_APP_PATH '$PLANT_APP_PATH' g' supervisord.conf.d/tornado3.conf.default > supervisord.conf.d/tornado3.conf

sed 's $PLANT_APP_PATH '$PLANT_APP_PATH' g' supervisord.conf.d/modwsgi.conf.default  > supervisord.conf.d/modwsgi.conf


