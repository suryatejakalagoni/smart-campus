#!/usr/bin/env bash
set -o errexit

python manage.py migrate --no-input

# Seed demo data only if the User table is empty (first deploy)
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if User.objects.count() == 0:
    from django.core.management import call_command
    call_command('seed_demo', '--force')
    print('Seeded demo data')
else:
    print(f'DB already has {User.objects.count()} users, skipping seed')
"

exec gunicorn smartcampus.wsgi:application --log-file -
