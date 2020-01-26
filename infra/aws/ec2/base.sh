# OS
#sudo yum -y update
sudo yum -y install rpm-build yum-utils wget net-tools gcc glibc curl gcc-c++ make tcl openssl openssl-devel pcre-devel epel-release

# Node
curl -sL https://rpm.nodesource.com/setup_12.x | sudo bash -
sudo yum -y install nodejs
node -v

# Redis
sudo yum -y install redis
sudo sed -i "s/^# requirepass foobared/requirepass ${ZOMBI_CACHE_PASSWORD}/" /etc/redis.conf
sudo systemctl start redis
sudo systemctl enable redis
sudo systemctl status redis

# PostgeSQL
wget -P /tmp https://download.postgresql.org/pub/repos/yum/11/redhat/rhel-7.5-x86_64/pgdg-centos11-11-2.noarch.rpm
sudo yum -y install /tmp/pgdg-centos11-11-2.noarch.rpm
sudo yum -y install postgresql11 postgresql11-server postgresql11-contrib
sudo /usr/pgsql-11/bin/postgresql-11-setup initdb
sudo sed -i "s/ident/md5/" /var/lib/pgsql/11/data/pg_hba.conf
sudo systemctl start postgresql-11
sudo systemctl enable postgresql-11
sudo systemctl status postgresql-11
sudo -u postgres psql -c "CREATE USER ${ZOMBI_DB_USER} WITH PASSWORD '${ZOMBI_DB_PASS}';"
sudo -u postgres psql -c "CREATE DATABASE ${ZOMBI_DB_NAME} OWNER=${ZOMBI_DB_USER};"

# MySQL (MariaDB)
sudo yum -y install mariadb-server
sudo systemctl start mariadb
sudo systemctl enable mariadb
sudo systemctl status mariadb
sudo mysql -e "create database if not exists ${ZOMBI_DB_NAME}"
sudo mysql -e "create user '${ZOMBI_DB_USER}'@'localhost' identified by '${ZOMBI_DB_PASS}'"
sudo mysql -e "grant all privileges on ${ZOMBI_DB_NAME}.* to '${ZOMBI_DB_USER}'@'localhost'"

# PM2
sudo npm i -g pm2
