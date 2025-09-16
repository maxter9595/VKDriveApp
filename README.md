# 🖼️ VKDriveApp - резервное копирование изображений из VK в Яндекс.Диск

<img src="./demo/1-intro/1.gif" width="100%">

## 1. API Документация

### Основные эндпоинты

#### Аутентификация

| Метод | Путь                   | Описание                                                |
|-------|------------------------|---------------------------------------------------------|
| POST  | `/api/auth/register/`  | Регистрация нового пользователя                         |
| POST  | `/api/auth/login/`     | Вход пользователя                                       |
| POST  | `/api/auth/logout/`    | Выход пользователя                                      |
| GET   | `/api/auth/me/`        | Получение информации о текущем пользователе             |
| POST  | `/api/auth/tokens/`    | Сохранение токенов VK и Yandex                          |
| GET   | `/api/auth/tokens/`    | Получение сохраненных токенов                           |

#### Управление пользователями (только для админов)

| Метод  | Путь                              | Описание                                    |
|--------|-----------------------------------|---------------------------------------------|
| GET    | `/api/users/`                     | Получение списка пользователей              |
| POST   | `/api/users/`                     | Создание нового пользователя (админом)      |
| PUT    | `/api/users/:id/role/`            | Изменение роли пользователя                 |
| PUT    | `/api/users/:id/active/`          | Изменение статуса активности пользователя   |
| GET    | `/api/users/:id/sessions/`        | Получение сессий пользователя               |
| DELETE | `/api/users/sessions/:sessionId/` | Удаление сессии пользователя                |
| PUT    | `/api/users/:id/password/`        | Смена пароля пользователя                   |

#### Системные эндпоинты

| Метод  | Путь                              | Описание                                    |
|--------|-----------------------------------|---------------------------------------------|
| GET    | `/api/health/`                    | Проверка статуса сервера                    |

### Лимиты API и прочие ограничения

#### Общие ограничения

- **Размер тела запроса**: стандартные ограничения Express (~100kb)
- **Частота запросов**: нет встроенного rate limiting, но можно добавить через middleware
- **Токены JWT**: срок действия 7 дней
- **Сессии**: автоматическая очистка просроченных сессий

#### Зависимость от внешних API

- **ВКонтакте API**: работоспособность приложения зависит от стабильности и доступности VK API. Любые изменения в API ВКонтакте могут нарушить функциональность получения фотографий.
- **Яндекс.Диск API**: приложение зависит от API Яндекс.Диска для загрузки и управления файлами. Изменения в API Яндекс могут повлиять на работу загрузки файлов.
- **Токены доступа**: для работы требуются действительные токены доступа к обоим сервисам, которые имеют ограниченный срок действия и могут быть отозваны.

#### Ограничения API

- **Квоты запросов**: оба API имеют ограничения на количество запросов в единицу времени.
- **Размер файлов**: Яндекс.Диск может иметь ограничения на размер загружаемых файлов.
- **Типы файлов**: Поддерживаются только изображения (JPEG, PNG).
- **Приватные аккаунты ВК**: в случае если пользователь с приватным аккаунтом не добавлен в друзья, изображения не могут быть получены через API ВКонтакте.

#### Безопасность

- **Хранение токенов**: токены хранятся в зашифрованном виде, но безопасность зависит от надежности ключа шифрования.
- **Данные пользователей**: приложение обрабатывает персональные данные пользователей, что требует соблюдения законодательства о защите данных.

#### Производительность и совместимость

- **Большие объемы данных**: загрузка большого количества изображений может привести к замедлению работы интерфейса.
- **Сетевая задержка**: скорость работы зависит от качества интернет-соединения пользователя.
- **Браузеры**: приложение может иметь ограниченную поддержку в устаревших браузерах.

## 2. Особенности работы приложения

### 2.1. Регистрация и вход в приложение

- Выбор раздела "Регистрация" и регистрация. После регистрации пользователь перейдет в приложение
- Вход по логину и паролю через раздел "Вход"
- ```users``` - таблица из БД, фиксирующая пользователей и админов
- ```sessions``` - таблица, отвечающая за пользовательские сессии

<img src="./demo/2-functionality/1.gif" width="100%">

### 2.2. Работа с резеврным копированием изображений

- Ввод токенов для работы с API ВКонтакте и Яндекс.Диска
- Вывод изображений доступного пользователя ВК по его ID. По возможности можно добавить или использовать в качестве замены фотографии другого пользователя социальной сети
- Предпросмотр фотографий после двойного клика на него
- Выбор фотографий для отправки в хранилище Яндекс.Диска. Фотографии сохраняются в папке ```VKDrive```
- Просмотр текущих фотографий в папке ```VKDrive```

