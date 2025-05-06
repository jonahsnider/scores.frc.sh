// https://atlasgo.io/faq/dotenv-files#write-an-hcl-expression-to-load-the-file-into-atlas
variable "envfile" {
  type    = string
  default = "../../.env"
}

locals {
  envfile = {
    for line in split("\n", file(var.envfile)) : split("=", line)[0] => regex("=\"(.*)\"", line)[0]
    if !startswith(line, "#") && length(split("=", line)) > 1
  }
}

data "external_schema" "sqlalchemy" {
  program = [
    "uvx",
    "--with", "sqlalchemy",
    "atlas-provider-sqlalchemy",
    "--path", "./app/models",
    "--dialect", "postgresql"
  ]
}

env "sqlalchemy" {
  src = data.external_schema.sqlalchemy.url
  dev = "docker://postgres/16/dev?search_path=public"
  url = local.envfile["DATABASE_URL"]
  migration {
    dir = "file://migrations"
  }
  format {
    migrate {
      diff = "{{ sql . \"  \" }}"
    }
  }
}
