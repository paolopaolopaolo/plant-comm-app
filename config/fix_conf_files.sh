#!/bin/bash

sed 's $PLANT_APP_PATH '$PLANT_APP_PATH' g' supervisord.conf.d/tornado.conf.default > supervisord.conf.d/tornado.conf
sed 's $PLANT_APP_PATH '$PLANT_APP_PATH' g' supervisord.conf.d/uwsgi.conf.default  > supervisord.conf.d/uwsgi.conf


