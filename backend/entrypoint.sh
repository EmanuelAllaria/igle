set -e

cd /var/www/html

if [ ! -f artisan ]; then
  echo "No se encontró artisan en /var/www/html"
  exit 1
fi

tries=30
until php artisan migrate --force; do
  tries=$((tries - 1))
  if [ "$tries" -le 0 ]; then
    echo "No se pudo ejecutar migrate (DB no disponible)"
    exit 1
  fi
  sleep 2
done

php artisan serve --host=0.0.0.0 --port=8000

