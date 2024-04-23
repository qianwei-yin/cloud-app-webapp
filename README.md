# Cloud Computing App's part - webapp

### I. Run Application In Cloud

Collaborate with other repositories.

1. `cd packer`
2. Create a `variables.auto.pkrvars.hcl` file, the variables you need to set are specified in the `variables.pkr.hcl`.
3. Run `packer build .` in `./packer`.

### II. Run Application In Virtual Machine By Itself

##### 1. Setup a droplet in Digital Ocean

1. Choose CentOS and Version 8
2. CPU - Regular and 1GB
3. Rename hostname

##### 2. Setup CentOS 8 Environment

1. set ssh shortcut in local@~/ssh/.config

   ```
   Host dovm
    HostName <ip>
    User root
    ForwardX11 yes
    IdentityFile ~/.ssh/id_rsa
   ```

2. `ssh dovm`

3. set alias

   ```
   vi .bashrc

   alias ll='ls -alF'

   source .bashrc
   ```

4. Copy app folder

   ```
   mkdir dev
   scp </path/to/downloaded/zip> dovm:~/dev

   yum install unzip
   unzip <zip>
   ```

5. install nodejs

   ```
    cd
    sudo dnf module list nodejs  # check if ver.18 is available
    sudo dnf module enable nodejs:18
    sudo dnf install nodejs
    npm version  # check nodejs and npm version
   ```

6. install postgres

   ```
   dnf module list postgresql  # check if ver.16 is available
   sudo dnf module enable postgresql:16
   sudo dnf install postgresql-server

   sudo postgresql-setup --initdb
   sudo systemctl start postgresql
   sudo systemctl enable postgresql

   sudo -u postgres createuser --interactive
   # This will enter the postgres command line tool.
   # Type your preferred name
   sudo -u postgres createdb <DB_NAME>

   sudo adduser <DB_USER_NAME>
   # Add a user for the server.
   # Because it needs a user of this server to have the same name
   # as the db username.
   # So create a user whose name is the same as a user name in DB.

   sudo -u <DB_USER_NAME> psql
   # This will enter the postgres command line tool.
   \password
   # This allows you to type a password

   cd /
   find / -name pg_hba.conf
   vi /path/to/pg_hba.conf
   # change METHOD to xxx, md5, md5, xxx, xxx, xxx

   sudo systemctl status postgresql
   sudo systemctl restart postgresql
   sudo systemctl status postgresql
   ```

7. Install Git

   ```
   sudo dnf update -y  # Not sure if this line is required
   sudo dnf install git -y
   git --version
   git config --global user.name <YOUR_NAME>
   git config --global user.email <YOUR_EMAIL>

   # ssh
   ssh-keygen -t ed25519 -C <YOUR_EMAIL>
   eval "$(ssh-agent -s)"  # print "Agent pid xxxxxx"
   vi /path/to/ssh/config/file
         Host github.com
           IgnoreUnknown UseKeychain
           AddKeysToAgent yes
           UseKeychain yes
           IdentityFile /root/.ssh/id_ed25519
   cat /root/.ssh/id_ed25519.pub
   # Go to Github and add ssh public key

   git pull upstream main  # To check if ssh connection is okay
   ```

###### Extra: If need to test Github actions failure

Add these to the yaml file

```
      - name: Try to fail
        run: exit 1

      - name: Print message if it doesn't fail
        run: echo Should not see this message
```

### III. Run Application Locally

1. Create a `.env` file. The variables you need to provide are specified in the `.example.env` file.
2. `npm install`
3. `npm start`
