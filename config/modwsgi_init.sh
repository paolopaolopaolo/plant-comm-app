
. ~/.bash_profile

. $PLANT_ENV_PATH/bin/activate
cd $PLANT_APP_PATH
python manage.py runmodwsgi --port=8000 --processes=2 --threads=15