<img src="../../.github/images/fishjam-card.png" width="100%">

# @fishjam-cloud/composition-cli

CLI for scaffolding and building [Fishjam](https://fishjam.io) composition templates.

## Usage

Scaffold a new template project:

```bash
npx @fishjam-cloud/composition-cli init my-template
cd my-template
npm install
```

Build the template into an uploadable bundle:

```bash
npm run build
```

Edit `src/App.tsx` to define your composition layout, then run the build again. The bundle is written to `dist/App.js` — upload it as the `template` field when registering a composition output.

## License

Licensed under the [Apache License, Version 2.0](./LICENSE).

## Fishjam is created by Software Mansion

Since 2012 [Software Mansion](https://swmansion.com) is a software agency with experience in building web and mobile apps. We are Core React Native Contributors and experts in dealing with all kinds of React Native issues. We can help you build your next dream product – [Hire us](https://swmansion.com/contact/projects?utm_source=fishjam&utm_medium=js-server-readme).

[![Software Mansion](https://logo.swmansion.com/logo?color=white&variant=desktop&width=200&tag=react-client)](https://swmansion.com/contact/projects?utm_source=fishjam&utm_medium=js-server-readme)
