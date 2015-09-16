Author: Dean (Paolo) Mercado
Email: dpaolomercado@gmail.com
Rev.: 2015 August 26

About:
=====
This repository consists of a Full-Stack Web Application that implements
Django/Python and Tornado on the backend, Backbone.js/jQuery on the 
frontend, and Nginx/Supervisor for deployment.

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


Instructions for Setting Up A New Server:
========================================

00: Install Package Manager version of Node.js

> curl --silent --location https://deb.nodesource.com/setup_0.12 | sudo bash -

01: Download the following programs using apt-get or yum
- gcc
- git
- mysql, mysql-dev
- libjpeg-dev
- python2.7, python-dev, pip, virtualenv
- nodejs
- nginx
- apache2, apache2-mpm-worker, apache2-threaded-dev (or httpd)

02: Download LESS with NPM

> npm install -g less

03: git clone the following repository

> git clone https://github.com/paolopaolopaolo/plant-comm-app.git

04: add the path of the new local repository to ~/.bash_profile

> sudo nano ~/.bash_profile
>> (INPUT THE FOLLOWING with the appropriate replacements)

export PLANT_APP_PATH={{path/to/local/repo}}

>> (THEN SAVE)

05: navigate to the parent directory of the cloned repository

> cd /PATH/TO/PARENT/OF/plant-comm-app

06: set up virtualenv 

> pip install virtualenv
> virtualenv env_name

07: add the path of virtualenv settings folder to ~/.bash_profile

> sudo nano ~/.bash_profile
>> (INPUT THE FOLLOWING with the appropriate replacements)

export PLANT_ENV_PATH={{path/to/env/dir}}

>> (THEN SAVE)

06: activate env (can put this/nav-to-directory in .sh script)

> . ./env_name/bin/activate

07: navigate to repository

(env_name)> cd ./plant-comm-app

08: run pip to install all the required stuff

> pip install -R requirements.txt

09: setup mysql server (very involved)
  a) Make sure you have a database called 'gardening'
  b) Also you have a user that has all privileges granted on 'gardening'.'*'

10: setup os.environ by editing ~/.bash_profile. IMPORTANT: source it after

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

13: Edit /etc/nginx/nginx.conf, changing the user to the desired 
    (non-root) user

14: Go to the /config directory in local repo

> cd /path/to/plant-comm-app/config

15: Copy default plantapp_nginx config

> cp plantapp_nginx.conf.default plantapp_nginx.conf

15: Edit the plantapp_nginx.conf file (uncomment 'Listen 80' and a few other things)

16: Symlink plantapp_nginx.conf to /etc/nginx/sites-enabled

> sudo ln -s /absolute/path/to/this/plantapp_nginx.conf /etc/nginx/sites-enabled

17: Restart nginx

> sudo /etc/init.d/nginx restart

18: Run fix_conf_files.sh (this replaces the supervisor program config with
the right path-related environment variables) VITAL: Run ". ~/.bash_profile"
if you havent already and check to make sure the paths loaded correctly
with the commands "echo $PLANT_APP_PATH" and "echo $PLANT_ENV_PATH".

> ./fix_conf_files.sh

19: Edit ./modwsgi_init.sh to call python manage.py runmodwsgi... with
the non-root server user and group. Use groupadd to create a group, if not done already

> groupadd www-data
> sudo nano ./modwsgi_init.sh
>> (EDIT THE FILE TO INCLUDE THE FOLLOWING)
python manage.py runmodwsgi --user {{user here}} --group www-data \
		--processes=2 --threads=15 --root=8000
...
>>(END EDITS)

20: Run supervisord using the supervisord.conf config file

> supervisord -c ./supervisord.conf

21: Site should be up and running!

22: If you get 502 Bad Gateway Error:
	- Go to ./config/supervisord.conf.d/log and look at the error and output files for clues! You might be missing a dependency.