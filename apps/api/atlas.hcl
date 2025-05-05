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
  migration {
    dir = "file://migrations"
  }
  format {
    migrate {
      diff = "{{ sql . \"  \" }}"
    }
  }
}
