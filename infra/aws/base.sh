# OS
#sudo yum -y update
sudo yum -y install rpm-build yum-utils wget net-tools gcc glibc curl gcc-c++ make tcl openssl openssl-devel pcre-devel epel-release

# Node
curl -sL https://rpm.nodesource.com/setup_12.x | sudo bash -
sudo yum -y install nodejs
node -v

# Redis
sudo yum -y install redis
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
sudo npm i -g pm2
