FROM php:8.2-fpm

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    git \
    unzip \
    libpq-dev \
    libzip-dev \
    libonig-dev \
    libxml2-dev \
    postgresql-client \
  && docker-php-ext-install \
    pdo \
    pdo_pgsql \
    pgsql \
    zip \
    mbstring \
    xml \
  && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

EXPOSE 8000
