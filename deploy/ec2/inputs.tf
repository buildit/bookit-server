variable linux-ami {
  default = ""
  description = "custom linux ami to use"
}
variable route53-zone-id {
  description = "Route53 parent zone name"
}
variable keypair {
  description = "EC2 Keypair to access tehe box"
}
variable "region" {
}

variable "travis_key" {
  descriptin = "Travis Public Key"
}
