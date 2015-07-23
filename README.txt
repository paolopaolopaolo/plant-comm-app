INSTRUCTIONS FOR SETTING UP A NEW SERVER FOR THIS PLANT_APP:

0: Download the following programs using apt-get or yum
- gcc
- git
- apache2, apache2-dev, apache-mpm-prefork, 
  apache-mpm-worker, apache-mpm-event (look up pip modwsgi repository)
- mysql, mysql-dev
- libjpeg-dev
- python2.7, python-dev, pip, virtualenv

1: git clone the following repository

> git clone https://github.com/paolopaolopaolo/plant-comm-app.git

2: navigate to the parent directory of the cloned repository

> cd /PATH/TO/PARENT/OF/plant-comm-app

3: set up virtualenv 

> pip install virtualenv
> virtualenv env_name

4: activate env (can put this/nav-to-directory in .sh script)

> . ./env_name/bin/activate

5: navigate to repository

> cd ./plant-comm-app

6: run pip to install all the required stuff

> pip install -R requirements.txt

7: setup mysql server (very involved)
  a) Make sure you have a database called 'gardening'
  b) Also you have a user that has all privileges granted on 'gardening'.'*'

8: setup os.environ

> sudo nano ~/.bash_profile
>> (INPUT THE FOLLOWING with the appropriate replacements)

export ZAP='{{ZIPCODE_API_KEY}}'
export SK='{{DJANGO_APP_KEY}}'

export AWS_ACCESS_KEY_ID='{{ACCESS_KEY_ID}}'
export AWS_SECRET_ACCESS_KEY='{{SECRET_ACCESS_KEY}}'
export AWS_STORAGE_BUCKET_NAME='{{STORAGE_BUCKET_NAME}}'

export DB_NAME='gardening'
export DB_USER='{{MYSQL_USER_YOU_CAME_UP_WITH_EARLIER}}'

export DB_PW='{{MYSQL_PW_YOU_CAME_UP_WITH_EARLIER}}'
export DB_HOST='127.0.0.1'
export DB_PORT='3306'

>> (THEN SAVE)

> . ~/.bash_profile

9: Migrate the database

> python manage.py migrate

10: Load the seed data

> python manage.py seed.json

11: Setup the Apache-Daemon

> python manage.py runmodwsgi --setup-only --user (non-root-user) / 
                              --group www-data  --port=80 --processes=1 /
			      --threads=15 --server-root=modwsgi/

12: Run Apache-Daemon

> sudo pkill apache2
> sudo modwsgi/apachectl start
