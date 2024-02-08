# webapp

### Run Application Locally

### Run Application In Server

##### 1. Setup CentOS 8 Environment

1. set ssh shortcut in local@~/ssh/.config
   ```
   Host docsye
    HostName <ip>
    User root
    ForwardX11 yes
    IdentityFile /Users/conway/.ssh/id_rsa
   ```
2. `ssh docsye`
3. set alias
   ```
   vi .bashrc
   alias ll='ls -alF'
   ```
4. `mkdir dev`
5. `scp </path/to/downloaded/zip> docsye:~/dev`
6. `yum install unzip`
7. `unzip <zip>`
8. install nodejs
   ```
    cd
    sudo dnf module list nodejs  # check if ver.18 is available
    sudo dnf module enable nodejs:18
    sudo dnf install nodejs
    npm version  # check nodejs and npm version
   ```
9. install postgres

   ```
   dnf module list postgresql  # check if ver.16 is available
   sudo dnf module enable postgresql:16
   sudo dnf install postgresql-server

   sudo postgresql-setup --initdb
   sudo systemctl start postgresql
   sudo systemctl enable postgresql

   sudo -u postgres createuser --interactive  # conway
   sudo -u postgres createdb conway

   sudo adduser conway  # need a user of this server to have the same name as the db username
   sudo -u conway psql
   conway=# \password  # 123456

   cd /
   find / -name pg_hba.conf
   vi /path/to/pg_hba.conf
   # use G to go to the bottom of the file
   # change METHOD to trust, md5, md5, trust, trust, trust
   sudo systemctl status postgresql
   sudo systemctl restart postgresql
   sudo systemctl status postgresql
   ```
