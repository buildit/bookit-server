data "template_file" "server_init" {
  template = "${file("${path.module}/init.tpl")}"
  vars {
    travis_key="${var.travis_key}}"
  }
}
