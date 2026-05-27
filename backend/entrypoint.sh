set -e

cd /var/www/html

if [ ! -f artisan ]; then
  echo "No se encontró artisan en /var/www/html"
  exit 1
fi

if [ ! -f vendor/autoload.php ]; then
  if [ ! -f composer.json ]; then
    echo "No se encontró vendor/autoload.php y tampoco composer.json en /var/www/html"
    exit 1
  fi

  export COMPOSER_ALLOW_SUPERUSER=1

  if [ "${APP_ENV:-}" = "production" ] || [ "${APP_DEBUG:-}" = "false" ]; then
    composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader
  else
    composer install --no-interaction --prefer-dist
  fi
fi

tries=30
while true; do
  set +e
  migrate_output="$(php artisan migrate --force 2>&1)"
  migrate_status="$?"
  set -e

  if [ "$migrate_status" -eq 0 ]; then
    printf '%s\n' "$migrate_output"
    break
  fi

  printf '%s\n' "$migrate_output"

  if printf '%s\n' "$migrate_output" | grep -qiE "SQLSTATE\[(08006|08001)\]|could not (connect|translate host name)|connection refused|no route to host|server closed the connection unexpectedly"; then
    tries=$((tries - 1))
    if [ "$tries" -le 0 ]; then
      echo "No se pudo ejecutar migrate (DB no disponible)"
      exit 1
    fi
    sleep 2
    continue
  fi

  echo "No se pudo ejecutar migrate (error no relacionado a la conexión con la DB)"
  exit 1
done

php artisan serve --host=0.0.0.0 --port=8000