<img src="./demo/2-functionality/2.gif" width="100%">

### 2.3. Работа с панелью администратора

- Cоздание нового админа и изменение администратором собственного пароля
- Деактивация обычного пользователя и смена его пароля
- Фильтрация всех пользователей по конкретным критериям: ID, email, имя, фамилия, роль, статус
- Вместе с админ-панелью администраторы могут пользоваться резервным копированием изображений

<img src="./demo/2-functionality/3.gif" width="100%">

## 3. Инструкция по получению токенов ВК и Яндекс.Диска

### 3.1. Получение токена пользователя ВК

#### 3.1.1. Вход в приложение и разрешение прав

- Сайт [https://vkhost.github.io/](https://vkhost.github.io/) → Приложение ```VK Admin```. После выбора приложения соглашаемся со всеми разрешениями (кнопка ```Разрешить```)
- При желании вместо ```VK Admin``` можно использовать собственное приложение для получения токена: [https://id.vk.com/about/business/go/docs/ru/vkid/latest/vk-id/connection/tokens/access-token](https://id.vk.com/about/business/go/docs/ru/vkid/latest/vk-id/connection/tokens/access-token)

<img src="./demo/3-tokens/1-1.png" width="100%">

<img src="./demo/3-tokens/1-2.png" width="100%">

#### 3.1.2. Копируем токен пользователя ВК

* Копируем часть адресной строки от ```access_token=``` до ```&expires_in```

<img src="./demo/3-tokens/1-3.png" width="100%">

* Созданный ключ - значение поля ```Токен VK```

<img src="./demo/3-tokens/1-4.png" width="100%">


### 3.2. Получение токена пользователя Яндекс.Диск

* Сайт [https://yandex.ru/dev/disk/poligon](https://yandex.ru/dev/disk/poligon) → Кнопка ```Получить OAuth-токен```

<img src="./demo/3-tokens/2-1.png" width="100%">

* Созданный ключ - значение поля ```Токен Яндекс.Диска```

<img src="./demo/3-tokens/2-2.png" width="100%">

## 4. Инструкция по локальному запуску проекта

### 4.1. Клонирование репозитория

- Клонирование репозитория:

```bash
git clone https://github.com/maxter9595/VKDriveApp.git
cd VKDriveApp
```

<img src="./demo/4-local-setup/1.gif" width="100%">

### 4.2. Настройка переменных окружения и SQL-скрипта для создания первых пользователей

* Копирование содержимого ```env_example``` в ```env```:

```bash
bash -c "cp .env_example .env"
```

* Копирование содержимого ```init-users.sql.example``` в ```init-users.sql```:

```bash
bash -c "cp backend/sql/init-users.sql.example backend/sql/init-users.sql"
```

<img src="./demo/4-local-setup/2.gif" width="100%">

### 4.3. Задание паролей для первых пользователей

```bash
npm install
npm run update-passwords -- Admin123! TestUser123!
```

```
# Первый администратор
Почта: admin@vkdrive.local
Пароль: Admin123! 

# Тестовый пользователь
Почта: test.user@vkdrive.local
Пароль: TestUser123!
```

<img src="./demo/4-local-setup/3.gif" width="100%">

### 4.4. Тестирование и сборка

* Тестирование и сборка проекта:

```bash
npm run test:unit
npm run build
```

<img src="./demo/4-local-setup/4.gif" width="100%">

### 4.5. Запуск Docker

* Запуск Docker Desktop. Его наличие необходимо для запуска Docker-контейнеров

* Сборка и запуск Docker:

```bash
docker compose build
docker compose up -d
docker compose ps
```

<img src="./demo/4-local-setup/5.gif" width="100%">

### 4.6. Открытие приложения

* Ссылка для открытия приложения: [http://localhost/](http://localhost/)

* Проверка работы бэкенда приложения: [http://localhost:20000/api/health](http://localhost:20000/api/health)

```
# Первый администратор
Почта: admin@vkdrive.local
Пароль: Admin123! 

# Тестовый пользователь
Почта: test.user@vkdrive.local
Пароль: TestUser123!
```

* Панель администратора БД (Adminer): [http://localhost:8080/](http://localhost:8080/)

```
# Параметры входа в Adminer
System: MySQL
Server: mysql
Username: root
Password: mysql
Database: vkdrive
```

<img src="./demo/4-local-setup/6.gif" width="100%">

## 5. Инструкция по деплою проекта на сервере

### 5.1. Покупка сервера и подключение к нему

* Рег.RU - Облачный сервер с предустановленным Docker: [https://www.reg.ru/cloud/docker](https://www.reg.ru/cloud/docker)

* Пример IP-адреса и информация о сервере для покупки:

```
- IP-адрес: 193.227.241.210
- Предустановленный Docker: да 
- Образ: Ubuntu
- Тарифы и конфигурации: производительный
- Тариф: HP C2-M2-D40
- Регион размещения: Москва
- Плавающий (публичный) IP-адрес: да
- Резервное копирование: да
```

* Вход на сервер после его приобретения:

```bash
ssh root@193.227.241.210
```

<img src="./demo/5-server-deploy/1.gif" width="100%">

### 5.2. Подготовка сервера для деплоя

* Создание пользователя и добавление его в группу sudo:

```bash
adduser myuser && usermod -aG sudo myuser
```

* Установка зависимостей:

```bash
apt update && apt upgrade -y && apt install -y git nginx ufw
```

* Настройка firewall:

```bash
sudo ufw allow 20000 && sudo ufw allow 10000 && sudo ufw allow 8080 && sudo ufw allow 22 && ufw allow 80 && sudo ufw --force enable
```

* Запуск Docker, добавление пользователя в группу docker и его переподключение на сервер для утверждения прав:

```bash
# На выбранном сервере Docker уже предустановлен
systemctl enable docker && systemctl start docker && usermod -aG docker myuser && exit
```

```bash
# Вход по паролю, заданному пользователю через adduser myuser
ssh myuser@193.227.241.210
```

<img src="./demo/5-server-deploy/2.gif" width="100%">

### 5.3. Клонирование репозитория и подготовка файлов

* Клонирование репозитория:

```bash
git clone https://github.com/maxter9595/VKDriveApp.git && cd VKDriveApp
```

* Сохранение IP сервера в переменную ```SERVER_IP```:

```bash
SERVER_IP=$(curl -s --max-time 3 ifconfig.me || curl -s --max-time 3 ifconfig.co || hostname -I | awk '{print $1}' | head -n1)
```

```bash
echo "Server IP: $SERVER_IP"
```

* Создаем файлы для работы с проектом:

```bash
cp .env_example_server .env && sed "s/your-server-ip/$SERVER_IP/g" .env_example_server > .env
```

```bash
cp backend/sql/init-users.sql.example backend/sql/init-users.sql
```

<img src="./demo/5-server-deploy/3.gif" width="100%">

### 5.4. Установка паролей, тестирование функционала и сборка проекта

* Установка node.js:

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs
```

* Установка зависимостей и задание паролей для пользователей:

```bash
npm install && npm run update-passwords -- Admin123! TestUser123!
```

```
# Первый администратор
Почта: admin@vkdrive.local
Пароль: Admin123! 

# Тестовый пользователь
Почта: test.user@vkdrive.local
Пароль: TestUser123!
```

* Запуск тестов и сборка проекта:

```bash
npm run test:unit && npm run build && cd ~/VKDriveApp
```

<img src="./demo/5-server-deploy/4.gif" width="100%">

### 5.5. Запуск Docker

* Остановка системного Nginx:

```bash
sudo netstat -tulpn | grep :80
sudo systemctl stop nginx && sudo systemctl disable nginx
```

* Запуск Docker со своими Nginx конфигурациями:

```bash
docker compose build && docker compose up -d
sudo netstat -tulpn | grep :80
```

<img src="./demo/5-server-deploy/5.gif" width="100%">

### 5.6. Открытие приложения

* Ссылка для открытия приложения: [http://193.227.241.210/](http://193.227.241.210/)

* Проверка работы бэкенда приложения: [http://193.227.241.210:20000/api/health](http://193.227.241.210:20000/api/health)

```
# Первый администратор
Почта: admin@vkdrive.local
Пароль: Admin123! 

# Тестовый пользователь
Почта: test.user@vkdrive.local
Пароль: TestUser123!
```

* Панель администратора БД (Adminer): [http://193.227.241.210:8080/](http://193.227.241.210:8080/)

```
# Параметры входа в Adminer
System: MySQL
Server: mysql
Username: root
Password: mysql
Database: vkdrive
```

<img src="./demo/5-server-deploy/6.gif" width="100%">

## 6. Настройка автодеплоя проекта (CI/CD)

### 6.1. Покупка сервера и подключение к нему

* Генерация SSH-ключа на локальном ПК:

```bash
ssh-keygen -t ed25519 -C "max.t95@bk.ru"
```

* Вывод SSH-ключа из локального ПК для копирования:

```bash
type $env:USERPROFILE\.ssh\id_ed25519.pub
```

```bash
# Копируем SSH-ключ
ssh-ed25519 AAAA...MZ max.t95@bk.ru
```

<img src="./demo/6-ci-cd/1.png" width="100%">

### 6.2. Генерация SSH-ключа на сервере

* Генерация SSH-ключа на сервере:

```bash
ssh-keygen -t ed25519 -C "max.t95@bk.ru"
```

* Вывод SSH-ключа из сервера для просмотра:

```bash
ssh-keygen -y -f ~/.ssh/id_ed25519
```

```bash
# SSH-ключ из сервера понадобится для удаленного подключения к GitHub
ssh-ed25519 AAAA...sk max.t95@bk.ru
```

<img src="./demo/6-ci-cd/2.png" width="100%">

### 6.3. Добавление SSH-ключей из локального ПК и сервера в список авторизованных ключей сервера

* Ввод SSH-ключа из сервера в список авторизированных ключей:

```bash
ssh-keygen -y -f ~/.ssh/id_ed25519 >> ~/.ssh/authorized_keys
```

* Ввод SSH-ключа из локального ПК в список авторизированных ключей:

```bash
echo "ssh-ed25519 AAAA...MZ max.t95@bk.ru" >> ~/.ssh/authorized_keys
```

* Просмотр списка авторизированных ключей:

```bash
cat ~/.ssh/authorized_keys
```

```bash
# В результате должно быть два SSH-ключа в списке авторизованных ключей
ssh-ed25519 AAAA...sk max.t95@bk.ru
ssh-ed25519 AAAA...MZ max.t95@bk.ru
```

<img src="./demo/6-ci-cd/3.png" width="100%">

### 6.4. Настройка sudo без пароля для CI/CD

* Настройка прав для authorized_keys:

```bash
chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh
```

* Вход в visudo и добавление параметров для обхода паролей пользователя:  

```bash
sudo visudo
```

```bash
# Добавляем в конце файла следующее:
myuser ALL=(ALL) NOPASSWD: ALL
```

* Выход из сервера и проверка входа на сервер без пароля:

```bash
exit
ssh myuser@193.227.241.210
# Если всё ок — войдём без пароля
```

<img src="./demo/6-ci-cd/4.gif" width="100%">

### 6.5. Привязка SSH-ключа к GitHub

* Вывод публичного SSH-ключа для интеграции с GitHub:

```bash
cat ~/.ssh/id_ed25519.pub
```


```bash
# Копируем все, что будет выведено
ssh-ed25519 AAAA...sk max.t95@bk.ru
```

* Привязка публичного ключа к GitHub:

   * ```Сайт GitHub``` → ```Settings``` → ```SSH and GPG keys``` → ```New SSH key```. Заполняем параметры SHH-ключа:

     * Тип ключа: ```Authentication Key``` 
  
     * Имя ключа: ```VM-server```

     * В поле ```Key``` добавляем содержимое SSH-ключа. Пример - ```ssh-ed25519 AAAA...sk max.t95@bk.ru```

  * После добавления параметров SSH-ключа нажимаем ```Add SSH key```

<img src="./demo/6-ci-cd/5.png" width="100%">

### 6.6. Настройка файла SSH-конфигурации. Проверка подключения к GitHub

* Внесение GitHub в список известных хостов сервера:

```bash
ssh-keyscan -H github.com >> ~/.ssh/known_hosts
```

* Настройка конфигурации для SSH:

```bash
nano ~/.ssh/config
```

```
----- ~/.ssh/config -----
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519
----- ~/.ssh/config -----
```

* Установка прав для файла SSH-конфигурации:

```bash
chmod 600 ~/.ssh/config
```

* Проверка взаимодействия с GitHub:

```bash
ssh -T git@github.com
# Если всё ок — увидим следующее сообщение:
# Hi <логин>! You've successfully authenticated ...
```

<img src="./demo/6-ci-cd/6.gif" width="100%">


### 6.7. Установка значений secret-параметров GitHub-репозитория для автодеплоя

* Ввод команды на сервере для получения ```SSH_PRIVATE_KEY```:

```bash
cat ~/.ssh/id_ed25519
```

```bash
# Копируем все вместе с комментариями BEGIN и END
-----BEGIN OPENSSH PRIVATE KEY----- 
b3...nU= 
-----END OPENSSH PRIVATE KEY-----
```

* Ввод secrets для автодеплоя GitHub-репозитория:

  * SSH_HOST: ```193.227.241.210``` (или другой IP-адрес сервера)

  * SSH_USER: ```myuser```

  * SSH_PRIVATE_KEY: результат команды ```cat ~/.ssh/id_ed25519``` на сервере

<img src="./demo/6-ci-cd/7-1.png" width="100%">

* После установки secrets проверяем функционал автодеплоя

<img src="./demo/6-ci-cd/7-2.gif" width="100%">
