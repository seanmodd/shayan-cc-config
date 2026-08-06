# cmux.schema.json

Vendored from the URL the generated `cmux.json` points at:

    https://raw.githubusercontent.com/manaflow-ai/cmux/main/web/data/cmux.schema.json

`test.js` validates every key and every enum value `/cmux` can write against this
file. It is here rather than under `api/` on purpose — nothing at runtime reads it,
so it stays out of the deployed function bundle.

Why it is vendored at all: the `indicatorStyle` enum shipped wrong once
(`typographic` instead of `typography`, plus a `none` that does not exist), and
`cmux config validate` does not catch that class of mistake — it checks JSONC
syntax only and exits 0 on unknown keys and out-of-enum values alike. The schema is
the only thing that does.

To refresh after a cmux update:

    curl -fsSL https://raw.githubusercontent.com/manaflow-ai/cmux/main/web/data/cmux.schema.json \
      -o test/fixtures/cmux.schema.json && node test.js
