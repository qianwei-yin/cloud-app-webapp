packer {
  required_plugins {
    googlecompute = {
      source  = "github.com/hashicorp/googlecompute"
      version = ">= 1.1.4, < 2.0.0"
    }
  }
}

source "googlecompute" "custom_image" {
  project_id              = var.project_id
  source_image_family     = var.source_image_family
  zone                    = var.zone
  disk_size               = var.custom_image_disk_size
  disk_type               = var.custom_image_disk_type
  image_family            = var.custom_image_family
  image_name              = "${var.custom_image_family}-{{timestamp}}"
  image_description       = var.custom_image_description
  image_storage_locations = var.custom_image_storage_locations
  ssh_username            = var.custom_image_ssh_username
}

build {
  sources = ["sources.googlecompute.custom_image"]

  # provisioner "shell" {
  #   script = "createNoLoginUser.sh"
  # }

  provisioner "shell" {
    script = "./sh/appDirSetup.sh"
  }

  provisioner "shell" {
    script = "./sh/serviceDirSetup.sh"
  }

  provisioner "shell" {
    script = "./sh/installNode.sh"
  }

  provisioner "shell" {
    script = "./sh/installPostgres.sh"
  }

  provisioner "file" {
    sources     = ["../index.js", "../package.json", "../package-lock.json"]
    destination = "/home/packer/myapp/"
  }

  provisioner "file" {
    content     = "POSTGRES_USERNAME=conway\nPOSTGRES_DATABASE=conway\nPOSTGRES_PASSWORD=123456"
    destination = "/home/packer/myapp/.env"
  }

  provisioner "shell" {
    script = "./sh/installNpmPackages.sh"
  }

  # provisioner "shell" {
  #   inline = [
  #     "ls -alF /home/packer/myapp"
  #   ]
  # }

  provisioner "file" {
    source      = "./systemd-services/webapp.service"
    destination = "/lib/systemd/system/webapp.service"
  }

  provisioner "shell" {
    script = "./sh/startService.sh"
  }
}