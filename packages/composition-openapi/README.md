# Composition API openapi

This is internal library, used as part of [`@fishjam-cloud/js-server-sdk`](https://github.com/fishjam-cloud/js-server-sdk/tree/main/packages/js-server-sdk/)
## Generation

Regenerate with `yarn codegen path/to/openapi.json`, passing the path to the Composition API spec.

Generation runs with `modelPropertyNaming=camelCase`, unlike `fishjam-openapi`, because that spec is
snake_case while Fishjam's is camelCase. The generated serialisers map between the camelCase surface and the
snake_case wire format in both directions.

`openapi.sh` ends with a `sed` because the generator serialises the multipart JSON part of
`register_template_output` with `objectToJSON()`, a function it never emits. Verified present in 7.7.0, 7.14.0,
7.23.0 and 7.24.0. Drop the patch once a generator release emits the model serialiser there.

## License

Licensed under the [Apache License, Version 2.0](LICENSE)

## Fishjam is created by Software Mansion

Since 2012 [Software Mansion](https://swmansion.com) is a software agency with experience in building web and mobile apps. We are Core React Native Contributors and experts in dealing with all kinds of React Native issues. We can help you build your next dream product – [Hire us](https://swmansion.com/contact/projects?utm_source=fishjam&utm_medium=js-server-readme).

[![Software Mansion](https://logo.swmansion.com/logo?color=white&variant=desktop&width=200&tag=react-client)](https://swmansion.com/contact/projects?utm_source=fishjam&utm_medium=js-server-readme)
