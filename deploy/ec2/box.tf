resource "aws_instance" "server" {
  ami = "${coalesce(var.linux-ami, lookup(var.default-linux-ami, var.region))}"
  instance_type = "t2.micro"
  key_name = "${var.keypair}"
  associate_public_ip_address = true
  vpc_security_group_ids = ["${aws_security_group.default.id}"]
  user_data = "${data.template_file.server_init.rendered}"
  tags {
    Name = "bookit"
    Role = "docker-server"
  }
}

resource "aws_route53_record" "server" {
  zone_id = "${var.route53-zone-id}"
  name = "bookit"
  type = "CNAME"
  ttl = "60"

  records = [
    "${aws_instance.server.public_dns}"]
}

resource "aws_security_group" "default" {
  name = "bookit-default"
  description = "bookit-default"
  ingress {
    from_port = 22
    to_port = 22
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port = 80
    to_port = 80
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port = 8888
    to_port = 8888
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags {
    Name = "bookit"
    Role = "docker-server"
  }
}
