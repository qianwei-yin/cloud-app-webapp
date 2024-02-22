variable "project_id" {
  type    = string
  default = "default"
}

variable "zone" {
  type    = string
  default = "default"
}

variable "source_image_family" {
  type    = string
  default = "default"
}

variable "custom_image_disk_size" {
  type    = number
  default = 0
}

variable "custom_image_disk_type" {
  type    = string
  default = "default"
}

variable "custom_image_description" {
  type    = string
  default = "default"
}

variable "custom_image_family" {
  type    = string
  default = "default"
}

variable "custom_image_storage_locations" {
  type    = list(string)
  default = ["default"]
}

variable "custom_image_ssh_username" {
  type    = string
  default = "default"
}