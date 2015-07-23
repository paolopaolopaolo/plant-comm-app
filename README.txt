Author: Dean (Paolo) Mercado
Email: dpaolomercado@gmail.com
Rev.: 2015 July 23

About:
=====
This repository consists of a Full-Stack Web Application that implements
Django/Python on the backend, Backbone.js/jQuery on the frontend, and 
Apache + mod_wsgi for deployment.

About this ReadMe:
=================
This contains instructions for setting the site up on a new server.
The instructions are geared towards Linux machines, particularly in
the heavy use of package managers, as well as bash environment variables. 
These general procedures have been repeated on many a test server yet
are not exhaustive. They are also bound to change as I shop for better/faster/
stronger alternatives for deployment schemes.

Double curly-brackets ({{}}) indicate areas that must be substituted with 
other values and generally refer to things like private keys that I 
personally would have to furnish for you (since storing them in plain-text
is seppuku on steroids apparently). 

Command Line statements are prefaced with a greater-than ( > ) symbol that
may or may not have something before it (e.g. $>, (env-name)>, etc.). The 
exception to this is double greater-than symbol (>>) which indicates a block
of text that must be inserted in a file somewhere. 

Configuration of the Apache Daemon all happens in one of the last steps,
and involves knowing what values to choose for processes and threads, as well
as the Linux user. 

Instructions for Setting Up A New Server:
========================================

00: Install Package Manager version of Node.js

> curl --silent --location https://deb.nodesource.com/setup_0.12 | sudo bash -

01: Download the following programs using apt-get or yum
- gcc
- git
- apache2, apache2-dev, apache-mpm-prefork, 
  apache-mpm-worker, apache-mpm-event (look up pip modwsgi repository)
- mysql, mysql-dev
- libjpeg-dev
- python2.7, python-dev, pip, virtualenv
- nodejs

02: Download LESS with NPM

> npm install -g less

03: git clone the following repository

> git clone https://github.com/paolopaolopaolo/plant-comm-app.git

04: navigate to the parent directory of the cloned repository

> cd /PATH/TO/PARENT/OF/plant-comm-app

05: set up virtualenv 

> pip install virtualenv
> virtualenv env_name

06: activate env (can put this/nav-to-directory in .sh script)

> . ./env_name/bin/activate

07: navigate to repository

(env_name)> cd ./plant-comm-app

08: run pip to install all the required stuff

> pip install -R requirements.txt

09: setup mysql server (very involved)
  a) Make sure you have a database called 'gardening'
  b) Also you have a user that has all privileges granted on 'gardening'.'*'

10: setup os.environ

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

11: Migrate the database

> python manage.py migrate

12: Load the seed data

> python manage.py seed.json

13: Setup the Apache-Daemon

> python manage.py runmodwsgi --setup-only --user (non-root-user) / 
                              --group www-data  --port=80 --processes=1 /
			      --threads=15 --server-root=modwsgi/

14: Run Apache-Daemon

> sudo pkill apache2
> sudo modwsgi/apachectl start
