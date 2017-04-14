provider "aws" {
  region     = "${var.region}"
}

# We're using AMA Linux (see https://aws.amazon.com/amazon-linux-ami/)
variable default-linux-ami {
  type = "map"
  default = {
    us-east-1 = "ami-22ce4934"
  }
}
